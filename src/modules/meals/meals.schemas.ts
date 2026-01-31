import { z } from 'zod'

const dateInputSchema = z.preprocess((value) => {
  // já veio Date
  if (value instanceof Date) return value

  if (typeof value === 'string') {
    const raw = value.trim()

    // aceita:
    // 30-01-2026
    // 30/01/2026
    // 30-01-2026 14:30
    // 30/01/2026 14:30
    const match = raw.match(
      /^(\d{2})[\/-](\d{2})[\/-](\d{4})(?:\s+(\d{2}):(\d{2}))?$/,
    )

    if (match) {
      const day = Number(match[1])
      const month = Number(match[2])
      const year = Number(match[3])
      const hour = match[4] ? Number(match[4]) : 0
      const minute = match[5] ? Number(match[5]) : 0

      // Interpreta como horário local (se preferir UTC, eu ajusto)
      return new Date(year, month - 1, day, hour, minute, 0, 0)
    }

    // fallback: tenta ISO (ex.: 2026-01-30T12:00:00.000Z)
    return new Date(raw)
  }

  return value
}, z.date()).refine((d) => !Number.isNaN(d.getTime()), { message: 'Invalid date' })

export const mealBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  date: dateInputSchema,
  isOnDiet: z.coerce.boolean(), // aceita true/false e "true"/"false"
})

export const mealParamsSchema = z.object({
  mealId: z.string().uuid(),
})

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

export const mealsListResponseSchema = z.array(mealResponseSchema)

export const mealsMetricsResponseSchema = z.object({
  totalMeals: z.number().int().nonnegative(),
  totalOnDiet: z.number().int().nonnegative(),
  totalOffDiet: z.number().int().nonnegative(),
  bestOnDietSequence: z.number().int().nonnegative(),
})

export type MealBody = z.infer<typeof mealBodySchema>
export type MealParams = z.infer<typeof mealParamsSchema>
export type MealResponse = z.infer<typeof mealResponseSchema>
export type MealsListResponse = z.infer<typeof mealsListResponseSchema>
export type MealsMetricsResponse = z.infer<typeof mealsMetricsResponseSchema>
