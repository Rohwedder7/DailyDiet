import bcrypt from 'bcrypt'
import { Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import type { FastifyInstance } from 'fastify'

type PublicUser = { id: string; name: string; email: string }

export class AuthService {
  constructor(private app: FastifyInstance, private prisma: PrismaClient) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10
    return bcrypt.hash(password, saltRounds)
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  async createUser(name: string, email: string, password: string): Promise<PublicUser> {
    const hashedPassword = await this.hashPassword(password)

    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        select: { id: true, name: true, email: true },
      })

      return user
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new Error('E-mail já cadastrado')
      }
      throw err
    }
  }

  async authenticateUser(
    email: string,
    password: string,
  ): Promise<{ token: string; user: PublicUser } | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true },
    })

    if (!user) return null

    const ok = await this.verifyPassword(password, user.password)
    if (!ok) return null

    const token = this.app.jwt.sign({ id: user.id, email: user.email }, { sub: user.id })

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    }
  }
}
