import { requireTenantAccess } from "@/lib/api-auth";
import { getTenant, getTenantActiveModules } from "@/lib/tenant-analytics";

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

  return Response.json({
    tenant,
    modules: getTenantActiveModules(tenantId).map(({ icon: _icon, ...module }) => module),
  });
}
