import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { updateTenantUser, softDeleteUser, restoreUser, permanentDeleteUser } from "@/lib/admin-store";
import type { UserAccount } from "@/lib/admin-data";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTenant } from "@/lib/tenant-analytics";

const userStatuses: UserAccount["status"][] = ["Actif", "Suspendu", "Invite"];

function isUserStatus(value: unknown): value is UserAccount["status"] {
  return typeof value === "string" && userStatuses.includes(value as UserAccount["status"]);
}

function getAuth(request: Request) {
  const authorization = requirePermission(request, "tenant:manage-users");
  if (authorization.response) return { authorization, tenantId: null };
  const url = new URL(request.url);
  const session = getSessionFromRequest(request);
  const tenantId = url.searchParams.get("tenantId") ?? session.tenantId;
  if (!tenantId) return { authorization, tenantId: null };
  const tenantAuth = requireTenantAccess(request, tenantId);
  if (tenantAuth.response) return { authorization: tenantAuth, tenantId: null };
  return { authorization, tenantId };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { authorization, tenantId } = getAuth(request);
  if (authorization.response) return authorization.response;
  if (!tenantId) return Response.json({ error: "Entreprise requise" }, { status: 400 });

  const { userId } = await params;
  const body = await request.json() as { restore?: boolean; status?: string; entity?: string; role?: string };

  if (body.restore) {
    const user = restoreUser(tenantId, userId);
    if (!user) return Response.json({ error: "Utilisateur introuvable en corbeille", userId }, { status: 404 });
    const tenant = getTenant(tenantId);
    recordAuditEvent({ tenantId, tenant: tenant?.name ?? tenantId, actor: authorization.session.name, action: "Restauration utilisateur", target: user.name, severity: "Controle" });
    return Response.json({ data: user });
  }

  if (body.status !== undefined && !isUserStatus(body.status)) {
    return Response.json({ error: "Statut utilisateur invalide" }, { status: 400 });
  }

  const input: Partial<Pick<UserAccount, "entity" | "role" | "status" | "allowedSiteIds" | "allowedProjectIds">> = {
    ...(body.entity !== undefined ? { entity: body.entity } : {}),
    ...(body.role !== undefined ? { role: body.role } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
  };

  const user = updateTenantUser(tenantId, userId, input);
  if (!user) return Response.json({ error: "Utilisateur introuvable", userId }, { status: 404 });

  const tenant = getTenant(tenantId);
  recordAuditEvent({ tenantId, tenant: tenant?.name ?? tenantId, actor: authorization.session.name, action: "Modification utilisateur", target: `${user.name} - ${user.role}`, severity: "Controle" });
  return Response.json({ data: user });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { authorization, tenantId } = getAuth(request);
  if (authorization.response) return authorization.response;
  if (!tenantId) return Response.json({ error: "Entreprise requise" }, { status: 400 });

  const { userId } = await params;
  const url = new URL(request.url);
  const permanent = url.searchParams.get("permanent") === "true";
  const tenant = getTenant(tenantId);

  if (permanent) {
    const ok = permanentDeleteUser(tenantId, userId);
    if (!ok) return Response.json({ error: "Utilisateur introuvable en corbeille", userId }, { status: 404 });
    recordAuditEvent({ tenantId, tenant: tenant?.name ?? tenantId, actor: authorization.session.name, action: "Suppression definitive utilisateur", target: userId, severity: "Critique" });
    return Response.json({ success: true, permanent: true });
  }

  const user = softDeleteUser(tenantId, userId);
  if (!user) return Response.json({ error: "Utilisateur introuvable", userId }, { status: 404 });
  recordAuditEvent({ tenantId, tenant: tenant?.name ?? tenantId, actor: authorization.session.name, action: "Suppression utilisateur (corbeille)", target: user.name, severity: "Controle" });
  return Response.json({ data: user });
}
