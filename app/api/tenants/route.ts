import { requirePermission } from "@/lib/api-auth";
import { recordAuditEvent } from "@/lib/audit-data";
import { createTenant, getTenants } from "@/lib/tenant-store";

export async function GET(request: Request) {
  const authorization = requirePermission(request, "platform:manage-tenants");
  if (authorization.response) {
    return authorization.response;
  }

  const tenants = getTenants();

  return Response.json({
    data: tenants,
    count: tenants.length,
  });
}

export async function POST(request: Request) {
  const authorization = requirePermission(request, "platform:manage-tenants");
  if (authorization.response) {
    return authorization.response;
  }

  const payload = await request.json();
  const tenant = createTenant(payload);

  if (!tenant) {
    return Response.json({ error: "Nom entreprise et administrateur requis" }, { status: 400 });
  }

  recordAuditEvent({
    tenantId: tenant.id,
    tenant: tenant.name,
    actor: authorization.session.name,
    action: "Creation entreprise",
    target: tenant.name,
    severity: "Controle",
  });

  return Response.json({ data: tenant }, { status: 201 });
}
