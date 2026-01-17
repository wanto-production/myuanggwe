import { db } from '$lib/server/db';
import { transactions, wallets, categories, session as sessionTable } from '$lib/server/db/schema';
import { error, fail } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters'; // Gunakan zod standar, bukan zod4 kecuali lib kamu spesifik
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { transactionSchema } from "$lib/schemas"

export const load = async ({ locals }) => {
  const { user, session: authSession } = locals;
  if (!authSession || !user) throw error(401);

  const currentSession = await db.query.session.findFirst({
    where: eq(sessionTable.id, authSession.id)
  });
  const orgId = currentSession?.activeOrganizationId;

  // Query dengan filter yang benar untuk Personal vs Org
  const walletFilter = orgId
    ? eq(wallets.organizationId, orgId)
    : and(eq(wallets.userId, user.id), isNull(wallets.organizationId));
  const categoryFilter = orgId
    ? eq(categories.organizationId, orgId)
    : and(eq(categories.userId, user.id), isNull(categories.organizationId));
  const transactionFilter = orgId
    ? eq(transactions.organizationId, orgId)
    : and(eq(transactions.userId, user.id), isNull(transactions.organizationId));

  const [walletList, categoryList, transactionList] = await Promise.all([
    db.query.wallets.findMany({ where: walletFilter }),
    db.query.categories.findMany({ where: categoryFilter }),
    db.query.transactions.findMany({
      where: transactionFilter,
      with: { category: true, wallet: true },
      orderBy: [desc(transactions.date)]
    })
  ]);

  const form = await superValidate(zod4(transactionSchema));
  return { transactionList, walletList, categoryList, form };
};

export const actions = {
  default: async ({ request, locals }) => {
    const { user, session: authSession } = locals;
    if (!authSession || !user) return fail(401);

    const form = await superValidate(request, zod4(transactionSchema));
    if (!form.valid) return fail(400, { form });

    const { amount, type, walletId, toWalletId, categoryId, description, date } = form.data;

    // Ambil orgId aktif
    const currentSession = await db.query.session.findFirst({
      where: eq(sessionTable.id, authSession.id)
    });
    const orgId = currentSession?.activeOrganizationId || null;

    try {
      await db.transaction(async (tx) => {
        // 1. Ambil data dompet pengirim (Wallet A)
        const walletSource = await tx.query.wallets.findFirst({
          where: eq(wallets.id, walletId)
        });
        if (!walletSource) throw new Error('Source wallet not found');

        // 2. CEK SALDO: Pastikan saldo cukup untuk transfer/pengeluaran
        if (type !== 'income' && walletSource.balance < amount) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        // 3. LOGIKA TRANSAKSI
        if (type === 'transfer') {
          if (!toWalletId) throw new Error('Destination wallet required for transfer');

          // Update Dompet Pengirim (Kurangi Saldo)
          await tx
            .update(wallets)
            .set({ balance: walletSource.balance - amount })
            .where(eq(wallets.id, walletId));

          // Update Dompet Penerima (Tambah Saldo)
          const walletDest = await tx.query.wallets.findFirst({
            where: eq(wallets.id, toWalletId)
          });
          if (!walletDest) throw new Error('Destination wallet not found');

          await tx
            .update(wallets)
            .set({ balance: walletDest.balance + amount })
            .where(eq(wallets.id, toWalletId));
        } else {
          // Update Dompet Normal (Income/Expense)
          const change = type === 'income' ? amount : -amount;
          await tx
            .update(wallets)
            .set({ balance: walletSource.balance + change })
            .where(eq(wallets.id, walletId));
        }

        // 4. INSERT RECORD TRANSAKSI
        await tx.insert(transactions).values({
          amount,
          type,
          description: description ?? null,
          walletId,
          toWalletId: type === 'transfer' ? toWalletId : null,
          categoryId,
          userId: user.id,
          organizationId: orgId,
          date: new Date(date)
        });
      });

      return { form };
    } catch (e: unknown) {
      console.error(e);
      const message =
        e instanceof Error && e.message === 'INSUFFICIENT_BALANCE'
          ? 'Saldo tidak mencukupi'
          : 'Gagal memproses transaksi';
      return fail(400, { message });
    }
  }
};
