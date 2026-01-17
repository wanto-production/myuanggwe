import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './server/db';
import { username, organization } from 'better-auth/plugins';
import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import * as schema from '$lib/server/db/schema';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema
	}),
	appName: 'myuanggwe',
	plugins: [organization(), username(), sveltekitCookies(getRequestEvent)],
	emailAndPassword: {
		enabled: true
	}
});
