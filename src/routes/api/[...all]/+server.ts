import type { RequestHandler } from '@sveltejs/kit'
import { Elysia } from 'elysia'
import { categorySchema, walletSchema, transactionSchema, organizationSchema, inviteSchema, joinSchema } from '$lib/schemas'
import { eq, and, isNull, desc, sql, gte } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import cors from '@elysiajs/cors'
import { withBackendCache } from '$lib/redis/server'

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
            where: eq(schema.session.id, session?.session.id),
            columns: { activeOrganizationId: true }
          }),
          db.query.member.findMany({
            where: eq(schema.member.userId, session?.user.id),
            with: { organization: true }
          })
        ])

        return { currentSessionData, userOrgs }
      }
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
  // Orgs
  // ========================================================================================= 
  .group('/orgs', (app) => {
    return app
      .put('/change/:id', async (c) => {
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
            headers: c.request.headers
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

      .post('/create', async (c) => {
        try {
          const res = await auth.api.createOrganization({
            body: {
              name: c.body.name,
              slug: c.body.slug, // required
              userId: c.session.userId,
              keepCurrentActiveOrganization: false
            },
            asResponse: true,
          })

          const data = await res.json()

          await auth.api.setActiveOrganization({
            body: {
              organizationId: data.id as string
            },
            headers: c.request.headers
          })

          invalidateUserCache(c.user.id, data.id)

          return {
            success: true,
            message: `create new organizations called ${c.body.name}!`,
          }
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Failed to create organization'
          }
        }
      }, {
        auth: true,
        body: organizationSchema
      })
  })

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
                  ? eq(schema.wallets.organizationId, activeOrg.id)
                  : and(eq(schema.wallets.userId, user.id), isNull(schema.wallets.organizationId)),
                orderBy: (wallets, { desc }) => [desc(wallets.createdAt)]
              })
            }
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
            await db.insert(schema.wallets).values({
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
            const walletContextQuery = activeOrg
              ? eq(schema.wallets.organizationId, activeOrg.id)
              : and(eq(schema.wallets.userId, user.id), isNull(schema.wallets.organizationId))

            const result = await db
              .update(schema.wallets)
              .set({
                name: body.name,
                type: body.type,
                balance: body.balance
              })
              .where(and(eq(schema.wallets.id, params.id), walletContextQuery))

            if (result.rowsAffected === 0) {
              return { success: false, message: 'Wallet not found or access denied' }
            }

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
            const walletContextQuery = activeOrg
              ? eq(schema.wallets.organizationId, activeOrg.id)
              : and(eq(schema.wallets.userId, user.id), isNull(schema.wallets.organizationId))

            const result = await db
              .delete(schema.wallets)
              .where(and(eq(schema.wallets.id, params.id), walletContextQuery))

            if (result.rowsAffected === 0) {
              return { success: false, message: 'Wallet not found or access denied' }
            }

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
                  ? eq(schema.transactions.organizationId, activeOrg.id)
                  : and(eq(schema.transactions.userId, user.id), isNull(schema.transactions.organizationId)),
                with: {
                  wallet: true,
                  toWallet: true,
                  category: true
                },
                orderBy: (transactions, { desc }) => [desc(transactions.date)]
              })
            },
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
            const walletContextQuery = orgId
              ? eq(schema.wallets.organizationId, orgId)
              : and(eq(schema.wallets.userId, user.id), isNull(schema.wallets.organizationId))

            await db.transaction(async (tx) => {
              // 1. Ambil data dompet pengirim (Wallet A)
              const walletSource = await tx.query.wallets.findFirst({
                where: and(eq(schema.wallets.id, walletId), walletContextQuery)
              })
              if (!walletSource) throw new Error('Source wallet not found or access denied')

              // 2. CEK SALDO: Pastikan saldo cukup untuk transfer/pengeluaran
              if (type !== 'income' && walletSource.balance < amount) {
                throw new Error('INSUFFICIENT_BALANCE')
              }

              // 3. LOGIKA TRANSAKSI
              if (type === 'transfer') {
                if (!toWalletId) throw new Error('Destination wallet required for transfer')

                // Update Dompet Pengirim (Kurangi Saldo)
                await tx
                  .update(schema.wallets)
                  .set({ balance: walletSource.balance - amount })
                  .where(and(eq(schema.wallets.id, walletId), walletContextQuery))

                // Update Dompet Penerima (Tambah Saldo)
                const walletDest = await tx.query.wallets.findFirst({
                  where: and(eq(schema.wallets.id, toWalletId), walletContextQuery)
                })
                if (!walletDest) throw new Error('Destination wallet not found or access denied')

                await tx
                  .update(schema.wallets)
                  .set({ balance: walletDest.balance + amount })
                  .where(and(eq(schema.wallets.id, toWalletId), walletContextQuery))
              } else {
                // Update Dompet Normal (Income/Expense)
                const change = type === 'income' ? amount : -amount
                await tx
                  .update(schema.wallets)
                  .set({ balance: walletSource.balance + change })
                  .where(and(eq(schema.wallets.id, walletId), walletContextQuery))
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

              await tx.insert(schema.transactions).values(insertPayload)
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
            const walletContextQuery = orgId
              ? eq(schema.wallets.organizationId, orgId)
              : and(eq(schema.wallets.userId, user.id), isNull(schema.wallets.organizationId))

            await db.transaction(async (tx) => {
              // 1. Ambil transaksi lama
              const oldTransaction = await tx.query.transactions.findFirst({
                where: and(eq(schema.transactions.id, transactionId), eq(schema.transactions.userId, user.id))
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
                where: and(eq(schema.wallets.id, oldWalletId), walletContextQuery)
              })
              if (!currentOldWalletSource) throw new Error('Old source wallet not found or access denied')

              // Revert saldo dompet sumber lama
              if (oldType === 'income') {
                await tx
                  .update(schema.wallets)
                  .set({ balance: currentOldWalletSource.balance - oldAmount })
                  .where(and(eq(schema.wallets.id, oldWalletId), walletContextQuery))
              } else if (oldType === 'expense') {
                await tx
                  .update(schema.wallets)
                  .set({ balance: currentOldWalletSource.balance + oldAmount })
                  .where(and(eq(schema.wallets.id, oldWalletId), walletContextQuery))
              } else if (oldType === 'transfer' && oldToWalletId) {
                const currentOldWalletDestination = await tx.query.wallets.findFirst({
                  where: and(eq(schema.wallets.id, oldToWalletId), walletContextQuery)
                })
                if (!currentOldWalletDestination)
                  throw new Error('Old destination wallet not found or access denied')

                await tx
                  .update(schema.wallets)
                  .set({ balance: currentOldWalletSource.balance + oldAmount })
                  .where(and(eq(schema.wallets.id, oldWalletId), walletContextQuery))
                await tx
                  .update(schema.wallets)
                  .set({ balance: currentOldWalletDestination.balance - oldAmount })
                  .where(and(eq(schema.wallets.id, oldToWalletId), walletContextQuery))
              }

              // 3. Terapkan efek transaksi baru pada saldo dompet
              // PENTING: Ambil ulang saldo wallet setelah di-revert
              const newWalletSource = await tx.query.wallets.findFirst({
                where: and(eq(schema.wallets.id, walletId), walletContextQuery)
              })
              if (!newWalletSource) throw new Error('New source wallet not found or access denied')

              // Cek saldo untuk transaksi baru (jika bukan income)
              if (type !== 'income' && newWalletSource.balance < amount) {
                throw new Error('INSUFFICIENT_BALANCE')
              }

              if (type === 'transfer') {
                if (!toWalletId) throw new Error('Destination wallet required for transfer')

                const newWalletDestination = await tx.query.wallets.findFirst({
                  where: and(eq(schema.wallets.id, toWalletId), walletContextQuery)
                })
                if (!newWalletDestination) throw new Error('New destination wallet not found or access denied')

                await tx
                  .update(schema.wallets)
                  .set({ balance: newWalletSource.balance - amount })
                  .where(and(eq(schema.wallets.id, walletId), walletContextQuery))
                await tx
                  .update(schema.wallets)
                  .set({ balance: newWalletDestination.balance + amount })
                  .where(and(eq(schema.wallets.id, toWalletId), walletContextQuery))
              } else {
                const change = type === 'income' ? amount : -amount
                await tx
                  .update(schema.wallets)
                  .set({ balance: newWalletSource.balance + change })
                  .where(and(eq(schema.wallets.id, walletId), walletContextQuery))
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
                .update(schema.transactions)
                .set(updatePayload)
                .where(eq(schema.transactions.id, transactionId))
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
            const walletContextQuery = orgId
              ? eq(schema.wallets.organizationId, orgId)
              : and(eq(schema.wallets.userId, user.id), isNull(schema.wallets.organizationId))

            await db.transaction(async (tx) => {
              // 1. Ambil data transaksi yang akan dihapus
              const transaction = await tx.query.transactions.findFirst({
                where: and(eq(schema.transactions.id, transactionId), eq(schema.transactions.userId, user.id))
              })

              if (!transaction) {
                throw new Error('Transaction not found')
              }

              const { amount, type, walletId, toWalletId } = transaction

              // 2. Ambil data wallet sumber
              const walletSource = await tx.query.wallets.findFirst({
                where: and(eq(schema.wallets.id, walletId), walletContextQuery)
              })

              if (!walletSource) {
                throw new Error('Source wallet not found or access denied')
              }

              // 3. Revert saldo berdasarkan tipe transaksi
              if (type === 'income') {
                // Jika income, kurangi saldo (karena uang masuk akan dibatalkan)
                await tx
                  .update(schema.wallets)
                  .set({ balance: walletSource.balance - amount })
                  .where(and(eq(schema.wallets.id, walletId), walletContextQuery))
              } else if (type === 'expense') {
                // Jika expense, tambah saldo (karena pengeluaran dibatalkan)
                await tx
                  .update(schema.wallets)
                  .set({ balance: walletSource.balance + amount })
                  .where(and(eq(schema.wallets.id, walletId), walletContextQuery))
              } else if (type === 'transfer' && toWalletId) {
                // Jika transfer, kembalikan saldo ke wallet sumber dan kurangi dari wallet tujuan
                const walletDestination = await tx.query.wallets.findFirst({
                  where: and(eq(schema.wallets.id, toWalletId), walletContextQuery)
                })

                if (!walletDestination) {
                  throw new Error('Destination wallet not found or access denied')
                }

                // Kembalikan uang ke wallet sumber
                await tx
                  .update(schema.wallets)
                  .set({ balance: walletSource.balance + amount })
                  .where(and(eq(schema.wallets.id, walletId), walletContextQuery))

                // Kurangi uang dari wallet tujuan
                await tx
                  .update(schema.wallets)
                  .set({ balance: walletDestination.balance - amount })
                  .where(and(eq(schema.wallets.id, toWalletId), walletContextQuery))
              }

              // 4. Hapus transaksi
              await tx.delete(schema.transactions).where(eq(schema.transactions.id, transactionId))
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
                where: eq(schema.member.userId, user.id),
                with: { organization: true }
              })

              const activeOrg = queryUserOrgs.find(
                (o) => o.organizationId === currentSession?.activeOrganizationId
              )?.organization

              const categoryList = await db.query.categories.findMany({
                where: activeOrg
                  ? eq(schema.categories.organizationId, activeOrg.id)
                  : and(eq(schema.categories.userId, user.id), isNull(schema.categories.organizationId))
              })

              return { categoryList, activeOrg: activeOrg || null }
            },
          )
        },
        { auth: true }
      )

      .post(
        '/create',
        async (c) => {
          const { user, session: authSession } = c
          const currentSession = await db.query.session.findFirst({
            where: eq(schema.session.id, authSession.id)
          })

          await db.insert(schema.categories).values({
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
              .delete(schema.categories)
              .where(and(eq(schema.categories.userId, user.id), eq(schema.categories.id, c.params.id)))

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
              .update(schema.categories)
              .set({ ...c.body })
              .where(and(eq(schema.categories.userId, user.id), eq(schema.categories.id, c.params.id)))

            await invalidateUserCache(user.id, currentSession?.activeOrganizationId)

            return { message: 'category update' }
          } catch (e) {
            return { message: 'cannot update category' }
          }
        },
        { auth: true, body: categorySchema }
      )
  })

  // =========================================================================================
  // Organizations Management
  // =========================================================================================
  .group('/manage-orgs', (app) => {
    return app
      .get('/', async ({ activeOrg, user }) => {
        if (!activeOrg) return { org: null, members: [] }

        const members = await db.query.member.findMany({
          where: eq(schema.member.organizationId, activeOrg.id),
          with: { user: true }
        })

        const currentUserMember = members.find((m) => m.userId === user.id)

        return {
          org: activeOrg,
          members,
          currentUserRole: currentUserMember?.role || 'member'
        }
      }, { auth: true })

      .delete('/members/:id', async ({ params, activeOrg, user, status }) => {
        if (!activeOrg) return status(400)

        // Check if current user is owner
        const requester = await db.query.member.findFirst({
          where: and(eq(schema.member.organizationId, activeOrg.id), eq(schema.member.userId, user.id))
        })

        if (requester?.role !== 'owner') return status(403)

        await db.delete(schema.member).where(eq(schema.member.id, params.id))
        await invalidateUserCache(user.id, activeOrg.id)

        return { message: 'Member removed' }
      }, { auth: true })

      .put('/members/:id/role', async ({ params, body, activeOrg, user, status }) => {
        const { role } = body as { role: string }
        if (!activeOrg) return status(400)

        // Check if current user is owner
        const requester = await db.query.member.findFirst({
          where: and(eq(schema.member.organizationId, activeOrg.id), eq(schema.member.userId, user.id))
        })

        if (requester?.role !== 'owner') return status(403)

        await db.update(schema.member).set({ role }).where(eq(schema.member.id, params.id))
        return { message: 'Role updated' }
      }, { auth: true })

      .delete('/', async ({ activeOrg, user, status, request }) => {
        if (!activeOrg) return status(400)

        const requester = await db.query.member.findFirst({
          where: and(eq(schema.member.organizationId, activeOrg.id), eq(schema.member.userId, user.id))
        })

        if (requester?.role !== 'owner') return status(403)

        try {
          await db.transaction(async (tx) => {
            // Delete all associated application data
            await tx.delete(schema.transactions).where(eq(schema.transactions.organizationId, activeOrg.id))
            await tx.delete(schema.wallets).where(eq(schema.wallets.organizationId, activeOrg.id))
            await tx.delete(schema.categories).where(eq(schema.categories.organizationId, activeOrg.id))
            await tx.delete(schema.member).where(eq(schema.member.organizationId, activeOrg.id))

            // Delete the organization itself using Better Auth API
            await auth.api.deleteOrganization({
              body: {
                organizationId: activeOrg.id
              },
              headers: request.headers as any
            })

            // Reset session to personal account after deletion
            await auth.api.setActiveOrganization({
              body: {
                organizationId: null
              },
              headers: request.headers as any
            })
          })

          // Invalidate cache for the user
          await invalidateUserCache(user.id, activeOrg.id)

          return { success: true, message: 'Organization and all associated data deleted successfully' }
        } catch (e) {
          console.error('Delete organization error:', e)
          return {
            success: false,
            message: e instanceof Error ? e.message : 'Failed to delete organization'
          }
        }
      }, { auth: true })
  })

  // =========================================================================================
  // Organizations
  // =========================================================================================
  .group('/organizations', (app) => {
    return app
      .post(
        '/create',
        async (c) => {
          const { user, body } = c
          try {
            const org = await auth.api.createOrganization({
              body: {
                name: body.name,
                slug: body.slug,
                userId: user.id
              },
              headers: c.request.headers as any
            })

            await invalidateUserCache(user.id)
            return { success: true, organization: org }
          } catch (e) {
            console.error('Create org error:', e)
            return { success: false, message: e instanceof Error ? e.message : 'Gagal membuat organisasi' }
          }
        },
        { auth: true, body: organizationSchema }
      )

      .post(
        '/invite',
        async (c) => {
          const { body, activeOrg } = c
          if (!activeOrg) return { success: false, message: 'Harus memilih organisasi aktif' }

          try {
            await auth.api.createInvitation({
              body: {
                email: body.email,
                role: body.role,
                organizationId: activeOrg.id
              },
              headers: c.request.headers as any
            })

            return { success: true, message: 'Undangan berhasil dikirim' }
          } catch (e) {
            console.error('Invite error:', e)
            return { success: false, message: e instanceof Error ? e.message : 'Gagal mengirim undangan' }
          }
        },
        { auth: true, body: inviteSchema }
      )

      .post(
        '/accept-invitation',
        async (c) => {
          const { user, body } = c
          try {
            await auth.api.acceptInvitation({
              body: {
                invitationId: body.invitationId
              },
              headers: c.request.headers as any
            })

            await invalidateUserCache(user.id)
            return { success: true, message: 'Berhasil bergabung dengan organisasi' }
          } catch (e) {
            console.error('Accept invitation error:', e)
            return { success: false, message: e instanceof Error ? e.message : 'Gagal menerima undangan' }
          }
        },
        { auth: true, body: joinSchema }
      )
  })

export type App = typeof app
export const fallback: RequestHandler = ({ request }) => app.handle(request)
