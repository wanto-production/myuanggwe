import type { RequestHandler } from '@sveltejs/kit'
import { app } from '$lib/server/rest-api'

export const fallback: RequestHandler = ({ request }) => app.handle(request)
