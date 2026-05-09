/**
 * Rate limiter đơn giản in-memory (dùng cho 1 instance Node).
 * Production scale (multi-instance) nên đổi sang Redis.
 */

type Bucket = {
  count: number;
  windowStart: number;
  blockedUntil?: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Số request tối đa trong cửa sổ */
  max: number;
  /** Cửa sổ thời gian (ms) */
  windowMs: number;
  /** Thời gian block khi vượt quá (ms). Mặc định = windowMs */
  blockMs?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  retryAfterMs?: number;
};

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const blockMs = opts.blockMs ?? opts.windowMs;
  const b = buckets.get(key);

  if (b?.blockedUntil && b.blockedUntil > now) {
    return { allowed: false, remaining: 0, resetMs: 0, retryAfterMs: b.blockedUntil - now };
  }

  if (!b || now - b.windowStart > opts.windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: opts.max - 1, resetMs: opts.windowMs };
  }

  b.count++;
  if (b.count > opts.max) {
    b.blockedUntil = now + blockMs;
    return { allowed: false, remaining: 0, resetMs: 0, retryAfterMs: blockMs };
  }
  return { allowed: true, remaining: opts.max - b.count, resetMs: opts.windowMs - (now - b.windowStart) };
}

/** Cleanup buckets cũ định kỳ (chạy mỗi 5 phút) */
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets.entries()) {
      if (b.blockedUntil && b.blockedUntil < now) {
        buckets.delete(k);
      } else if (!b.blockedUntil && now - b.windowStart > 600000) {
        buckets.delete(k);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf;
  return req.headers.get('x-real-ip') || 'unknown';
}
