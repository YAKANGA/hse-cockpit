import { requirePermission, getSessionFromRequest } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;

  const session = getSessionFromRequest(request);
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId") ?? session.tenantId;

  try {
    const { getReportConclusions } = await import("@/lib/db");
    const conclusions = getReportConclusions(tenantId);
    return Response.json({ conclusions });
  } catch {
    return Response.json({ conclusions: [] });
  }
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;

  const session = getSessionFromRequest(request);
  const body = await request.json() as { tenantId?: string; scope: string; title: string; body: string };
  const tenantId = body.tenantId ?? session.tenantId;

  try {
    const { upsertReportConclusion } = await import("@/lib/db");
    const id = upsertReportConclusion(tenantId, body.scope, body.title, body.body);
    return Response.json({ success: true, id });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
