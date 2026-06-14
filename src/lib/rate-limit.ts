type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, { count: number; resetAt: number }>();
let ops = 0;

function cleanupExpiredBuckets(now: number) {
  if (ops % 100 !== 0) return;
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function buildRateLimitKey(request: Request, scope: string) {
  return `${scope}:${getClientIdentifier(request)}`;
}

export function checkRateLimit(options: {
  key: string;
  limit?: number;
  windowMs?: number;
}): RateLimitResult {
  const limit = options.limit ?? toPositiveInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS, 30);
  const windowMs = options.windowMs ?? toPositiveInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 60_000);

  const now = Date.now();
  ops += 1;
  cleanupExpiredBuckets(now);

  const existing = buckets.get(options.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(options.key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  buckets.set(options.key, existing);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}
