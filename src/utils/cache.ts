import Redis from 'ioredis';

/**
 * Simple Redis cache client wrapper.
 * - If REDIS_URL not set, cacheClient will be null (no-op)
 * - Use this for caching where beneficial (listings, queries, etc.)
 */
const redisUrl = process.env.REDIS_URL;
export const cacheClient = redisUrl ? new Redis(redisUrl) : null;
