import { organizationSchema,joinSchema,inviteSchema } from "$lib/schemas";

export const orgsGroups = createServer({ name: 'organizations', prefix: '/orgs' })
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

