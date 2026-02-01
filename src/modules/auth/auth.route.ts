import type { FastifyInstance } from 'fastify'
import '@fastify/cookie'
import { AuthService } from './auth.service.js'
import { prisma } from '../../lib/prisma.js'
import { registerBodySchema, loginBodySchema, meResponseSchema } from './auth.schemas.js'
import { env } from '../../env/index.js'

// Define as rotas de autenticação no FastifyInstance
export const authRoute = async (app: FastifyInstance) => {
  // Cria uma instância do AuthService para usar nas rotas
  const authService = new AuthService(app, prisma)

  // Rota para registrar um novo usuário
  app.post('/register', async (request, reply) => {
    // Tenta registrar o usuário com os dados fornecidos
    try {
      // Valida o corpo da requisição usando o esquema definido
      const body = registerBodySchema.parse(request.body)
      // Chama o serviço de autenticação para criar o usuário
      const user = await authService.createUser(body.name, body.email, body.password)
      // Retorna o usuário criado com status 201
      return reply.status(201).send(user)
      // Captura erros durante o registro do usuário
    } catch (err) {
      return reply
        .status(400)
        // Retorna uma mensagem de erro apropriada
        .send({ message: err instanceof Error ? err.message : 'Erro ao registrar usuário' })
    }
  })

  // Rota para autenticar um usuário e gerar um token JWT
  app.post('/login', async (request, reply) => {
    // Valida o corpo da requisição usando o esquema definido
    const body = loginBodySchema.parse(request.body)

    // Chama o serviço de autenticação para verificar as credenciais do usuário
    const authResult = await authService.authenticateUser(body.email, body.password)
    if (!authResult) return reply.status(401).send({ message: 'Credenciais inválidas' })

      // Se a autenticação for bem-sucedida, retorna o token e os dados do usuário
    return reply.send({ token: authResult.token, user: authResult.user })
  })

  // Rota para obter os dados do usuário autenticado
  app.get(
    '/me',
    // Aplica o middleware de autenticação para proteger a rota
    { preHandler: [app.authenticate] },
    // Manipulador da rota que retorna os dados do usuário autenticado
    async (request, reply) => {

      // Extrai o ID do usuário do token JWT decodificado
      const userId = (request.user as any).sub ?? (request.user as any).id

      // Busca o usuário no banco de dados pelo ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        // Seleciona apenas os campos necessários para a resposta
        select: { id: true, name: true, email: true },
      })

      // Se o usuário não for encontrado, retorna 404
      if (!user) return reply.status(404).send({ message: 'Usuário não encontrado' })

        // Valida e formata a resposta usando o esquema definido
      const responseData = meResponseSchema.parse(user)
      // Retorna os dados do usuário autenticado
      return reply.send(responseData)
    },
  )
}
