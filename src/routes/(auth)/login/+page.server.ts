import { superValidate } from 'sveltekit-superforms';
import { loginSchema } from '$lib/schemas';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Gunakan adapter zod() sesuai standar Superforms terbaru
	const form = await superValidate(zod4(loginSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(loginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Proses Login ke Better-Auth
			await auth.api.signInEmail({
				body: {
					email: form.data.email,
					password: form.data.password
				}
			});
		} catch {
			// Error biasanya: "Invalid email or password"
			return fail(401, {
				form,
				message: 'Email atau password salah.'
			});
		}

		// Jika sukses, lempar ke dashboard
		throw redirect(302, '/dashboard');
	}
};
