import { FastifyInstance } from 'fastify'
import { votes } from '../../utils/votes-pub-subs'
import z from 'zod'

export async function pollResults(app: FastifyInstance) {
  app.get(
    '/polls/:pollId/results',
    { websocket: true },
    (connection, request) => {
      const pollIdSchema = z.object({
        pollId: z.string().uuid(),
      })

      const { pollId } = pollIdSchema.parse(request.params)

      votes.subscribe(pollId, (message) => {
        connection.socket.send(JSON.stringify(message))
      })
    },
  )
}
