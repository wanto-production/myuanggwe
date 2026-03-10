import { eq, and, isNull, desc, sql, gte } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { withBackendCache } from '$lib/redis/server'

export const dashboardGroup = createServer({ name: 'dashboard', prefix: '/dashboard' })
  .get(
    '/',
    async (c) => {
      const { activeOrg, user } = c
      const userId = user?.id!
      const orgId = activeOrg?.id

      const cacheKey = orgId ? `dashboard:org:${orgId}` : `dashboard:user:${userId}`

      try {
        const dashboardData = await withBackendCache(
          cacheKey,
          async () => {
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const contextQuery = activeOrg
              ? eq(schema.transactions.organizationId, activeOrg.id)
              : and(eq(schema.transactions.userId, userId), isNull(schema.transactions.organizationId))

            const walletContextQuery = activeOrg
              ? eq(schema.wallets.organizationId, activeOrg.id)
              : and(eq(schema.wallets.userId, userId), isNull(schema.wallets.organizationId))

            const [userWallets, stats, recentTransactions] = await Promise.all([
              db.query.wallets.findMany({
                where: walletContextQuery,
                orderBy: [desc(schema.wallets.createdAt)]
              }),
              db
                .select({
                  type: schema.transactions.type,
                  total: sql<number>`cast(sum(${schema.transactions.amount}) as integer)`
                })
                .from(schema.transactions)
                .where(and(contextQuery, gte(schema.transactions.date, startOfMonth)))
                .groupBy(schema.transactions.type),
              db.query.transactions.findMany({
                where: contextQuery,
                with: {
                  category: true,
                  wallet: true,
                  toWallet: true
                },
                orderBy: [desc(schema.transactions.date)],
                limit: 5
              })
            ])

            return { userWallets, stats, recentTransactions }
          }
        )

        const totalBalance = dashboardData.userWallets.reduce(
          (acc, curr) => acc + curr.balance,
          0
        )

        const monthlyIncome =
          dashboardData.stats.find((s) => s.type === 'income')?.total || 0
        const monthlyExpense =
          dashboardData.stats.find((s) => s.type === 'expense')?.total || 0

        return {
          walletList: dashboardData.userWallets,
          totalBalance,
          walletCount: dashboardData.userWallets.length,
          monthlyIncome,
          monthlyExpense,
          recentTransactions: dashboardData.recentTransactions
        }
      } catch (error) {
        console.error('Dashboard error:', error)
        return {
          walletList: [],
          totalBalance: 0,
          walletCount: 0,
          monthlyIncome: 0,
          monthlyExpense: 0,
          recentTransactions: []
        }
      }
    },
    { auth: true }
  )
  .get('/chart', async (c) => {
    const { activeOrg, user } = c
    const userId = user?.id!
    const orgId = activeOrg?.id

    const cacheKey = orgId ? `chart:org:${orgId}` : `chart:user:${userId}`

    return await withBackendCache(
      cacheKey,
      async () => {
        const contextQuery = activeOrg
          ? eq(schema.transactions.organizationId, activeOrg.id)
          : and(eq(schema.transactions.userId, userId), isNull(schema.transactions.organizationId))

        // Get last 6 months data
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const monthlyData = await db
          .select({
            month: sql<string>`strftime('%Y-%m', ${schema.transactions.date})`,
            type: schema.transactions.type,
            total: sql<number>`cast(sum(${schema.transactions.amount}) as integer)`
          })
          .from(schema.transactions)
          .where(and(contextQuery, gte(schema.transactions.date, sixMonthsAgo)))
          .groupBy(sql`strftime('%Y-%m', ${schema.transactions.date})`, schema.transactions.type)
          .orderBy(sql`strftime('%Y-%m', ${schema.transactions.date})`)

        // Transform to chart format
        const months = [...new Set(monthlyData.map(d => d.month))].sort()

        const chartData = months.map(month => {
          const income = monthlyData.find(d => d.month === month && d.type === 'income')?.total || 0
          const expense = monthlyData.find(d => d.month === month && d.type === 'expense')?.total || 0

          return {
            month: new Date(month + '-01').toLocaleDateString('id-ID', { month: 'short' }),
            income,
            expense
          }
        })

        return chartData
      }
    )
  }, { auth: true })
