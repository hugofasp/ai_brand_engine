/**
 * Lightweight per-IP token-bucket rate limiter. In-memory only.
 *
 * Trade-off acknowledged: each Vercel serverless instance has its own
 * bucket map, so a distributed attacker hitting many warm instances
 * effectively gets ~N x the budget. For our threat model (accidental
 * loops, casual abuse, AI agent gone rogue) this is sufficient and
 * costs nothing. If we ever need distributed limiting, swap the Map
 * below for Upstash Redis / Vercel KV without touching the call sites.
 *
 * The limiter is also responsible for stamping the `Retry-After` HTTP
 * header on 429 responses so well-behaved clients can back off
 * automatically.
 */

type Bucket = {
  tokens: number;
  refilledAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

/**
 * Window-aligned, per-route rate-limit budgets. Picked so that a real
 * user doing normal work never trips the limit, but a runaway loop
 * (or an attacker hammering an endpoint to drain Anthropic spend) is
 * stopped before more than a few seconds of damage.
 *
 * Each endpoint costs different amounts:
 *  - materials/stream: crawl + extraction, ~5-20¢ per run, expensive
 *  - chat/stream: a single turn, ~0.5-2¢, cheap individually but spammable
 *  - admin/generate: full pack synthesis, ~20-50¢, very expensive
 */
export const RATE_LIMITS = {
  "materials-stream": { max: 8, windowSec: 60 },
  "chat-turn":        { max: 40, windowSec: 60 },
  "admin-generate":   { max: 6, windowSec: 60 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

/**
 * Consume one token from the bucket identified by `key`. Returns whether
 * the request is allowed plus enough metadata to set response headers.
 */
export function rateLimit(
  key: string,
  config: { max: number; windowSec: number },
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const refillRatePerMs = config.max / windowMs;

  // Opportunistic eviction so the map never grows without bound.
  if (buckets.size > MAX_TRACKED_KEYS) {
    pruneOldBuckets(now, windowMs * 4);
  }

  const bucket = buckets.get(key);
  if (!bucket) {
    buckets.set(key, { tokens: config.max - 1, refilledAt: now });
    return { ok: true, remaining: config.max - 1 };
  }

  // Refill based on time elapsed since the last touch.
  const elapsed = now - bucket.refilledAt;
  bucket.tokens = Math.min(
    config.max,
    bucket.tokens + elapsed * refillRatePerMs,
  );
  bucket.refilledAt = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { ok: true, remaining: Math.floor(bucket.tokens) };
  }

  // Not enough tokens. Compute how long until the bucket has one.
  const msUntilOneToken = (1 - bucket.tokens) / refillRatePerMs;
  return { ok: false, retryAfterSec: Math.max(1, Math.ceil(msUntilOneToken / 1000)) };
}

function pruneOldBuckets(now: number, maxAgeMs: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.refilledAt > maxAgeMs) {
      buckets.delete(key);
    }
  }
}

/**
 * Best-effort client IP from request headers. Vercel injects
 * `x-forwarded-for` (comma-separated chain, leftmost is closest to the
 * client) and `x-real-ip`. Fall back to a string sentinel so the limiter
 * still works when those are missing.
 */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

/**
 * Convenience: run the limiter for a named route + request, and return
 * a 429 Response if the budget is exhausted. Returns `null` when the
 * request is allowed through (caller continues).
 *
 * Brand rule: the human-facing message stays plain, no raw error codes
 * or quotas leaked. The Retry-After header is the machine signal.
 */
export function enforceRateLimit(
  request: Request,
  name: RateLimitName,
): Response | null {
  const config = RATE_LIMITS[name];
  const ip = clientIp(request);
  const result = rateLimit(`${name}:${ip}`, config);
  if (result.ok) return null;
  return new Response(
    JSON.stringify({
      error:
        "Too many requests in a short time. Please wait a moment and try again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": result.retryAfterSec.toString(),
      },
    },
  );
}
