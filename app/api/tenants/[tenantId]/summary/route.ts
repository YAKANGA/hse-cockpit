import { requireTenantAccess } from "@/lib/api-auth";
import { moduleOperationalKpis } from "@/lib/hse-data";
import { getTenant, getTenantActiveModules, getTenantSummary } from "@/lib/tenant-analytics";

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const authorization = requireTenantAccess(request, tenantId);
  if (authorization.response) {
    return authorization.response;
  }

  const tenant = getTenant(tenantId);

  if (!tenant) {
    return Response.json({ error: "Entreprise inconnue" }, { status: 404 });
  }

  const activeModuleIds = new Set(tenant.modules);

  return Response.json({
    tenant,
    summary: getTenantSummary(tenantId),
    operationalKpis: moduleOperationalKpis.filter((kpi) => activeModuleIds.has(kpi.moduleId)),
    modules: getTenantActiveModules(tenantId).map(({ icon: _icon, ...module }) => module),
  });
}
