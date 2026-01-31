import { Prisma, PrismaClient } from '../../../generated/prisma/client.js'

const publicMealSelect = {
  id: true,
  name: true,
  description: true,
  date: true,
  isOnDiet: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const

type PublicMeal = Prisma.MealGetPayload<{ select: typeof publicMealSelect }>

export class MealsService {
  constructor(private prisma: PrismaClient) {}

  async createMeal(
    name: string,
    description: string,
    date: Date,
    isOnDiet: boolean,
    userId: string,
  ): Promise<PublicMeal> {
    try {
      return await this.prisma.meal.create({
        data: {
          name,
          description,
          date,
          isOnDiet,
          user: { connect: { id: userId } },

        },
        select: publicMealSelect,
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new Error('Usuário não encontrado para vincular a refeição')
      }
      throw err
    }
  }

  async editMeal(
    mealId: string,
    name: string,
    description: string,
    date: Date,
    isOnDiet: boolean,
    userId: string,
  ): Promise<PublicMeal> {
    const updated = await this.prisma.meal.updateMany({
      where: { id: mealId, userId },
      data: { name, description, date, isOnDiet },
    })

    if (updated.count === 0) {
      throw new Error('Refeição não encontrada ou sem permissão para editar')
    }

    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
      select: publicMealSelect,
    })

    if (!meal) {
      throw new Error('Refeição não encontrada após atualização')
    }

    return meal
  }

  async deleteMeal(mealId: string, userId: string): Promise<void> {
    const deleted = await this.prisma.meal.deleteMany({
      where: { id: mealId, userId },
    })

    if (deleted.count === 0) {
      throw new Error('Refeição não encontrada ou sem permissão para deletar')
    }
  }

  async listMealsByUser(userId: string): Promise<PublicMeal[]> {
    return this.prisma.meal.findMany({
      where: { userId },
      select: publicMealSelect,
      orderBy: { date: 'asc' },
    })
  }

  async getMealById(mealId: string, userId: string): Promise<PublicMeal | null> {
    return this.prisma.meal.findFirst({
      where: { id: mealId, userId },
      select: publicMealSelect,
    })
  }

  async listMealsStatistics(userId: string): Promise<{
    totalMeals: number
    totalOnDiet: number
    totalOffDiet: number
    bestOnDietSequence: number
  }> {
    const rows = await this.prisma.$queryRaw<
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

    const row = rows[0] ?? {
      totalMeals: 0,
      totalOnDiet: 0,
      totalOffDiet: 0,
      bestOnDietSequence: 0,
    }

    return {
      totalMeals: Number(row.totalMeals),
      totalOnDiet: Number(row.totalOnDiet),
      totalOffDiet: Number(row.totalOffDiet),
      bestOnDietSequence: Number(row.bestOnDietSequence),
    }
  }
}
