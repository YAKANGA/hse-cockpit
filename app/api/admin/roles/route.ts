import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { createTenantRole, getTenantAdminState } from "@/lib/admin-store";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTenant } from "@/lib/tenant-analytics";

export async function GET(request: Request) {
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

  const snapshot = getTenantAdminState(tenantId);

  return Response.json({
    roles: snapshot.roles,
    rightsMatrix: snapshot.rightsMatrix,
  });
}

export async function POST(request: Request) {
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

  const role = createTenantRole(tenantId, await request.json());

  if (!role) {
    return Response.json({ error: "Nom role requis" }, { status: 400 });
  }

  const tenant = getTenant(tenantId);
  recordAuditEvent({
    tenantId,
    tenant: tenant?.name ?? tenantId,
    actor: authorization.session.name,
    action: "Creation role",
    target: role.name,
    severity: "Controle",
  });

  return Response.json({ data: role }, { status: 201 });
}
