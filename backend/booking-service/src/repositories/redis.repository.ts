import Redis from "ioredis";
import envConfig from "../config/env";
import logger from "../utils/logger";

let redisClient: Redis | null = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(envConfig.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy() {
      // Reconnect every 5 seconds
      return 5000;
    },
  });

  redisClient.on("connect", () => {
    isRedisConnected = true;
    logger.info("[Redis] Client connected successfully.");
  });

  redisClient.on("error", (err) => {
    isRedisConnected = false;
    logger.warn(`[Redis] Connection warning: ${err.message}`);
  });
} catch (err) {
  logger.error("[Redis] Initialization failed:", err);
}

export const redisRepository = {
  /**
   * Checks if a key exists in Redis.
   * Returns false if key is not found or Redis is unavailable.
   */
  async exists(key: string): Promise<boolean> {
    if (!redisClient || !isRedisConnected) return false;
    try {
      const res = await redisClient.exists(key);
      return res === 1;
    } catch (err) {
      logger.warn(`[Redis] EXISTS check failed for key=${key}:`, err);
      return false;
    }
  },

  /**
   * Sets a key in Redis with a TTL (in seconds).
   * Returns true on success, false otherwise.
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (!redisClient || !isRedisConnected) return false;
    try {
      await redisClient.set(key, value, "EX", ttlSeconds);
      return true;
    } catch (err) {
      logger.warn(`[Redis] SET failed for key=${key}:`, err);
      return false;
    }
  },

  /**
   * Deletes a key from Redis.
   * Returns true on success, false otherwise.
   */
  async delete(key: string): Promise<boolean> {
    if (!redisClient || !isRedisConnected) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      logger.warn(`[Redis] DEL failed for key=${key}:`, err);
      return false;
    }
  },
};

export default redisRepository;
