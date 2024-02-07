import cookie from '@fastify/cookie'
import fastify from 'fastify'
import { pollRoutes } from './routes/poll'
import websocket from '@fastify/websocket'
import { pollResults } from './routes/poll-results'

const app = fastify()

app.register(pollRoutes)
app.register(cookie, {
  secret: 'node-poll-nlw',
  hook: 'onRequest',
})
app.register(websocket)
app.register(pollResults)

app.listen({ port: 3000 }).then((address) => console.log(address))
