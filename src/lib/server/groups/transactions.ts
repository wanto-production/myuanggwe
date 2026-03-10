import { eq, and, isNull} from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { withBackendCache } from '$lib/redis/server'
import { transactionSchema } from '$lib/schemas'

export const transactionsGroup = createServer({ name:'transactions',prefix:'/transactions'})
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

