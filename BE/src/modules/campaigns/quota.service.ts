import { getRedisConnection } from "../queue/queue.config.js";
import { logger } from "../../core/utils/logger.js";

const MAX_QUOTA_PER_DAY = Number(process.env.SMTP_DAILY_QUOTA ?? 400);
const RATE_LIMIT = Number(process.env.SMTP_RATE_LIMIT ?? 1);

export const getQuota = async (): Promise<{
  sentToday: number;
  dailyLimit: number;
  rateLimit: number;
}> => {
  const redis = getRedisConnection();
  const today = new Date().toISOString().split("T")[0];
  const quotaKey = `quota_email:${today}`;
  const countStr = await redis.get(quotaKey);
  return {
    sentToday: countStr ? parseInt(countStr, 10) : 0,
    dailyLimit: MAX_QUOTA_PER_DAY,
    rateLimit: RATE_LIMIT,
  };
};

export const checkAndIncrementQuota = async (newCount: number): Promise<void> => {
  const redis = getRedisConnection();
  const today = new Date().toISOString().split("T")[0];
  const quotaKey = `quota_email:${today}`;

  const currentCountStr = await redis.get(quotaKey);
  const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

  if (currentCount + newCount > MAX_QUOTA_PER_DAY) {
    logger.warn("Daily quota exceeded, but allowing send", {
      sent: currentCount,
      limit: MAX_QUOTA_PER_DAY,
      requested: newCount,
    });
  }

  const pipeline = redis.pipeline();
  pipeline.incrby(quotaKey, newCount);
  if (currentCount === 0) {
    pipeline.expire(quotaKey, 60 * 60 * 24);
  }
  await pipeline.exec();
};
