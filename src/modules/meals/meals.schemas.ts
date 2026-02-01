import { z } from 'zod'

// Define o esquema de validação para o corpo da requisição de criação/atualização de uma refeição
const dateInputSchema = z.preprocess((value) => {
  // Se o valor já for uma data, retorna como está
  if (value instanceof Date) return value

  // Se o valor for uma string, tenta convertê-la para uma data
  if (typeof value === 'string') {
    const raw = value.trim()

    // Tenta casar a string com o formato DD/MM/YYYY ou DD-MM-YYYY, opcionalmente com hora e minuto
    const match = raw.match(
      /^(\d{2})[\/-](\d{2})[\/-](\d{4})(?:\s+(\d{2}):(\d{2}))?$/,
    )

    // Se casar, extrai os componentes e cria uma nova data
    if (match) {
      const day = Number(match[1])
      const month = Number(match[2])
      const year = Number(match[3])
      const hour = match[4] ? Number(match[4]) : 0
      const minute = match[5] ? Number(match[5]) : 0

      // Cria e retorna a data com os componentes extraídos
      return new Date(year, month - 1, day, hour, minute, 0, 0)
    }

    // Se não casar com o formato esperado, tenta criar a data diretamente
    return new Date(raw)
  }

  // Para outros tipos, retorna como está
  return value
  // Tenta converter o valor para uma data e valida se é uma data válida
}, z.date()).refine((d) => !Number.isNaN(d.getTime()), { message: 'Invalid date' })

// Esquema para o corpo da requisição de criação/atualização de refeição
export const mealBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  date: dateInputSchema,
  isOnDiet: z.coerce.boolean(), // aceita true/false e "true"/"false"
})

// Esquema para os parâmetros da rota que envolvem o ID da refeição
export const mealParamsSchema = z.object({
  mealId: z.string().uuid(),
})

// Esquema para a resposta que retorna os dados de uma refeição
export const mealResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  date: z.date(),
  isOnDiet: z.boolean(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Esquema para a resposta que retorna uma lista de refeições
export const mealsListResponseSchema = z.array(mealResponseSchema)

// Esquema para a resposta que retorna as métricas das refeições
export const mealsMetricsResponseSchema = z.object({
  totalMeals: z.number().int().nonnegative(),
  totalOnDiet: z.number().int().nonnegative(),
  totalOffDiet: z.number().int().nonnegative(),
  bestOnDietSequence: z.number().int().nonnegative(),
})

// Define os tipos TypeScript inferidos a partir dos esquemas zod
// Aqui é importante para garantir a tipagem correta nas rotas de refeições, sem ela o TypeScript não reconhece os tipos corretos
export type MealBody = z.infer<typeof mealBodySchema>
export type MealParams = z.infer<typeof mealParamsSchema>
export type MealResponse = z.infer<typeof mealResponseSchema>
export type MealsListResponse = z.infer<typeof mealsListResponseSchema>
export type MealsMetricsResponse = z.infer<typeof mealsMetricsResponseSchema>
