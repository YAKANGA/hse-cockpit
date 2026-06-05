import { requirePermission } from "@/lib/api-auth";
import { recordAuditEvent } from "@/lib/audit-data";
import { updateTenant } from "@/lib/tenant-store";

export async function PATCH(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const authorization = requirePermission(request, "platform:manage-tenants");
  if (authorization.response) {
    return authorization.response;
  }

  const { tenantId } = await params;
  const payload = await request.json();
  const tenant = updateTenant(tenantId, payload);

  if (!tenant) {
    return Response.json({ error: "Entreprise introuvable", tenantId }, { status: 404 });
  }

  recordAuditEvent({
    tenantId: tenant.id,
    tenant: tenant.name,
    actor: authorization.session.name,
    action: "Modification entreprise",
    target: tenant.name,
    severity: "Controle",
  });

  return Response.json({ data: tenant });
}
