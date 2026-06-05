import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { updateTenantEntity } from "@/lib/admin-store";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTenant } from "@/lib/tenant-analytics";

export async function PATCH(request: Request, { params }: { params: Promise<{ entityId: string }> }) {
  const authorization = requirePermission(request, "tenant:manage-settings");
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

  const { entityId } = await params;
  const entity = updateTenantEntity(tenantId, entityId, await request.json());

  if (!entity) {
    return Response.json({ error: "Entite introuvable", entityId }, { status: 404 });
  }

  const tenant = getTenant(tenantId);
  recordAuditEvent({
    tenantId,
    tenant: tenant?.name ?? tenantId,
    actor: authorization.session.name,
    action: "Modification entite",
    target: entity.name,
    severity: "Controle",
  });

  return Response.json({ data: entity });
}
