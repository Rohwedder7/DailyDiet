import { z } from 'zod'
import { config } from 'dotenv'

config()
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3333),
  NOVE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1),
})


export const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error("Invalid environment variables:", _env.error.format())
  throw new Error("Invalid environment variables")
}

export const env = _env.data

