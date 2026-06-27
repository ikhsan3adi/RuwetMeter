import type { Context, Next } from "hono";
import { config } from "../../../config";

const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(
  maxRequests: number = config.CHAT_RATE_LIMIT_MAX,
  windowMs: number = config.CHAT_RATE_LIMIT_WINDOW_MS,
) {
  return async (c: Context, next: Next) => {
    const ip =
      c.req.header("x-forwarded-for") ??
      c.req.header("x-real-ip") ??
      "unknown";
    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return c.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: `Too many requests. Try again in ${Math.ceil((record.resetAt - now) / 1000)} seconds.`,
          },
        },
        429,
      );
    }

    record.count++;
    return next();
  };
}
