import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';

export const handle = async ({ event, resolve }) => {
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

