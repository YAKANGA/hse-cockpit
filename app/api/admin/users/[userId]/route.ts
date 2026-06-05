import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { updateTenantUser } from "@/lib/admin-store";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTenant } from "@/lib/tenant-analytics";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const authorization = requirePermission(request, "tenant:manage-users");
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

  const { userId } = await params;
  const user = updateTenantUser(tenantId, userId, await request.json());

  if (!user) {
    return Response.json({ error: "Utilisateur introuvable", userId }, { status: 404 });
  }

  const tenant = getTenant(tenantId);
  recordAuditEvent({
    tenantId,
    tenant: tenant?.name ?? tenantId,
    actor: authorization.session.name,
    action: "Modification utilisateur",
    target: `${user.name} - ${user.role}`,
    severity: "Controle",
  });

  return Response.json({ data: user });
}
