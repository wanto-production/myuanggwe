import Elysia from "elysia";
import { withBackendCache } from "$lib/redis/server";
import { db } from "../db";
import * as schema from "../db/schema"
import { eq } from "drizzle-orm";

export const userData = new Elysia({ name: 'layout-data' }).derive(
  { as: 'global' },
  async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user || !session?.session)
      return { activeOrg: null, organizations: [], currentSession: null }

    const layoutData = await withBackendCache(
      `layout:${session.user.id}`,
      async () => {
        const [currentSessionData, userOrgs] = await Promise.all([
          db.query.session.findFirst({
            where: eq(schema.session.id, session?.session.id),
            columns: { activeOrganizationId: true }
          }),
          db.query.member.findMany({
            where: eq(schema.member.userId, session?.user.id),
            with: { organization: true }
          })
        ])

        return { currentSessionData, userOrgs }
      }
    )

    const activeOrg = layoutData.userOrgs.find(
      (o) => o.organizationId === layoutData.currentSessionData?.activeOrganizationId
    )?.organization

    return {
      activeOrg: activeOrg ?? null,
      organizations: layoutData.userOrgs.map((o) => o.organization),
      currentSession: layoutData.currentSessionData
    }
  }
)

