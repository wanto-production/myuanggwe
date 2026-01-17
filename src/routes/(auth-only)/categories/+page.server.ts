import { db } from '$lib/server/db';
import { categories, member, session as sessionTable } from '$lib/server/db/schema';
import { error, fail } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';
import { and, eq, isNull } from 'drizzle-orm';
import { categorySchema } from "$lib/schemas"

export const load = async ({ locals }) => {
  const { user, session: authSession } = locals;
  if (!authSession || !user) throw error(401);

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

  const form = await superValidate(zod4(categorySchema));
  return { categoryList, form, activeOrg: activeOrg || null };
};

export const actions = {
  default: async ({ request, locals }) => {
    const { user, session: authSession } = locals;
    if (!authSession || !user) return fail(401);

    const form = await superValidate(request, zod4(categorySchema));
    if (!form.valid) return fail(400, { form });

    const currentSession = await db.query.session.findFirst({
      where: eq(sessionTable.id, authSession.id)
    });

    await db.insert(categories).values({
      ...form.data,
      userId: user.id,
      organizationId: currentSession?.activeOrganizationId || null
    });

    return { form };
  }
};
