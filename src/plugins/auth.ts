import fastifyJwt from '@fastify/jwt'
import fastifyPlugin from 'fastify-plugin'
import { type FastifyReply, type FastifyRequest } from 'fastify'
import { env } from '../env/index.js'

// Extende os tipos do FastifyJWT para incluir o payload e o usuário com id e email
//Aqui é importante colocar o declare module para extender os tipos do fastify-jwt
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string }
    user: { id: string; email: string }
  }
}

// Extende os tipos do FastifyInstance para incluir o método authenticate
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

// Define o plugin de autenticação usando fastify-plugin
export const authPlugin = fastifyPlugin(async (fastify) => {
  // Registra o plugin fastify-jwt com o segredo JWT da configuração de ambiente
  fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  })
  // Adiciona o método authenticate ao FastifyInstance para verificar tokens JWT
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Verifica o token JWT no cabeçalho da requisição
      await request.jwtVerify()
      // Se a verificação for bem-sucedida, permite o acesso
    } catch (err) {
      return reply.status(401).send(err)
    }
  })
})