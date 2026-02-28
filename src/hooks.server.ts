import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { sveltekitCache } from '$lib/redis/sveltekit';

export const authContext: Handle = async ({ event, resolve }) => {
  // Fetch current session from Better Auth
  const session = await auth.api.getSession({
    headers: event.request.headers
  })

  // Make session and user available on server
  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  if (['/dashboard', '/transactions', '/wallets', '/categories','/organizations/invitations','organizations/manage'].includes(event.url.pathname) && !event.locals.user) {
    return redirect(302, '/login');
  }

  if (['/login', '/register'].includes(event.url.pathname) && event.locals.user) {
    return redirect(302, '/');
  }

  return resolve(event);
};


const cacheContext: Handle = async ({ event, resolve }) => {
	// Add cache to locals
	event.locals.cache = sveltekitCache
	return resolve(event)
}

export const handle = sequence(authContext,cacheContext)
