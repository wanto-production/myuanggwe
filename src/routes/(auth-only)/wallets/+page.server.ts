import { db } from '$lib/server/db';
import { wallets, session } from '$lib/server/db/schema';
import { error, fail } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';

// Schema validasi untuk tambah dompet
const walletSchema = z.object({
	name: z.string().min(3, 'Nama dompet minimal 3 karakter'),
	type: z.enum(['cash', 'bank', 'credit_card']).default('cash'),
	balance: z.number().min(0, 'Saldo awal tidak boleh negatif')
});

export const load = async ({ parent }) => {
	const { user, activeOrg } = await parent();
	if (!user) throw error(401, 'Unauthorized');

	// Query dompet berdasarkan konteks (Personal vs Org)
	const walletList = await db.query.wallets.findMany({
		where: activeOrg
			? eq(wallets.organizationId, activeOrg.id)
			: and(eq(wallets.userId, user.id), isNull(wallets.organizationId)),
		orderBy: (wallets, { desc }) => [desc(wallets.createdAt)]
	});

	const form = await superValidate(zod4(walletSchema));

	return { walletList, form };
};

export const actions = {
	default: async ({ request, locals }) => {
		const { session: authSession, user } = locals;

		const form = await superValidate(request, zod4(walletSchema));
		if (!form.valid) return fail(400, { form });

		const currentSession = await db.query.session.findFirst({
			where: eq(session.id, authSession.id),
			columns: { activeOrganizationId: true }
		});
		try {
			await db.insert(wallets).values({
				name: form.data.name,
				type: form.data.type,
				balance: form.data.balance,
				userId: user.id,
				organizationId: currentSession?.activeOrganizationId || null
			});

			return message(form, 'wallets created');
		} catch (e) {
			console.error(e);
			return fail(500, { message: 'Gagal membuat dompet' });
		}
	}
};
