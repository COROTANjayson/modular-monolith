import Redis from "ioredis";
import { REDIS_URL } from "../utils/config";
import { logger } from "./logger";

let redis: Redis | null = null;

/**
 * Initialize and export Redis client
 * Used by BullMQ for job queue management
 */
export function getRedisClient(): Redis | null {
  if (redis) {
    return redis;
  }

  if (!REDIS_URL) {
    logger.warn(
      "REDIS_URL not configured. Email queue will not be available. Emails will be sent synchronously."
    );
    return null;
  }

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redis.on("connect", () => {
      logger.info("✓ Redis connected successfully");
    });

    redis.on("error", (err) => {
      logger.error("Redis connection error:", err);
    });

    return redis;
  } catch (error) {
    logger.error("Failed to initialize Redis:", error);
    return null;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info("Redis connection closed");
  }
}

export default getRedisClient();
