import fastifyJwt from '@fastify/jwt'
import fastifyPlugin from 'fastify-plugin'
import { type FastifyReply, type FastifyRequest } from 'fastify'
import { env } from '../env/index.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string }
    user: { id: string; email: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export const authPlugin = fastifyPlugin(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  })

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.status(401).send(err)
    }
  })
})