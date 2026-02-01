import type { RequestHandler } from '@sveltejs/kit';
import { Elysia } from 'elysia';
import { auth } from '$lib/auth';
import { categorySchema, walletSchema } from '$lib/schemas';
import { eq, and, isNull } from 'drizzle-orm'; // Tambahkan and & isNull
import { db } from '$lib/server/db';
import { wallets, session as sessionTable, member, transactions, categories } from '$lib/server/db/schema';
import { transactionSchema } from '$lib/schemas';

const betterAuth = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

const userData = new Elysia({ name: 'layout-data' })
  .derive({ as: 'global' }, async ({ request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    // Jika tidak ada user (unauthorized), kembalikan default
    if (!session?.user || !session?.session) return { activeOrg: null, organizations: [] };

    const [currentSessionData, userOrgs] = await Promise.all([
      db.query.session.findFirst({
        where: eq(sessionTable.id, session?.session.id),
        columns: { activeOrganizationId: true }
      }),
      db.query.member.findMany({
        where: eq(member.userId, session?.user.id),
        with: { organization: true }
      })
    ]);

    const activeOrg = userOrgs.find(
      (o) => o.organizationId === currentSessionData?.activeOrganizationId
    )?.organization;

    return {
      activeOrg: activeOrg ?? null,
      organizations: userOrgs.map(o => o.organization),
      currentSession: currentSessionData
    };
  });

const app = new Elysia({ prefix: '/api' })
  .use(betterAuth)
  .use(userData)
  .get('/users', ({ user, session }) => ({ user, session }), { auth: true })
  //** wallets routes  *//
  .group('/wallets', (app) => {
    return app
      .get('/', async ({ user, activeOrg }) => {
        const walletList = await db.query.wallets.findMany({
          where: activeOrg
            ? eq(wallets.organizationId, activeOrg.id)
            : and(eq(wallets.userId, user.id), isNull(wallets.organizationId)),
          orderBy: (wallets, { desc }) => [desc(wallets.createdAt)]
        });

        return { walletList };
      }, { auth: true })

      .post('/create', async (c) => {
        const { user, activeOrg, body } = c;

        try {
          await db.insert(wallets).values({
            id: crypto.randomUUID(),
            name: body.name,
            type: body.type,
            balance: body.balance,
            userId: user!.id,
            organizationId: activeOrg?.id ?? null
          });

          return { message: 'wallets created' };
        } catch (e) {
          console.error(e);
          return { message: 'Gagal membuat dompet' };
        }
      }, { auth: true, body: walletSchema })

      .put('/edit/:id', async (c) => {
        const { user, activeOrg, body, params } = c;

        try {
          await db.update(wallets).set({
            name: body.name,
            type: body.type,
            balance: body.balance,
            userId: user!.id,
            organizationId: activeOrg?.id ?? null
          }).where(
            eq(wallets.id, params.id)
          );

          return { message: 'wallets updated' };
        } catch (e) {
          console.error(e);
          return { message: 'Gagal update dompet' };
        }
      }, { auth: true, body: walletSchema })

      .delete('/erase/:id', async ({ params }) => {
        try {
          await db.delete(wallets).where(
            eq(wallets.id, params.id)
          );
          return { message: 'wallets deleted' };
        } catch (e) {
          console.error(e);
          return { message: 'Gagal hapus dompet' };
        }
      }, { auth: true });
  })
  //** transactions routes */
  .group('/transactions', (app) => {
    return app
      .post('/create', async (c) => {
        const { user } = c;
        const { amount, type, walletId, toWalletId, categoryId, description, date } = c.body;

        // Ambil orgId aktif
        const currentSession = c.currentSession;
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
            const insertPayload: any = {
              amount,
              type: type as 'income' | 'expense' | 'transfer',
              description: description || null,
              walletId,
              userId: user.id,
              organizationId: orgId,
              date: new Date(date)
            };

            // Conditionally add fields based on transaction type
            if (type === 'transfer') {
              insertPayload.toWalletId = toWalletId;
            } else {
              if (categoryId) {
                insertPayload.categoryId = categoryId;
              }
            }

            await tx.insert(transactions).values(insertPayload);
          });

          return { message: "transaksi berhasil!" };
        } catch (e: unknown) {
          console.error(e);
          const message =
            e instanceof Error && e.message === 'INSUFFICIENT_BALANCE'
              ? 'Saldo tidak mencukupi'
              : 'Gagal memproses transaksi';
          return { message };
        }

      }, { auth: true, body: transactionSchema })
      .put('/edit/:id', async (c) => {
        const { user, body, params } = c;
        const transactionId = params.id;
        const { amount, type, walletId, toWalletId, categoryId, description, date } = body;

        // Ambil orgId aktif
        const currentSession = c.currentSession;
        const orgId = currentSession?.activeOrganizationId || null;

        try {
          await db.transaction(async (tx) => {
            // 1. Ambil transaksi lama
            const oldTransaction = await tx.query.transactions.findFirst({
              where: and(
                eq(transactions.id, transactionId),
                eq(transactions.userId, user.id)
              )
            });

            if (!oldTransaction) {
              throw new Error('Transaction not found');
            }

            // 2. Revert efek transaksi lama pada saldo dompet
            const oldAmount = oldTransaction.amount;
            const oldType = oldTransaction.type;
            const oldWalletId = oldTransaction.walletId;
            const oldToWalletId = oldTransaction.toWalletId;

            // Dapatkan saldo dompet lama saat ini untuk diperbarui
            const currentOldWalletSource = await tx.query.wallets.findFirst({
              where: eq(wallets.id, oldWalletId)
            });
            if (!currentOldWalletSource) throw new Error('Old source wallet not found');

            // Revert saldo dompet sumber lama
            if (oldType === 'income') {
              await tx.update(wallets)
                .set({ balance: currentOldWalletSource.balance - oldAmount })
                .where(eq(wallets.id, oldWalletId));
            } else if (oldType === 'expense') {
              await tx.update(wallets)
                .set({ balance: currentOldWalletSource.balance + oldAmount })
                .where(eq(wallets.id, oldWalletId));
            } else if (oldType === 'transfer' && oldToWalletId) {
              const currentOldWalletDestination = await tx.query.wallets.findFirst({
                where: eq(wallets.id, oldToWalletId)
              });
              if (!currentOldWalletDestination) throw new Error('Old destination wallet not found');

              await tx.update(wallets)
                .set({ balance: currentOldWalletSource.balance + oldAmount })
                .where(eq(wallets.id, oldWalletId));
              await tx.update(wallets)
                .set({ balance: currentOldWalletDestination.balance - oldAmount })
                .where(eq(wallets.id, oldToWalletId));
            }

            // 3. Terapkan efek transaksi baru pada saldo dompet
            // PENTING: Ambil ulang saldo wallet setelah di-revert
            const newWalletSource = await tx.query.wallets.findFirst({
              where: eq(wallets.id, walletId)
            });
            if (!newWalletSource) throw new Error('New source wallet not found');

            // Cek saldo untuk transaksi baru (jika bukan income)
            if (type !== 'income' && newWalletSource.balance < amount) {
              throw new Error('INSUFFICIENT_BALANCE');
            }

            if (type === 'transfer') {
              if (!toWalletId) throw new Error('Destination wallet required for transfer');

              const newWalletDestination = await tx.query.wallets.findFirst({
                where: eq(wallets.id, toWalletId)
              });
              if (!newWalletDestination) throw new Error('New destination wallet not found');

              await tx.update(wallets)
                .set({ balance: newWalletSource.balance - amount })
                .where(eq(wallets.id, walletId));
              await tx.update(wallets)
                .set({ balance: newWalletDestination.balance + amount })
                .where(eq(wallets.id, toWalletId));
            } else {
              const change = type === 'income' ? amount : -amount;
              await tx.update(wallets)
                .set({ balance: newWalletSource.balance + change })
                .where(eq(wallets.id, walletId));
            }

            // 4. Perbarui record transaksi
            const updatePayload: any = {
              amount,
              type: type as 'income' | 'expense' | 'transfer',
              description: description || null,
              walletId,
              userId: user.id,
              organizationId: orgId,
              date: new Date(date)
            };

            // Conditionally add fields based on transaction type
            if (type === 'transfer') {
              updatePayload.toWalletId = toWalletId || null;
            } else {
              updatePayload.toWalletId = null;
              if (categoryId) {
                updatePayload.categoryId = categoryId;
              }
            }

            await tx.update(transactions)
              .set(updatePayload)
              .where(eq(transactions.id, transactionId));
          });

          return { message: "Transaksi berhasil diperbarui!" };
        } catch (e: unknown) {
          console.error(e);
          const message =
            e instanceof Error && e.message === 'INSUFFICIENT_BALANCE'
              ? 'Saldo tidak mencukupi'
              : e instanceof Error && e.message.includes('wallet not found')
                ? e.message
                : 'Gagal memperbarui transaksi';
          return { message };
        }
      }, { auth: true, body: transactionSchema })
      .delete('/erase/:id', async (c) => {
        const { user } = c;
        const transactionId = c.params.id;

        try {
          await db.transaction(async (tx) => {
            // 1. Ambil data transaksi yang akan dihapus
            const transaction = await tx.query.transactions.findFirst({
              where: and(
                eq(transactions.id, transactionId),
                eq(transactions.userId, user.id)
              )
            });

            if (!transaction) {
              throw new Error('Transaction not found');
            }

            const { amount, type, walletId, toWalletId } = transaction;

            // 2. Ambil data wallet sumber
            const walletSource = await tx.query.wallets.findFirst({
              where: eq(wallets.id, walletId)
            });

            if (!walletSource) {
              throw new Error('Source wallet not found');
            }

            // 3. Revert saldo berdasarkan tipe transaksi
            if (type === 'income') {
              // Jika income, kurangi saldo (karena uang masuk akan dibatalkan)
              await tx.update(wallets)
                .set({ balance: walletSource.balance - amount })
                .where(eq(wallets.id, walletId));

            } else if (type === 'expense') {
              // Jika expense, tambah saldo (karena pengeluaran dibatalkan)
              await tx.update(wallets)
                .set({ balance: walletSource.balance + amount })
                .where(eq(wallets.id, walletId));

            } else if (type === 'transfer' && toWalletId) {
              // Jika transfer, kembalikan saldo ke wallet sumber dan kurangi dari wallet tujuan
              const walletDestination = await tx.query.wallets.findFirst({
                where: eq(wallets.id, toWalletId)
              });

              if (!walletDestination) {
                throw new Error('Destination wallet not found');
              }

              // Kembalikan uang ke wallet sumber
              await tx.update(wallets)
                .set({ balance: walletSource.balance + amount })
                .where(eq(wallets.id, walletId));

              // Kurangi uang dari wallet tujuan
              await tx.update(wallets)
                .set({ balance: walletDestination.balance - amount })
                .where(eq(wallets.id, toWalletId));
            }

            // 4. Hapus transaksi
            await tx.delete(transactions)
              .where(eq(transactions.id, transactionId));
          });

          return { message: 'Transaksi berhasil dihapus dan saldo dikembalikan' };

        } catch (e: unknown) {
          console.error(e);
          const message = e instanceof Error
            ? e.message
            : 'Gagal menghapus transaksi';
          return { message };
        }
      }, { auth: true })
  })
  //** categories routes */
  .group('/categories', (app) => {
    return app
      .get('/', async (c) => {
        const { user, currentSession } = c;

        const queryUserOrgs = await db.query.member.findMany({
          where: eq(member.userId, user.id),
          with: { organization: true }
        });

        const activeOrg = queryUserOrgs.find(
          (o) => o.organizationId === currentSession?.activeOrganizationId
        )?.organization;

        const categoryList = await db.query.categories.findMany({
          where: activeOrg
            ? eq(categories.organizationId, activeOrg.id)
            : and(eq(categories.userId, user.id), isNull(categories.organizationId))
        });

        return { categoryList, activeOrg: activeOrg || null };
      }, { auth: true })
      .post('/create', async (c) => {
        const { user, session: authSession } = c;
        const currentSession = await db.query.session.findFirst({
          where: eq(sessionTable.id, authSession.id)
        });

        await db.insert(categories).values({
          ...c.body,
          userId: user.id,
          organizationId: currentSession?.activeOrganizationId || null
        });

        return { message: "category created!" };
      }, { auth: true, body: categorySchema })
      .delete('/remove/:id', async (c) => {
        const { user } = c
        try {
          await db.delete(categories).where(
            and(
              eq(categories.userId, user.id),
              eq(categories.id, c.params.id)
            )
          )

          return { message: 'delete category complete' }
        } catch (e) {
          return { message: (e as Error).message }
        }
      }, { auth: true })
      .put('/edit/:id', async (c) => {
        const { user } = c
        try {
          await db.update(categories).set({
            ...c.body
          }).where(
            and(
              eq(categories.userId, user.id),
              eq(categories.id, c.params.id)
            )
          )

          return { message: "category update" }
        } catch (e) {
          return { message: "cannot update category" }
        }
      }, { auth: true, body: categorySchema })
  })

export type App = typeof app;
export const fallback: RequestHandler = ({ request }) => app.handle(request);
