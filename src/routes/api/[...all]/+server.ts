import type { RequestHandler } from '@sveltejs/kit'
import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { dashboardGroup } from '$lib/server/groups/dashboard'
import { walletsGroup } from '$lib/server/groups/wallets'
import { transactionsGroup } from '$lib/server/groups/transactions'
import { categoriesGroup } from '$lib/server/groups/categories'
import { orgsGroups } from '$lib/server/groups/orgs/users'
import { manageOrgsGroup } from '$lib/server/groups/orgs/manage'

const layoutGroup = createServer()
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

const app = new Elysia({ prefix: '/api' })
  .use(
    cors({
      origin: ['http://localhost:5173', 'https://myuanggwe.vercel.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  )
  .use(layoutGroup)
  .use(orgsGroups)
  .use(dashboardGroup)
  .use(walletsGroup)
  .use(transactionsGroup)
  .use(categoriesGroup)
  .use(manageOrgsGroup)

export type App = typeof app
export const fallback: RequestHandler = ({ request }) => app.handle(request)
