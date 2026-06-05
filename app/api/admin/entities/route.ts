import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { createTenantEntity, getTenantAdminState } from "@/lib/admin-store";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTenant } from "@/lib/tenant-analytics";

export async function GET(request: Request) {
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

  const snapshot = getTenantAdminState(tenantId);

  return Response.json({
    tenantId,
    data: snapshot.entities,
    count: snapshot.entities.length,
  });
}

export async function POST(request: Request) {
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

  const entity = createTenantEntity(tenantId, await request.json());

  if (!entity) {
    return Response.json({ error: "Nom entite requis" }, { status: 400 });
  }

  const tenant = getTenant(tenantId);
  recordAuditEvent({
    tenantId,
    tenant: tenant?.name ?? tenantId,
    actor: authorization.session.name,
    action: "Creation entite",
    target: entity.name,
    severity: "Controle",
  });

  return Response.json({ data: entity }, { status: 201 });
}
