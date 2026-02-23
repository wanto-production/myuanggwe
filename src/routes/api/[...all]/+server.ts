import type { RequestHandler } from '@sveltejs/kit'
import { Elysia, status } from 'elysia'
import { auth } from '$lib/auth/auth'
import { categorySchema, walletSchema, transactionSchema } from '$lib/schemas'
import { eq, and, isNull, desc, sql, gte } from 'drizzle-orm'
import { db } from '$lib/server/db'
import {
  wallets,
  session as sessionTable,
  member,
  transactions,
  categories
} from '$lib/server/db/schema'
import cors from '@elysiajs/cors'
import { withBackendCache, backendCache } from '$lib/cache/server'

const betterAuth = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers })
        if (!session) return status(401)
        return {
          user: session.user,
          session: session.session
        }
      }
    }
  })

const userData = new Elysia({ name: 'layout-data' }).derive(
  { as: 'global' },
  async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user || !session?.session)
      return { activeOrg: null, organizations: [], currentSession: null }

    const layoutData = await withBackendCache(
      `layout:${session.user.id}`,
      async () => {
        const [currentSessionData, userOrgs] = await Promise.all([
          db.query.session.findFirst({
            where: eq(sessionTable.id, session?.session.id),
            columns: { activeOrganizationId: true }
          }),
          db.query.member.findMany({
            where: eq(member.userId, session?.user.id),
            with: { organization: true }
          })
        ])

        return { currentSessionData, userOrgs }
      },
      600
    )

    const activeOrg = layoutData.userOrgs.find(
      (o) => o.organizationId === layoutData.currentSessionData?.activeOrganizationId
    )?.organization

    return {
      activeOrg: activeOrg ?? null,
      organizations: layoutData.userOrgs.map((o) => o.organization),
      currentSession: layoutData.currentSessionData
    }
  }
)

// Helper for cache invalidation
async function invalidateUserCache(userId: string, orgId?: string | null) {
  const patterns = [
    `layout:${userId}`,
    `dashboard:user:${userId}`,
    `wallets:user:${userId}`,
    `transactions:user:${userId}`,
    `categories:user:${userId}`
  ]

  if (orgId) {
    patterns.push(
      `dashboard:org:${orgId}`,
      `wallets:org:${orgId}`,
      `transactions:org:${orgId}`,
      `categories:org:${orgId}`
    )
  }

  await Promise.all(patterns.map((p) => backendCache.del(p)))
}

