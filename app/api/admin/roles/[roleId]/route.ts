import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { updateTenantRole } from "@/lib/admin-store";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTenant } from "@/lib/tenant-analytics";

export async function PATCH(request: Request, { params }: { params: Promise<{ roleId: string }> }) {
  const authorization = requirePermission(request, "tenant:manage-roles");
  if (authorization.response) {
    return authorization.response;
  }

  const url = new URL(request.url);
  const session = getSessionFromRequest(request);
  const tenantId = url.searchParams.get("tenantId") ?? session.tenantId;

  if (!tenantId) {
    return Response.json({ error: "Entreprise requise" }, { status: 400 });
  }

  const tenantAuthorization = requireTenantAccess(request, tenantId);
  if (tenantAuthorization.response) {
    return tenantAuthorization.response;
  }

  const { roleId } = await params;
  const role = updateTenantRole(tenantId, roleId, await request.json());

  if (!role) {
    return Response.json({ error: "Role introuvable", roleId }, { status: 404 });
  }

  const tenant = getTenant(tenantId);
  recordAuditEvent({
    tenantId,
    tenant: tenant?.name ?? tenantId,
    actor: authorization.session.name,
    action: "Modification role",
    target: role.name,
    severity: "Controle",
  });

  return Response.json({ data: role });
}
