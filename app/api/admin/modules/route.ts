import { requirePermission, getSessionFromRequest } from "@/lib/api-auth";
import { modules } from "@/lib/hse-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const session = getSessionFromRequest(request);
  const tenantId = url.searchParams.get("tenantId") ?? session.tenantId ?? "acme-btp";

  try {
    const { getTenantModules } = await import("@/lib/db");
    const overrides = getTenantModules(tenantId);
    const result = modules.map((m) => ({
      id: m.id,
      name: m.name,
      shortName: m.shortName,
      active: overrides[m.id] !== undefined ? overrides[m.id] : true,
    }));
    return Response.json({ modules: result, tenantId });
  } catch {
    const result = modules.map((m) => ({ id: m.id, name: m.name, shortName: m.shortName, active: true }));
    return Response.json({ modules: result, tenantId });
  }
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;

  const session = getSessionFromRequest(request);
  const body = await request.json() as { tenantId?: string; moduleId: string; active: boolean };
  const tenantId = body.tenantId ?? session.tenantId ?? "acme-btp";

  try {
    const { setTenantModuleActive } = await import("@/lib/db");
    setTenantModuleActive(tenantId, body.moduleId, body.active);
    return Response.json({ success: true, moduleId: body.moduleId, active: body.active });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
