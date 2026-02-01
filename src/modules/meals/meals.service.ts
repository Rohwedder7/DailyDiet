import { Prisma, PrismaClient } from '../../../generated/prisma/client.js'

// Define os campos públicos da entidade Meal para seleção nas consultas
const publicMealSelect = {
  id: true,
  name: true,
  description: true,
  date: true,
  isOnDiet: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const // garante que as propriedades são somente leitura

// Define o tipo TypeScript para uma refeição pública usando o seletor definido acima
type PublicMeal = Prisma.MealGetPayload<{ select: typeof publicMealSelect }>

// Serviço de refeições que lida com operações relacionadas a refeições no banco de dados
export class MealsService {
  // Injeta a instância do PrismaClient no serviço
  constructor(private prisma: PrismaClient) {}

  // Função para criar uma nova refeição no banco de dados
  async createMeal(
    name: string,
    description: string,
    date: Date,
    isOnDiet: boolean,
    userId: string,
  ): Promise<PublicMeal> {
    // Tenta criar a refeição com os dados fornecidos
    try {
      // Chama o Prisma Client para criar a refeição no banco de dados
      return await this.prisma.meal.create({
        data: {
          name,
          description,
          date,
          isOnDiet,
          // Vincula a refeição ao usuário pelo ID
          user: { connect: { id: userId } },

        },
        // Seleciona apenas os campos públicos da refeição para retornar
        select: publicMealSelect,
      })
      // Captura erros específicos do Prisma, como violação de chave estrangeira
    } catch (err) {
      // Verifica se o erro é um erro conhecido do Prisma relacionado a chave estrangeira
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new Error('Usuário não encontrado para vincular a refeição')
      }
      // Re-lança qualquer outro erro que não foi tratado especificamente
      throw err
    }
  }

  // Função para editar uma refeição existente no banco de dados
  async editMeal(
    mealId: string,
    name: string,
    description: string,
    date: Date,
    isOnDiet: boolean,
    userId: string,
  ): Promise<PublicMeal> {
    // Tenta atualizar a refeição com os dados fornecidos
    // Usa updateMany para garantir que a refeição pertence ao usuário
    const updated = await this.prisma.meal.updateMany({
      where: { id: mealId, userId },
      // Define os novos dados para a refeição
      data: { name, description, date, isOnDiet },
    })

    // Se nenhuma linha foi atualizada, lança um erro indicando que a refeição não foi encontrada ou o usuário não tem permissão
    if (updated.count === 0) {
      throw new Error('Refeição não encontrada ou sem permissão para editar')
    }

    // Busca e retorna a refeição atualizada
    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
      select: publicMealSelect,
    })

    // Se a refeição não for encontrada após a atualização, lança um erro
    if (!meal) {
      throw new Error('Refeição não encontrada após atualização')
    }

    // Retorna a refeição atualizada
    return meal
  }

  // Função para deletar uma refeição do banco de dados
  async deleteMeal(mealId: string, userId: string): Promise<void> {
    const deleted = await this.prisma.meal.deleteMany({
      where: { id: mealId, userId },
    })

    // Se nenhuma linha foi deletada, lança um erro indicando que a refeição não foi encontrada ou o usuário não tem permissão
    if (deleted.count === 0) {
      throw new Error('Refeição não encontrada ou sem permissão para deletar')
    }
  }

  // Função para listar todas as refeições de um usuário
  async listMealsByUser(userId: string): Promise<PublicMeal[]> {
    return this.prisma.meal.findMany({
      where: { userId },
      // Seleciona apenas os campos públicos da refeição para retornar
      select: publicMealSelect,
      // Ordena as refeições pela data em ordem ascendente
      orderBy: { date: 'asc' },
    })
  }

  // Função para obter uma refeição específica pelo ID e usuário
  async getMealById(mealId: string, userId: string): Promise<PublicMeal | null> {
    // Busca a refeição pelo ID e usuário, retornando apenas os campos públicos
    return this.prisma.meal.findFirst({
      where: { id: mealId, userId },
      select: publicMealSelect,
    })
  }

  // Função para listar as estatísticas das refeições de um usuário
  async listMealsStatistics(userId: string): Promise<{
    totalMeals: number
    totalOnDiet: number
    totalOffDiet: number
    bestOnDietSequence: number
  }> {
    // Consulta SQL bruta para calcular as estatísticas das refeições
    const rows = await this.prisma.$queryRaw<
    // Define o tipo da linha retornada pela consulta
      Array<{
        totalMeals: unknown
        totalOnDiet: unknown
        totalOffDiet: unknown
        bestOnDietSequence: unknown
      }>
    >`
      WITH ordered AS (
        SELECT
          "userId",
          "date",
          "isOnDiet",
          ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "date") AS rn_all,
          ROW_NUMBER() OVER (PARTITION BY "userId", "isOnDiet" ORDER BY "date") AS rn_by_flag
        FROM "Meal"
        WHERE "userId" = ${userId}
      ),
      on_diet_islands AS (
        SELECT ("rn_all" - "rn_by_flag") AS grp
        FROM ordered
        WHERE "isOnDiet" = true
      ),
      best AS (
        SELECT COALESCE(MAX(cnt), 0) AS best_seq
        FROM (
          SELECT grp, COUNT(*) AS cnt
          FROM on_diet_islands
          GROUP BY grp
        ) t
      )
      SELECT
        (SELECT COUNT(*) FROM "Meal" WHERE "userId" = ${userId}) AS "totalMeals",
        (SELECT COUNT(*) FROM "Meal" WHERE "userId" = ${userId} AND "isOnDiet" = true) AS "totalOnDiet",
        (SELECT COUNT(*) FROM "Meal" WHERE "userId" = ${userId} AND "isOnDiet" = false) AS "totalOffDiet",
        (SELECT best_seq FROM best) AS "bestOnDietSequence"
      LIMIT 1;
    `

    // Extrai os valores da primeira linha retornada ou define valores padrão se nenhuma linha for retornada
    const row = rows[0] ?? {
      totalMeals: 0,
      totalOnDiet: 0,
      totalOffDiet: 0,
      bestOnDietSequence: 0,
    }

    // Retorna as estatísticas convertidas para números
    return {
      totalMeals: Number(row.totalMeals),
      totalOnDiet: Number(row.totalOnDiet),
      totalOffDiet: Number(row.totalOffDiet),
      bestOnDietSequence: Number(row.bestOnDietSequence),
    }
  }
}
