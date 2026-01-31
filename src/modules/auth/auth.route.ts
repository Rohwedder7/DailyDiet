import type { FastifyInstance } from 'fastify'
import '@fastify/cookie'
import { AuthService } from './auth.service.js'
import { prisma } from '../../lib/prisma.js'
import { registerBodySchema, loginBodySchema, meResponseSchema } from './auth.schemas.js'
import { env } from '../../env/index.js'

export const authRoute = async (app: FastifyInstance) => {
  const authService = new AuthService(app, prisma)

  app.post('/register', async (request, reply) => {
    try {
      const body = registerBodySchema.parse(request.body)
      const user = await authService.createUser(body.name, body.email, body.password)
      return reply.status(201).send(user)
    } catch (err) {
      return reply
        .status(400)
        .send({ message: err instanceof Error ? err.message : 'Erro ao registrar usuário' })
    }
  })

  app.post('/login', async (request, reply) => {
    const body = loginBodySchema.parse(request.body)

    const authResult = await authService.authenticateUser(body.email, body.password)
    if (!authResult) return reply.status(401).send({ message: 'Credenciais inválidas' })

    // Sem cookie (Opção B):
    return reply.send({ token: authResult.token, user: authResult.user })
  })

  app.get(
    '/me',
    { preHandler: [app.authenticate] },
    async (request, reply) => {

      const userId = (request.user as any).sub ?? (request.user as any).id

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      })

      if (!user) return reply.status(404).send({ message: 'Usuário não encontrado' })

      const responseData = meResponseSchema.parse(user)
      return reply.send(responseData)
    },
  )
}
