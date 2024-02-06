import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import fastify from 'fastify'

const app = fastify()
const prisma = new PrismaClient()

app.get('/polls', async (request, reply) => {
  const response = await prisma.poll.findMany()

  return reply.status(200).send(response)
})

app.post('/polls', async (request, reply) => {
  const pollsBodySchema = z.object({
    title: z.string(),
  })

  const { title } = pollsBodySchema.parse(request.body)

  const response = await prisma.poll.create({ data: { title } })

  return reply.status(201).send(response)
})

app.listen({ port: 3000 }).then((address) => console.log(address))
