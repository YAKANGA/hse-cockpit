import { getDemoSession } from "@/lib/permissions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? undefined;

  return Response.json({
    session: getDemoSession(userId),
  });
}
