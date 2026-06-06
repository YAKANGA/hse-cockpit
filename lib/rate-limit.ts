// In-memory sliding-window rate limiter.
// For multi-instance production, replace with Upstash Redis.

type Window = { count: number; resetAt: number };

const store = new Map<string, Window>();

function cleanup() {
  const now = Date.now();
  for (const [key, win] of store.entries()) {
    if (now > win.resetAt) store.delete(key);
  }
}

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  if (store.size > 10_000) cleanup();

  const now    = Date.now();
  const win    = store.get(key);
  const resetAt = (win && now < win.resetAt) ? win.resetAt : now + windowMs;

  if (!win || now >= win.resetAt) {
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  win.count++;
  const ok        = win.count <= limit;
  const remaining = Math.max(0, limit - win.count);
  return { ok, remaining, resetAt: win.resetAt };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "Trop de requetes. Reessayez dans quelques instants.", resetAt: result.resetAt }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After":  String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

// Pre-configured limiters
export const authLimiter    = (ip: string) => rateLimit(`auth:${ip}`,    10, 60_000);   // 10/min
export const importLimiter  = (ip: string) => rateLimit(`import:${ip}`,  20, 60_000);   // 20/min
export const apiLimiter     = (ip: string) => rateLimit(`api:${ip}`,    120, 60_000);   // 120/min

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
