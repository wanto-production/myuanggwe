import { db } from '$lib/server/db';
import { member, session as sessionTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ locals, depends }) => {
  depends("layout:data")
  const { user, session: authSession } = locals;

  if (!authSession) {
    return { user: null, activeOrg: null, organizations: [] };
  }

  // Kita query tabel session berdasarkan token atau ID session yang aktif
  const queryCurrentSessionData = db.query.session.findFirst({
    where: eq(sessionTable.id, authSession.id)
  });
  // Ambil daftar organisasi user
  const queryUserOrgs = db.query.member.findMany({
    where: eq(member.userId, user.id),
    with: { organization: true }
  });

  const [currentSessionData, userOrgs] = await Promise.all([
    queryCurrentSessionData,
    queryUserOrgs
  ]);

  const activeOrgId = currentSessionData?.activeOrganizationId;

  const activeOrg = userOrgs.find((o) => o.organizationId === activeOrgId)?.organization;

  return {
    user,
    organizations: userOrgs.map((o) => o.organization),
    activeOrg: activeOrg || null // Jika null = Mode Personal
  };
};
