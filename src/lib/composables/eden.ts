import { treaty } from '@elysiajs/eden'
import type { App } from '$lib/server/rest-api'
import { PUBLIC_APP_BASE_URL } from '$env/static/public'

export const client = treaty<App>(PUBLIC_APP_BASE_URL).api
