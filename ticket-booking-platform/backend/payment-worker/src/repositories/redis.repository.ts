import Redis from "ioredis";
import envConfig from "../config/env";
import logger from "../utils/logger";

let redisClient: Redis | null = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(envConfig.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy() {
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
