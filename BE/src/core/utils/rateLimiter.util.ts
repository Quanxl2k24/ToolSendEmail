import type { Request, Response, NextFunction } from "express";
import { AppError } from "../exceptions/appError.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Simple in-memory rate limiter.
 *
 * @param storeName - Unique name for this rate limit scope (e.g. "auth-refresh")
 * @param maxRequests - Max requests allowed within the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimiter(
  storeName: string,
  maxRequests: number,
  windowMs: number,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = req.ip ?? "unknown";
    const now = Date.now();

    let store = stores.get(storeName);
    if (!store) {
      store = new Map();
      stores.set(storeName, store);
    }

    let entry = store.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > maxRequests) {
      next(new AppError("Quá nhiều yêu cầu. Vui lòng thử lại sau.", 429));
      return;
    }

    next();
  };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }
}, 5 * 60 * 1000).unref();
