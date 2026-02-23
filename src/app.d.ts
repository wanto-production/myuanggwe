// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('better-auth').User;
			session: import('better-auth').Session;
		  cache: typeof import('$lib/cache/sveltekit').sveltekitCache;
    }
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
