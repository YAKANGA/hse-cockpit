import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { createTenantUser, getTenantAdminState } from "@/lib/admin-store";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTenant } from "@/lib/tenant-analytics";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

  const snapshot = getTenantAdminState(tenantId);

  // Merge DB-persisted users (survive restarts) with in-memory seed users
  let dbUsers: { id: string; name: string; email: string; role: string; active: number }[] = [];
  try {
    const { listUsersByTenant } = await import("@/lib/db");
    dbUsers = listUsersByTenant(tenantId) as typeof dbUsers;
  } catch { /* SQLite unavailable */ }

  const inMemoryIds = new Set(snapshot.users.map((u) => u.id));
  const mergedUsers = [
    ...snapshot.users,
    ...dbUsers
      .filter((u) => !inMemoryIds.has(u.id) && u.active === 1)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, entity: "", role: u.role, status: "Actif" as const })),
  ];

  return Response.json({
    ...snapshot,
    users: mergedUsers,
    count: mergedUsers.length,
  });
}

export async function POST(request: Request) {
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

  const input = await request.json() as { name: string; email: string; entity?: string; role?: string; password?: string };
  const user = createTenantUser(tenantId, { name: input.name, email: input.email, entity: input.entity ?? "", role: input.role ?? "IMPORT_USER" });

  if (!user) {
    return Response.json({ error: "Nom et email requis" }, { status: 400 });
  }

  // Also persist to SQLite so user survives server restarts
  try {
    const { createUser } = await import("@/lib/db");
    createUser({
      email: user.email,
      name: user.name,
      password: input.password ?? "Invite@2026",
      role: input.role ?? "IMPORT_USER",
      tenant_id: tenantId,
      tenant_name: getTenant(tenantId)?.name ?? tenantId,
    });
  } catch { /* Non-fatal — in-memory user already created */ }

  const tenant = getTenant(tenantId);
  recordAuditEvent({
    tenantId,
    tenant: tenant?.name ?? tenantId,
    actor: authorization.session.name,
    action: "Invitation utilisateur",
    target: user.email,
    severity: "Controle",
  });

  return Response.json({ data: user }, { status: 201 });
}
