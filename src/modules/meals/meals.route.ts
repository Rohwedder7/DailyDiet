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

// Define as rotas de refeições no FastifyInstance
export const mealsRoute = async (app: FastifyInstance) => {
  const mealsService = new MealsService(prisma)

  // Criar uma nova refeição
  app.post('/meals', { preHandler: [app.authenticate] }, async (request, reply) => {
    // Extrai o ID do usuário do token JWT decodificado
    const userId = (request.user as any).sub ?? (request.user as any).id
    // Valida o corpo da requisição usando o esquema definido
    const body = mealBodySchema.parse(request.body)

    // Chama o serviço de refeições para criar a nova refeição
    const meal = await mealsService.createMeal(
      body.name,
      body.description,
      body.date,
      body.isOnDiet,
      userId,
    )

    // Valida a resposta usando o esquema definido
    const responseData = mealResponseSchema.parse(meal)
    return reply.status(201).send(responseData)
  })

  // Listar todas do usuário
  app.get('/meals', { preHandler: [app.authenticate] }, async (request, reply) => {
    // Extrai o ID do usuário do token JWT decodificado
    const userId = (request.user as any).sub ?? (request.user as any).id

    // Chama o serviço de refeições para listar as refeições do usuário
    const meals = await mealsService.listMealsByUser(userId)
    // Valida a resposta usando o esquema definido
    const responseData = mealsListResponseSchema.parse(meals)

    // Retorna a lista de refeições
    return reply.send(responseData)
  })

  // Métricas do usuário
  app.get('/meals/metrics', { preHandler: [app.authenticate] }, async (request, reply) => {
    // Extrai o ID do usuário do token JWT decodificado
    const userId = (request.user as any).sub ?? (request.user as any).id

    // Chama o serviço de refeições para obter as métricas do usuário
    const metrics = await mealsService.listMealsStatistics(userId)
    // Valida a resposta usando o esquema definido
    const responseData = mealsMetricsResponseSchema.parse(metrics)

    // Retorna as métricas das refeições
    return reply.send(responseData)
  })

  // Visualizar uma única refeição (do usuário)
  app.get('/meals/:mealId', { preHandler: [app.authenticate] }, async (request, reply) => {
    // Extrai o ID do usuário do token JWT decodificado
    const userId = (request.user as any).sub ?? (request.user as any).id
    // Valida os parâmetros da rota usando o esquema definido
    const params = mealParamsSchema.parse(request.params)

    // Chama o serviço de refeições para obter a refeição específica
    const meal = await mealsService.getMealById(params.mealId, userId)
    // Se a refeição não for encontrada, retorna 404
    if (!meal) return reply.status(404).send({ message: 'Refeição não encontrada' })

    // Valida a resposta usando o esquema definido
    const responseData = mealResponseSchema.parse(meal)
    // Retorna os dados da refeição
    return reply.send(responseData)
  })

  // Editar (somente do usuário)
  app.put('/meals/:mealId', { preHandler: [app.authenticate] }, async (request, reply) => {
    // Extrai o ID do usuário do token JWT decodificado
    const userId = (request.user as any).sub ?? (request.user as any).id
    // Valida os parâmetros da rota e o corpo da requisição usando os esquemas definidos
    const params = mealParamsSchema.parse(request.params)
    // Valida o corpo da requisição usando o esquema definido
    const body = mealBodySchema.parse(request.body)

    // Chama o serviço de refeições para editar a refeição
    try {
      // Obtém a refeição atualizada
      const updatedMeal = await mealsService.editMeal(
        params.mealId,
        body.name,
        body.description,
        body.date,
        body.isOnDiet,
        userId,
      )

      // Valida a resposta usando o esquema definido
      const responseData = mealResponseSchema.parse(updatedMeal)
      // Retorna os dados da refeição atualizada
      return reply.send(responseData)
      // Captura erros durante a atualização da refeição
    } catch (err) {
      return reply
        .status(404)
        .send({ message: err instanceof Error ? err.message : 'Erro ao atualizar refeição' })
    }
  })

  // Deletar (somente do usuário)
  app.delete('/meals/:mealId', { preHandler: [app.authenticate] }, async (request, reply) => {
    // Extrai o ID do usuário do token JWT decodificado
    const userId = (request.user as any).sub ?? (request.user as any).id
    // Valida os parâmetros da rota usando o esquema definido
    const params = mealParamsSchema.parse(request.params)

    // Chama o serviço de refeições para deletar a refeição
    try {
      // Executa a deleção da refeição
      await mealsService.deleteMeal(params.mealId, userId)
      return reply.status(204).send(
        { message: 'Refeição deletada com sucesso' },
      )
      // Captura erros durante a deleção da refeição
    } catch (err) {
      // Se ocorrer um erro, retorna 404 com a mensagem apropriada
      return reply
        .status(404)
        .send({ message: err instanceof Error ? err.message : 'Erro ao deletar refeição' })
    }
  })
}