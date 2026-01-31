import { z } from 'zod'

export const registerBodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
})

export const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const meResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type MeResponse = z.infer<typeof meResponseSchema>