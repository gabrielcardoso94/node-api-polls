import fastify from 'fastify'

const app = fastify()

app.get('/', (request, reply) => {
  return 'Hello'
})

app.listen({ port: 3000 }).then((address) => console.log(address))
