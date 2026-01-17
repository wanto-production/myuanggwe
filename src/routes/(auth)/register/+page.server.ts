import { superValidate } from 'sveltekit-superforms';
import { registerSchema } from '$lib/schemas';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth'; // Better-Auth server instance
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(registerSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(registerSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Daftarkan user ke Better-Auth
			await auth.api.signUpEmail({
				body: {
					email: form.data.email,
					password: form.data.password,
					name: form.data.name
				}
			});

			return redirect(302, '/');
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : 'Terjadi kesalahan saat mendaftar';
			// Tangani jika email sudah terdaftar atau error lainnya
			return fail(400, {
				form,
				message
			});
		}

		// Jika sukses, arahkan ke dashboard
		throw redirect(302, '/dashboard');
	}
};
