
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { withBackendCache } from '$lib/redis/server'
import { categorySchema } from '$lib/schemas' 

export const categoriesGroup = createServer({ name: 'categories', prefix: '/categories' })
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

