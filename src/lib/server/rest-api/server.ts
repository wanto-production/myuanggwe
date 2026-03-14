import { betterAuth } from '$lib/server/rest-api/middlewares/better-auth'
import { userData } from '$lib/server/rest-api/middlewares/user-data'
import { Elysia } from 'elysia'

export const createServer = (props?: ConstructorParameters<typeof Elysia>[0]) => 
  new Elysia(props)
  .use(betterAuth)
  .use(userData)
