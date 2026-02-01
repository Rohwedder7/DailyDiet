import bcrypt from 'bcrypt'
import { Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import type { FastifyInstance } from 'fastify'

// Define um tipo público para o usuário, excluindo informações sensíveis como a senha
type PublicUser = { id: string; name: string; email: string }

// Serviço de autenticação que lida com criação de usuários e autenticação
export class AuthService {
  // Injeta a instância do Fastify e do PrismaClient no serviço
  constructor(private app: FastifyInstance, private prisma: PrismaClient) {}

  // Função para hash de senha usando bcrypt
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10
    return bcrypt.hash(password, saltRounds)
  }

  // Função para verificar a senha comparando com o hash armazenado
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // Função para criar um novo usuário no banco de dados
  async createUser(name: string, email: string, password: string): Promise<PublicUser> {
    // Primeiro, faz o hash da senha fornecida
    const hashedPassword = await this.hashPassword(password)

    // Tenta criar o usuário no banco de dados
    try {
      // Cria o usuário com os dados fornecidos e o hash da senha
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        // Seleciona apenas os campos públicos do usuário para retornar
        select: { id: true, name: true, email: true },
      })

      // Retorna o usuário criado
      return user
      // Captura erros específicos do Prisma, como violação de unicidade no e-mail
    } catch (err) {
      // Verifica se o erro é um erro conhecido do Prisma relacionado a chave única
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Lança um erro específico indicando que o e-mail já está cadastrado
        throw new Error('E-mail já cadastrado')
      }
      // Re-lança qualquer outro erro que não foi tratado especificamente
      throw err
    }
  }

  // Função para autenticar um usuário e gerar um token JWT
  async authenticateUser(
    email: string,
    password: string,
    // Retorna o token JWT e os dados públicos do usuário ou null se a autenticação falhar
  ): Promise<{ token: string; user: PublicUser } | null> {
    // Busca o usuário pelo e-mail no banco de dados
    const user = await this.prisma.user.findUnique({
      where: { email },
      // Seleciona os campos necessários, incluindo a senha para verificação
      select: { id: true, name: true, email: true, password: true },
    })

    // Se o usuário não for encontrado, retorna null
    if (!user) return null

    // Verifica se a senha fornecida corresponde ao hash armazenado
    const ok = await this.verifyPassword(password, user.password)
    // Se a senha não corresponder, retorna null
    if (!ok) return null

    // Gera um token JWT com o id e email do usuário como payload
    const token = this.app.jwt.sign({ id: user.id, email: user.email }, { sub: user.id })

    // Retorna o token e os dados públicos do usuário
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    }
  }
}
