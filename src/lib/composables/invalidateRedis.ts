import { backendCache } from "$lib/redis/server"

export async function invalidateUserCache(userId: string, orgId?: string | null) {
  const patterns = [
    `layout:${userId}`,
    `dashboard:user:${userId}`,
    `wallets:user:${userId}`,
    `transactions:user:${userId}`,
    `categories:user:${userId}`
  ]

  if (orgId) {
    patterns.push(
      `dashboard:org:${orgId}`,
      `wallets:org:${orgId}`,
      `transactions:org:${orgId}`,
      `categories:org:${orgId}`
    )
  }

  await Promise.all(patterns.map((p) => backendCache.del(p)))
}