const app = new Elysia({ prefix: '/api' })
  .use(betterAuth)
  .use(userData)
  .use(
    cors({
      origin: ['http://localhost:5173', 'https://myuanggwe.vercel.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  )

  // =========================================================================================
  // Layout
  // =========================================================================================
  .get(
    '/layout',
    async (c) => {
      const { user, session: authSession, organizations, activeOrg } = c
      if (!authSession) {
        return { user: null, activeOrg: null, organizations: [] }
      }
      return { user, session: authSession, organizations, activeOrg }
    },
    { auth: true }
  )

  // =========================================================================================
  // Change Orgs
  // =========================================================================================
  .put('/changeOrgs/:id', async (c) => {
    const { user } = c
    const orgIdParam = c.params.id

    try {
      // Convert 'personal' keyword to null
      const targetOrgId = orgIdParam === 'personal' ? null : orgIdParam

      // Switch organization
      await auth.api.setActiveOrganization({
        body: {
          organizationId: targetOrgId
        },
        headers: c.request.headers as any
      })

      // Invalidate all user cache
      await invalidateUserCache(user.id, targetOrgId)

      return {
        success: true,
        message: targetOrgId
          ? 'Organization switched successfully!'
          : 'Switched to personal account!',
        organizationId: targetOrgId
      }
    } catch (e) {
      console.error('Change org error:', e)
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to switch organization'
      }
    }
  }, { auth: true })

  // =========================================================================================
  // Dashboard
  // =========================================================================================
  .get(
    '/dashboard',
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
              ? eq(transactions.organizationId, activeOrg.id)
              : and(eq(transactions.userId, userId), isNull(transactions.organizationId))

            const walletContextQuery = activeOrg
              ? eq(wallets.organizationId, activeOrg.id)
              : and(eq(wallets.userId, userId), isNull(wallets.organizationId))

            const [userWallets, stats, recentTransactions] = await Promise.all([
              db.query.wallets.findMany({
                where: walletContextQuery,
                orderBy: [desc(wallets.createdAt)]
              }),
              db
                .select({
                  type: transactions.type,
                  total: sql<number>`cast(sum(${transactions.amount}) as integer)`
                })
                .from(transactions)
                .where(and(contextQuery, gte(transactions.date, startOfMonth)))
                .groupBy(transactions.type),
              db.query.transactions.findMany({
                where: contextQuery,
                with: {
                  category: true,
                  wallet: true,
                  toWallet: true
                },
                orderBy: [desc(transactions.date)],
                limit: 5
              })
            ])

            return { userWallets, stats, recentTransactions }
          },
          300
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

  // =========================================================================================
  // Wallets
  // =========================================================================================
  .group('/wallets', (app) => {
    return app
      .get(
        '/',
        async ({ user, activeOrg }) => {
          const cacheKey = activeOrg
            ? `wallets:org:${activeOrg.id}`
            : `wallets:user:${user.id}`

          const walletList = await withBackendCache(
            cacheKey,
            async () => {
              return await db.query.wallets.findMany({
                where: activeOrg
                  ? eq(wallets.organizationId, activeOrg.id)
                  : and(eq(wallets.userId, user.id), isNull(wallets.organizationId)),
                orderBy: (wallets, { desc }) => [desc(wallets.createdAt)]
              })
            },
            300
          )

          return { walletList }
        },
        { auth: true }
      )

      .post(
        '/create',
        async (c) => {
          const { user, activeOrg, body } = c

          try {
            await db.insert(wallets).values({
              id: crypto.randomUUID(),
              name: body.name,
              type: body.type,
              balance: body.balance,
              userId: user!.id,
              organizationId: activeOrg?.id ?? null
            })

            await invalidateUserCache(user!.id, activeOrg?.id)

            return { message: 'wallets created' }
          } catch (e) {
            console.error(e)
            return { message: 'Gagal membuat dompet' }
          }
        },
        { auth: true, body: walletSchema }
      )

      .put(
        '/edit/:id',
        async (c) => {
          const { user, activeOrg, body, params } = c

          try {
            await db
              .update(wallets)
              .set({
                name: body.name,
                type: body.type,
                balance: body.balance
              })
              .where(eq(wallets.id, params.id))

            await invalidateUserCache(user!.id, activeOrg?.id)

            return { message: 'wallets updated' }
          } catch (e) {
            console.error(e)
            return { message: 'Gagal update dompet' }
          }
        },
        { auth: true, body: walletSchema }
      )

      .delete(
        '/erase/:id',
        async ({ params, user, activeOrg }) => {
          try {
            await db.delete(wallets).where(eq(wallets.id, params.id))

            await invalidateUserCache(user.id, activeOrg?.id)

            return { message: 'wallets deleted' }
          } catch (e) {
            console.error(e)
            return { message: 'Gagal hapus dompet' }
          }
        },
        { auth: true }
      )
  })

  // =========================================================================================
  // Transactions
  // =========================================================================================
  .group('/transactions', (app) => {
    return app
      .get(
        '/',
        async (c) => {
          const { user, activeOrg } = c

          const cacheKey = activeOrg
            ? `transactions:org:${activeOrg.id}`
            : `transactions:user:${user.id}`

          const transactionList = await withBackendCache(
            cacheKey,
            async () => {
              return await db.query.transactions.findMany({
                where: activeOrg
                  ? eq(transactions.organizationId, activeOrg.id)
                  : and(eq(transactions.userId, user.id), isNull(transactions.organizationId)),
                with: {
                  wallet: true,
                  toWallet: true,
                  category: true
                },
                orderBy: (transactions, { desc }) => [desc(transactions.date)]
              })
            },
            300
          )

          return { transactionList }
        },
        { auth: true }
      )

      .post(
        '/create',
        async (c) => {
          const { user } = c
          const { amount, type, walletId, toWalletId, categoryId, description, date } =
            c.body

          const currentSession = c.currentSession
          const orgId = currentSession?.activeOrganizationId || null

          try {
            await db.transaction(async (tx) => {
              // 1. Ambil data dompet pengirim (Wallet A)
              const walletSource = await tx.query.wallets.findFirst({
                where: eq(wallets.id, walletId)
              })
              if (!walletSource) throw new Error('Source wallet not found')

              // 2. CEK SALDO: Pastikan saldo cukup untuk transfer/pengeluaran
              if (type !== 'income' && walletSource.balance < amount) {
                throw new Error('INSUFFICIENT_BALANCE')
              }

              // 3. LOGIKA TRANSAKSI
              if (type === 'transfer') {
                if (!toWalletId) throw new Error('Destination wallet required for transfer')

                // Update Dompet Pengirim (Kurangi Saldo)
                await tx
                  .update(wallets)
                  .set({ balance: walletSource.balance - amount })
                  .where(eq(wallets.id, walletId))

                // Update Dompet Penerima (Tambah Saldo)
                const walletDest = await tx.query.wallets.findFirst({
                  where: eq(wallets.id, toWalletId)
                })
                if (!walletDest) throw new Error('Destination wallet not found')

                await tx
                  .update(wallets)
                  .set({ balance: walletDest.balance + amount })
                  .where(eq(wallets.id, toWalletId))
              } else {
                // Update Dompet Normal (Income/Expense)
                const change = type === 'income' ? amount : -amount
                await tx
                  .update(wallets)
                  .set({ balance: walletSource.balance + change })
                  .where(eq(wallets.id, walletId))
              }

              // 4. INSERT RECORD TRANSAKSI
              const insertPayload: any = {
                amount,
                type: type as 'income' | 'expense' | 'transfer',
                description: description || null,
                walletId,
                userId: user.id,
                organizationId: orgId,
                date: new Date(date)
              }

              // Conditionally add fields based on transaction type
              if (type === 'transfer') {
                insertPayload.toWalletId = toWalletId
              } else {
                if (categoryId) {
                  insertPayload.categoryId = categoryId
                }
              }

              await tx.insert(transactions).values(insertPayload)
            })

            // Invalidate cache after successful transaction
            await invalidateUserCache(user.id, orgId)

            return { message: 'transaksi berhasil!' }
          } catch (e: unknown) {
            console.error(e)
            const message =
              e instanceof Error && e.message === 'INSUFFICIENT_BALANCE'
                ? 'Saldo tidak mencukupi'
                : 'Gagal memproses transaksi'
            return { message }
          }
        },
        { auth: true, body: transactionSchema }
      )

      .put(
        '/edit/:id',
        async (c) => {
          const { user, body, params } = c
          const transactionId = params.id
          const { amount, type, walletId, toWalletId, categoryId, description, date } = body

          const currentSession = c.currentSession
          const orgId = currentSession?.activeOrganizationId || null

          try {
            await db.transaction(async (tx) => {
              // 1. Ambil transaksi lama
              const oldTransaction = await tx.query.transactions.findFirst({
                where: and(eq(transactions.id, transactionId), eq(transactions.userId, user.id))
              })

              if (!oldTransaction) {
                throw new Error('Transaction not found')
              }

              // 2. Revert efek transaksi lama pada saldo dompet
              const oldAmount = oldTransaction.amount
              const oldType = oldTransaction.type
              const oldWalletId = oldTransaction.walletId
              const oldToWalletId = oldTransaction.toWalletId

              // Dapatkan saldo dompet lama saat ini untuk diperbarui
              const currentOldWalletSource = await tx.query.wallets.findFirst({
                where: eq(wallets.id, oldWalletId)
              })
              if (!currentOldWalletSource) throw new Error('Old source wallet not found')

              // Revert saldo dompet sumber lama
              if (oldType === 'income') {
                await tx
                  .update(wallets)
                  .set({ balance: currentOldWalletSource.balance - oldAmount })
                  .where(eq(wallets.id, oldWalletId))
              } else if (oldType === 'expense') {
                await tx
                  .update(wallets)
                  .set({ balance: currentOldWalletSource.balance + oldAmount })
                  .where(eq(wallets.id, oldWalletId))
              } else if (oldType === 'transfer' && oldToWalletId) {
                const currentOldWalletDestination = await tx.query.wallets.findFirst({
                  where: eq(wallets.id, oldToWalletId)
                })
                if (!currentOldWalletDestination)
                  throw new Error('Old destination wallet not found')

                await tx
                  .update(wallets)
                  .set({ balance: currentOldWalletSource.balance + oldAmount })
                  .where(eq(wallets.id, oldWalletId))
                await tx
                  .update(wallets)
                  .set({ balance: currentOldWalletDestination.balance - oldAmount })
                  .where(eq(wallets.id, oldToWalletId))
              }

              // 3. Terapkan efek transaksi baru pada saldo dompet
              // PENTING: Ambil ulang saldo wallet setelah di-revert
              const newWalletSource = await tx.query.wallets.findFirst({
                where: eq(wallets.id, walletId)
              })
              if (!newWalletSource) throw new Error('New source wallet not found')

              // Cek saldo untuk transaksi baru (jika bukan income)
              if (type !== 'income' && newWalletSource.balance < amount) {
                throw new Error('INSUFFICIENT_BALANCE')
              }

              if (type === 'transfer') {
                if (!toWalletId) throw new Error('Destination wallet required for transfer')

                const newWalletDestination = await tx.query.wallets.findFirst({
                  where: eq(wallets.id, toWalletId)
                })
                if (!newWalletDestination) throw new Error('New destination wallet not found')

                await tx
                  .update(wallets)
                  .set({ balance: newWalletSource.balance - amount })
                  .where(eq(wallets.id, walletId))
                await tx
                  .update(wallets)
                  .set({ balance: newWalletDestination.balance + amount })
                  .where(eq(wallets.id, toWalletId))
              } else {
                const change = type === 'income' ? amount : -amount
                await tx
                  .update(wallets)
                  .set({ balance: newWalletSource.balance + change })
                  .where(eq(wallets.id, walletId))
              }

              // 4. Perbarui record transaksi
              const updatePayload: any = {
                amount,
                type: type as 'income' | 'expense' | 'transfer',
                description: description || null,
                walletId,
                userId: user.id,
                organizationId: orgId,
                date: new Date(date)
              }

              // Conditionally add fields based on transaction type
              if (type === 'transfer') {
                updatePayload.toWalletId = toWalletId || null
              } else {
                updatePayload.toWalletId = null
                if (categoryId) {
                  updatePayload.categoryId = categoryId
                }
              }

              await tx
                .update(transactions)
                .set(updatePayload)
                .where(eq(transactions.id, transactionId))
            })

            // Invalidate cache after successful update
            await invalidateUserCache(user.id, orgId)

            return { message: 'Transaksi berhasil diperbarui!' }
          } catch (e: unknown) {
            console.error(e)
            const message =
              e instanceof Error && e.message === 'INSUFFICIENT_BALANCE'
                ? 'Saldo tidak mencukupi'
                : e instanceof Error && e.message.includes('wallet not found')
                  ? e.message
                  : 'Gagal memperbarui transaksi'
            return { message }
          }
        },
        { auth: true, body: transactionSchema }
      )

      .delete(
        '/erase/:id',
        async (c) => {
          const { user, currentSession } = c
          const transactionId = c.params.id
          const orgId = currentSession?.activeOrganizationId

          try {
            await db.transaction(async (tx) => {
              // 1. Ambil data transaksi yang akan dihapus
              const transaction = await tx.query.transactions.findFirst({
                where: and(eq(transactions.id, transactionId), eq(transactions.userId, user.id))
              })

              if (!transaction) {
                throw new Error('Transaction not found')
              }

              const { amount, type, walletId, toWalletId } = transaction

              // 2. Ambil data wallet sumber
              const walletSource = await tx.query.wallets.findFirst({
                where: eq(wallets.id, walletId)
              })

              if (!walletSource) {
                throw new Error('Source wallet not found')
              }

              // 3. Revert saldo berdasarkan tipe transaksi
              if (type === 'income') {
                // Jika income, kurangi saldo (karena uang masuk akan dibatalkan)
                await tx
                  .update(wallets)
                  .set({ balance: walletSource.balance - amount })
                  .where(eq(wallets.id, walletId))
              } else if (type === 'expense') {
                // Jika expense, tambah saldo (karena pengeluaran dibatalkan)
                await tx
                  .update(wallets)
                  .set({ balance: walletSource.balance + amount })
                  .where(eq(wallets.id, walletId))
              } else if (type === 'transfer' && toWalletId) {
                // Jika transfer, kembalikan saldo ke wallet sumber dan kurangi dari wallet tujuan
                const walletDestination = await tx.query.wallets.findFirst({
                  where: eq(wallets.id, toWalletId)
                })

                if (!walletDestination) {
                  throw new Error('Destination wallet not found')
                }

                // Kembalikan uang ke wallet sumber
                await tx
                  .update(wallets)
                  .set({ balance: walletSource.balance + amount })
                  .where(eq(wallets.id, walletId))

                // Kurangi uang dari wallet tujuan
                await tx
                  .update(wallets)
                  .set({ balance: walletDestination.balance - amount })
                  .where(eq(wallets.id, toWalletId))
              }

              // 4. Hapus transaksi
              await tx.delete(transactions).where(eq(transactions.id, transactionId))
            })

            // Invalidate cache after successful deletion
            await invalidateUserCache(user.id, orgId)

            return { message: 'Transaksi berhasil dihapus dan saldo dikembalikan' }
          } catch (e: unknown) {
            console.error(e)
            const message = e instanceof Error ? e.message : 'Gagal menghapus transaksi'
            return { message }
          }
        },
        { auth: true }
      )
  })

  // =========================================================================================
  // Categories
  // =========================================================================================
  .group('/categories', (app) => {
    return app
      .get(
        '/',
        async (c) => {
          const { user, currentSession } = c
          const orgId = currentSession?.activeOrganizationId

          const cacheKey = orgId ? `categories:org:${orgId}` : `categories:user:${user.id}`

          return await withBackendCache(
            cacheKey,
            async () => {
              const queryUserOrgs = await db.query.member.findMany({
                where: eq(member.userId, user.id),
                with: { organization: true }
              })

              const activeOrg = queryUserOrgs.find(
                (o) => o.organizationId === currentSession?.activeOrganizationId
              )?.organization

              const categoryList = await db.query.categories.findMany({
                where: activeOrg
                  ? eq(categories.organizationId, activeOrg.id)
                  : and(eq(categories.userId, user.id), isNull(categories.organizationId))
              })

              return { categoryList, activeOrg: activeOrg || null }
            },
            600
          )
        },
        { auth: true }
      )

      .post(
        '/create',
        async (c) => {
          const { user, session: authSession } = c
          const currentSession = await db.query.session.findFirst({
            where: eq(sessionTable.id, authSession.id)
          })

          await db.insert(categories).values({
            ...c.body,
            userId: user.id,
            organizationId: currentSession?.activeOrganizationId || null
          })

          await invalidateUserCache(user.id, currentSession?.activeOrganizationId)

          return { message: 'category created!' }
        },
        { auth: true, body: categorySchema }
      )

      .delete(
        '/remove/:id',
        async (c) => {
          const { user, currentSession } = c
          try {
            await db
              .delete(categories)
              .where(and(eq(categories.userId, user.id), eq(categories.id, c.params.id)))

            await invalidateUserCache(user.id, currentSession?.activeOrganizationId)

            return { message: 'delete category complete' }
          } catch (e) {
            return { message: (e as Error).message }
          }
        },
        { auth: true }
      )

      .put(
        '/edit/:id',
        async (c) => {
          const { user, currentSession } = c
          try {
            await db
              .update(categories)
              .set({ ...c.body })
              .where(and(eq(categories.userId, user.id), eq(categories.id, c.params.id)))

            await invalidateUserCache(user.id, currentSession?.activeOrganizationId)

            return { message: 'category update' }
          } catch (e) {
            return { message: 'cannot update category' }
          }
        },
        { auth: true, body: categorySchema }
      )
  })

export type App = typeof app
export const fallback: RequestHandler = ({ request }) => app.handle(request)
