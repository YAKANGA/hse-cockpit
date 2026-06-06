import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { createTenantUser, getTenantAdminState } from "@/lib/admin-store";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTenant } from "@/lib/tenant-analytics";
import { apiLimiter, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip  = getClientIp(request);
  const rl  = apiLimiter(ip);
  if (!rl.ok) return rateLimitResponse(rl);

  const authorization = requirePermission(request, "tenant:manage-users");
  if (authorization.response) return authorization.response;

  const url      = new URL(request.url);
  const session  = getSessionFromRequest(request);
  const tenantId = url.searchParams.get("tenantId") ?? session.tenantId;

  if (!tenantId) return Response.json({ error: "Entreprise requise" }, { status: 400 });

  const tenantAuth = requireTenantAccess(request, tenantId);
  if (tenantAuth.response) return tenantAuth.response;

  const snapshot = getTenantAdminState(tenantId);

  // Merge DB users (persistent) with in-memory seed
  let dbUsers: { id: string; name: string; email: string; role: string; active: number }[] = [];
  try {
    const { dbListUsers } = await import("@/lib/db-client");
    const all = await dbListUsers();
    dbUsers = all
      .filter((u) => (u as { tenant_id?: string | null }).tenant_id === tenantId)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active }));
  } catch { /* DB unavailable — use in-memory only */ }

  const inMemoryIds = new Set(snapshot.users.map((u) => u.id));
  const merged = [
    ...snapshot.users,
    ...dbUsers
      .filter((u) => !inMemoryIds.has(u.id) && u.active === 1)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, entity: "", role: u.role, status: "Actif" as const })),
  ];

  return Response.json({ ...snapshot, users: merged, count: merged.length });
}

export async function POST(request: Request) {
  const ip  = getClientIp(request);
  const rl  = apiLimiter(ip);
  if (!rl.ok) return rateLimitResponse(rl);

  const authorization = requirePermission(request, "tenant:manage-users");
  if (authorization.response) return authorization.response;

  const url      = new URL(request.url);
  const session  = getSessionFromRequest(request);
  const tenantId = url.searchParams.get("tenantId") ?? session.tenantId;

  if (!tenantId) return Response.json({ error: "Entreprise requise" }, { status: 400 });

  const tenantAuth = requireTenantAccess(request, tenantId);
  if (tenantAuth.response) return tenantAuth.response;

  const input = await request.json() as { name: string; email: string; entity?: string; role?: string; password?: string };
  if (!input.name || !input.email) return Response.json({ error: "Nom et email requis" }, { status: 400 });

  const user = createTenantUser(tenantId, { name: input.name, email: input.email, entity: input.entity ?? "", role: input.role ?? "IMPORT_USER" });
  if (!user) return Response.json({ error: "Creation utilisateur echouee" }, { status: 400 });

  // Persist to DB (SQLite or Postgres based on DATABASE_URL)
  try {
    const { dbCreateUser } = await import("@/lib/db-client");
    await dbCreateUser({
      email:       user.email,
      name:        user.name,
      password:    input.password ?? "Invite@2026",
      role:        input.role ?? "IMPORT_USER",
      tenant_id:   tenantId,
      tenant_name: getTenant(tenantId)?.name ?? tenantId,
    });
  } catch { /* Non-fatal — in-memory user already created */ }

  recordAuditEvent({
    tenantId,
    tenant:   getTenant(tenantId)?.name ?? tenantId,
    actor:    authorization.session.name,
    action:   "Invitation utilisateur",
    target:   user.email,
    severity: "Controle",
  });

  return Response.json({ data: user }, { status: 201 });
}

export async function DELETE(request: Request) {
  const authorization = requirePermission(request, "tenant:manage-users");
  if (authorization.response) return authorization.response;

  const url      = new URL(request.url);
  const userId   = url.searchParams.get("userId");
  const tenantId = url.searchParams.get("tenantId") ?? getSessionFromRequest(request).tenantId;

  if (!userId) return Response.json({ error: "userId requis" }, { status: 400 });

  try {
    const { deactivateUser } = await import("@/lib/db-auto");
    await deactivateUser(userId);
  } catch { /* Non-fatal */ }

  recordAuditEvent({
    tenantId: tenantId ?? null,
    tenant:   getTenant(tenantId ?? "")?.name ?? "Plateforme",
    actor:    authorization.session.name,
    action:   "Desactivation utilisateur",
    target:   userId,
    severity: "Controle",
  });

  return Response.json({ success: true });
}
