import { eq, and    } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'


export const manageOrgsGroup = createServer({ name:'manage-orgs',prefix:'/manage-orgs'})
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

