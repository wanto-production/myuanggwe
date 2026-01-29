import type { RequestHandler } from '@sveltejs/kit';
import { Elysia } from 'elysia';
import { auth } from '$lib/auth';
import { walletSchema } from '$lib/schemas';
import { eq, and, isNull } from 'drizzle-orm'; // Tambahkan and & isNull
import { db } from '$lib/server/db';
import { wallets, session as sessionTable, member } from '$lib/server/db/schema';

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
  });

export type App = typeof app;
export const fallback: RequestHandler = ({ request }) => app.handle(request);
