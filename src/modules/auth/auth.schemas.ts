import { z } from 'zod'

// Define os esquemas de validação para os corpos das requisições e respostas relacionadas ao registro do usuário
export const registerBodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
})

// Define o esquema de validação para o corpo da requisição de login
export const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

// Define o esquema de validação para a resposta da rota "me"
export const meResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
})

// Define os tipos TypeScript inferidos a partir dos esquemas zod
// Aqui é importante para garantir a tipagem correta nas rotas de autenticação, sem ela o TypeScript não reconhece os tipos corretos
export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type MeResponse = z.infer<typeof meResponseSchema>