import { handlers } from "@/auth";
import type { NextRequest } from "next/server";
import { authLimiter, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const { GET, POST: _POST } = handlers;
export { GET };

export async function POST(request: NextRequest) {
  const ip     = getClientIp(request);
  const result = authLimiter(ip);
  if (!result.ok) return rateLimitResponse(result);
  return _POST(request);
}
