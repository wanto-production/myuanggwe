import { db } from '$lib/server/db';
import { categories, member, session as sessionTable } from '$lib/server/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export const load = async ({ locals, depends }) => {
  depends('categories:data')
  const { user, session: authSession } = locals;

  const currentSession = await db.query.session.findFirst({
    where: eq(sessionTable.id, authSession.id)
  });

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
};
