import { treaty } from '@elysiajs/eden'
import type { App } from '$lib/server/rest-api'
import { browser } from '$app/environment'

export const client = treaty<App>(browser ? location.origin : "").api
