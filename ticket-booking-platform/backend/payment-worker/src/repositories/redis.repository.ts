import Redis from "ioredis";
import redisConfig from "../config/redis";
import logger from "../utils/logger";

let redisClient: Redis | null = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(redisConfig.url, {
    maxRetriesPerRequest: 1, // Minimize blocks when Redis is down
    retryStrategy() {
      return 5000; // Retry every 5 seconds
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
