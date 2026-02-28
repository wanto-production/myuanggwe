import type { RequestEvent } from '@sveltejs/kit'
import { Redis } from '@upstash/redis'
import { UPSTASH_REDIS_REST_TOKEN,UPSTASH_REDIS_REST_URL } from '$env/static/private'

const redis = new Redis({
	url: UPSTASH_REDIS_REST_URL,
	token: UPSTASH_REDIS_REST_TOKEN
})

// Cache operations that require event context
export const sveltekitCache = {
	async get<T>(key: string): Promise<T | null> {
		try {
			const data = await redis.get<string>(key)
			return data ? JSON.parse(data) : null
		} catch (error) {
			console.error('Cache get error:', error)
			return null
		}
	},

	async set(key: string, value: any, ttl: number = 3600): Promise<void> {
		try {
			await redis.setex(key, ttl, JSON.stringify(value))
		} catch (error) {
			console.error('Cache set error:', error)
		}
	},

	async del(key: string): Promise<void> {
		try {
			await redis.del(key)
		} catch (error) {
			console.error('Cache del error:', error)
		}
	},

	async invalidate(pattern: string): Promise<void> {
		try {
			const keys = await redis.keys(pattern)
			if (keys.length > 0) {
				await redis.del(...keys)
			}
		} catch (error) {
			console.error('Cache invalidate error:', error)
		}
	}
}

// Wrapper that requires event
export async function cachedFetch<T>(
	event: RequestEvent,
	cacheKey: string,
	fetcher: () => Promise<T>,
	ttl: number = 3600
): Promise<T> {
	// Get from cache
	const cached = await event.locals.cache.get<T>(cacheKey)
	if (cached !== null) {
		console.log(`✅ SvelteKit cache hit: ${cacheKey}`)
		return cached
	}

	console.log(`❌ SvelteKit cache miss: ${cacheKey}`)

	// Fetch fresh data
	const data = await fetcher()

	// Store in cache
	await event.locals.cache.set(cacheKey, data, ttl)

	return data
}

// Invalidate with event
export async function invalidateCache(event: RequestEvent, patterns: string[]): Promise<void> {
	await Promise.all(
		patterns.map((pattern) => {
			if (pattern.includes('*')) {
				return event.locals.cache.invalidate(pattern)
			}
			return event.locals.cache.del(pattern)
		})
	)
}
