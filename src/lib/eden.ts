import { treaty } from '@elysiajs/eden'
import type { App } from '../routes/api/[...all]/+server'
import { PUBLIC_APP_BASE_URL } from '$env/static/public'

export const client = treaty<App>(PUBLIC_APP_BASE_URL).api
