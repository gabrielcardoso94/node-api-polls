import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import z from 'zod'
import { randomUUID } from 'node:crypto'
import { redis } from '../../lib/redis'
import { votes } from '../../utils/votes-pub-subs'

export async function pollRoutes(app: FastifyInstance) {
  app.get('/polls/:pollId', async (request, reply) => {
    const pollIdSchema = z.object({
      pollId: z.string().uuid(),
    })

    const { pollId } = pollIdSchema.parse(request.params)

    const response = await prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        options: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')
    const score = result.reduce(
      (object, line, index) => {
        if (index % 2 === 0) {
          const votesAmount = result[index + 1]

          Object.assign(object, { [line]: Number(votesAmount) })
        }

        return object
      },
      {} as Record<string, number>,
    )

    return reply.status(200).send({
      id: response?.id,
      title: response?.title,
      options: response?.options.map((option) => {
        return { id: option.id, title: option.title, score: score[option.id] }
      }),
    })
  })

  app.post('/polls', async (request, reply) => {
    const pollsBodySchema = z.object({
      title: z.string(),
      options: z.array(z.string()),
    })

    const { title, options } = pollsBodySchema.parse(request.body)

    const response = await prisma.poll.create({
      data: {
        title,
        options: {
          createMany: {
            data: options.map((option) => {
              return { title: option }
            }),
          },
        },
      },
    })

    return reply.status(201).send(response)
  })

  app.post('/polls/:pollId/votes', async (request, reply) => {
    const voteOnPollBodySchema = z.object({
      pollOptionId: z.string().uuid(),
    })

    const voteOnPollIdSchema = z.object({
      pollId: z.string().uuid(),
    })

    const { pollOptionId } = voteOnPollBodySchema.parse(request.body)
    const { pollId } = voteOnPollIdSchema.parse(request.params)

    let { sessionId } = request.cookies

    if (sessionId) {
      const userPreviusVote = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      })

      if (userPreviusVote && userPreviusVote.pollOptionId !== pollOptionId) {
        await prisma.vote.delete({
          where: {
            id: userPreviusVote.id,
          },
        })

        const votesResult = await redis.zincrby(
          pollId,
          -1,
          userPreviusVote.pollOptionId,
        )

        votes.publish(pollId, {
          pollOptionId: userPreviusVote.pollOptionId,
          votes: Number(votesResult),
        })
      } else if (userPreviusVote) {
        return reply.status(400).send({ message: 'Você já votou!' })
      }
    }

    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        signed: true,
      })
    }

    await prisma.vote.create({ data: { sessionId, pollId, pollOptionId } })

    const votesResult = await redis.zincrby(pollId, 1, pollOptionId)

    votes.publish(pollId, {
      pollOptionId,
      votes: Number(votesResult),
    })

    reply.status(200).send()
  })
}
