import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import z from 'zod'
import { randomUUID } from 'node:crypto'

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

    return reply.status(200).send(response)
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

    reply.status(200).send()
  })
}
