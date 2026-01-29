import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const authHandler: Handle = async ({ event, resolve }) => {
  // Fetch current session from Better Auth
  const session = await auth.api.getSession({
    headers: event.request.headers
  });

  // Make session and user available on server
  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

const guardHandler: Handle = async ({ event, resolve }) => {
  if (['/', '/dashboard', '/transaction'].includes(event.url.pathname) && !event.locals.user) {
    return redirect(302, '/login');
  }

  if (['/login', '/register'].includes(event.url.pathname) && event.locals.user) {
    return redirect(302, '/');
  }

  return resolve(event);
};

export const handle = sequence(authHandler, guardHandler);
