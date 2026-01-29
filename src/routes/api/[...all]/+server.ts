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
      organizations: userOrgs.map(o => o.organization)
    };
  });

const app = new Elysia({ prefix: '/api' })
  .use(betterAuth)
  .use(userData)
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
        const { user, session: authSession } = c;
        const { amount, type, walletId, toWalletId, categoryId, description, date } = c.body;

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
  })
  //** categories routes */
  .group('/categories', (app) => {
    return app
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
  })

export type App = typeof app;
export const fallback: RequestHandler = ({ request }) => app.handle(request);
