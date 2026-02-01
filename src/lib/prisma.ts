// lib/prisma.ts
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.js'

// Constrói a string de conexão usando a variável de ambiente DATABASE_URL
const connectionString = `${process.env.DATABASE_URL}`

// Inicializa o adaptador Prisma para PostgreSQL com a string de conexão
const adapter = new PrismaPg({ connectionString })
// Cria uma instância do PrismaClient usando o adaptador configurado
const prisma = new PrismaClient({ adapter })
// Exporta a instância do PrismaClient para uso em outras partes da aplicação
export { prisma }