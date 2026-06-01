import { getRedisConnection } from "../queue/queue.config.js";
import { AppError } from "../../core/exceptions/appError.js";
const MAX_QUOTA_PER_DAY = 10000;
/**
 * Checks if the new campaign will exceed the daily quota.
 * If valid, increments the counter.
 * Otherwise, throws an AppError.
 */
export const checkAndIncrementQuota = async (newCount) => {
    const redis = getRedisConnection();
    const today = new Date().toISOString().split("T")[0];
    const quotaKey = `quota_email:${today}`;
    const currentCountStr = await redis.get(quotaKey);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
    if (currentCount + newCount > MAX_QUOTA_PER_DAY) {
        throw new AppError(`Vượt quá hạn mức gửi email trong ngày. Đã gửi: ${currentCount}/${MAX_QUOTA_PER_DAY}. Yêu cầu gửi thêm: ${newCount}.`, 403);
    }
    // Increment and set TTL if it's the first time
    const pipeline = redis.pipeline();
    pipeline.incrby(quotaKey, newCount);
    if (currentCount === 0) {
        pipeline.expire(quotaKey, 60 * 60 * 24); // 24 hours TTL
    }
    await pipeline.exec();
};
//# sourceMappingURL=quota.service.js.map