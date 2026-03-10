import { eq, and, isNull } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { withBackendCache } from '$lib/redis/server'
import { walletSchema } from '$lib/schemas'

export const walletsGroup = createServer({ name: 'wallets', prefix: '/wallets' })
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

