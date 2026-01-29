import { treaty } from '@elysiajs/eden'
import type { App } from '../routes/api/[...all]/+server'

export const client = treaty<App>('localhost:5173').api
