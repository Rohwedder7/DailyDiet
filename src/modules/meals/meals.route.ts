import type { FastifyInstance } from 'fastify'
import { MealsService } from './meals.service.js'
import { prisma } from '../../lib/prisma.js'
import {
  mealResponseSchema,
  mealBodySchema,
  mealParamsSchema,
  mealsListResponseSchema,
  mealsMetricsResponseSchema,
} from './meals.schemas.js'

export const mealsRoute = async (app: FastifyInstance) => {
  const mealsService = new MealsService(prisma)

  // Criar
  app.post('/meals', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).sub ?? (request.user as any).id
    const body = mealBodySchema.parse(request.body)

    const meal = await mealsService.createMeal(
      body.name,
      body.description,
      body.date,
      body.isOnDiet,
      userId,
    )

    const responseData = mealResponseSchema.parse(meal)
    return reply.status(201).send(responseData)
  })

  // Listar todas do usuário
  app.get('/meals', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).sub ?? (request.user as any).id

    const meals = await mealsService.listMealsByUser(userId)
    const responseData = mealsListResponseSchema.parse(meals)

    return reply.send(responseData)
  })

  // Métricas do usuário
  app.get('/meals/metrics', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).sub ?? (request.user as any).id

    const metrics = await mealsService.listMealsStatistics(userId)
    const responseData = mealsMetricsResponseSchema.parse(metrics)

    return reply.send(responseData)
  })

  // Visualizar uma única refeição (do usuário)
  app.get('/meals/:mealId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).sub ?? (request.user as any).id
    const params = mealParamsSchema.parse(request.params)

    const meal = await mealsService.getMealById(params.mealId, userId)
    if (!meal) return reply.status(404).send({ message: 'Refeição não encontrada' })

    const responseData = mealResponseSchema.parse(meal)
    return reply.send(responseData)
  })

  // Editar (somente do usuário)
  app.put('/meals/:mealId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).sub ?? (request.user as any).id
    const params = mealParamsSchema.parse(request.params)
    const body = mealBodySchema.parse(request.body)

    try {
      const updatedMeal = await mealsService.editMeal(
        params.mealId,
        body.name,
        body.description,
        body.date,
        body.isOnDiet,
        userId,
      )

      const responseData = mealResponseSchema.parse(updatedMeal)
      return reply.send(responseData)
    } catch (err) {
      return reply
        .status(404)
        .send({ message: err instanceof Error ? err.message : 'Erro ao atualizar refeição' })
    }
  })

  app.delete('/meals/:mealId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).sub ?? (request.user as any).id
    const params = mealParamsSchema.parse(request.params)

    try {
      await mealsService.deleteMeal(params.mealId, userId)
      return reply.status(204).send(
        { message: 'Refeição deletada com sucesso' },
      )
    } catch (err) {
      return reply
        .status(404)
        .send({ message: err instanceof Error ? err.message : 'Erro ao deletar refeição' })
    }
  })
}