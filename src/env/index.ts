import { z } from 'zod'
import { config } from 'dotenv'
// Carrega as variáveis de ambiente do arquivo .env
config()

// Define o esquema de validação para as variáveis de ambiente usando zod
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3333),
  NOVE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1),
})

// Valida as variáveis de ambiente carregadas contra o esquema definido
export const _env = envSchema.safeParse(process.env)

// Se a validação falhar, exibe os erros e lança uma exceção
if (!_env.success) {
  console.error("Invalid environment variables:", _env.error.format())
  throw new Error("Invalid environment variables")
}

// Exporta as variáveis de ambiente validadas para uso na aplicação
export const env = _env.data

