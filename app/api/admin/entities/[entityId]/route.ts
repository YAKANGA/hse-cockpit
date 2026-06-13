import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { updateTenantEntity, softDeleteEntity, restoreEntity, permanentDeleteEntity } from "@/lib/admin-store";
import type { Entity } from "@/lib/admin-data";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTenant } from "@/lib/tenant-analytics";

const entityTypes: Entity["type"][] = ["Groupe", "Site", "Projet", "Direction"];

function isEntityType(value: unknown): value is Entity["type"] {
  return typeof value === "string" && entityTypes.includes(value as Entity["type"]);
}

function getAuth(request: Request) {
  const authorization = requirePermission(request, "tenant:manage-settings");
  if (authorization.response) return { authorization, tenantId: null };
  const url = new URL(request.url);
  const session = getSessionFromRequest(request);
  const tenantId = url.searchParams.get("tenantId") ?? session.tenantId;
  if (!tenantId) return { authorization, tenantId: null };
  const tenantAuth = requireTenantAccess(request, tenantId);
  if (tenantAuth.response) return { authorization: tenantAuth, tenantId: null };
  return { authorization, tenantId };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ entityId: string }> }) {
  const { authorization, tenantId } = getAuth(request);
  if (authorization.response) return authorization.response;
  if (!tenantId) return Response.json({ error: "Entreprise requise" }, { status: 400 });

  const { entityId } = await params;
  const body = await request.json() as { restore?: boolean; active?: boolean; name?: string; type?: string };

  if (body.restore) {
    const entity = restoreEntity(tenantId, entityId);
    if (!entity) return Response.json({ error: "Entite introuvable en corbeille", entityId }, { status: 404 });
    const tenant = getTenant(tenantId);
    recordAuditEvent({ tenantId, tenant: tenant?.name ?? tenantId, actor: authorization.session.name, action: "Restauration entite", target: entity.name, severity: "Controle" });
    return Response.json({ data: entity });
  }

  if (body.type !== undefined && !isEntityType(body.type)) {
    return Response.json({ error: "Type d'entite invalide" }, { status: 400 });
  }

  const input: Partial<Pick<Entity, "name" | "active" | "type">> = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.active !== undefined ? { active: body.active } : {}),
    ...(body.type !== undefined ? { type: body.type } : {}),
  };

  const entity = updateTenantEntity(tenantId, entityId, input);
  if (!entity) return Response.json({ error: "Entite introuvable", entityId }, { status: 404 });

  const tenant = getTenant(tenantId);
  recordAuditEvent({ tenantId, tenant: tenant?.name ?? tenantId, actor: authorization.session.name, action: "Modification entite", target: entity.name, severity: "Controle" });
  return Response.json({ data: entity });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ entityId: string }> }) {
  const { authorization, tenantId } = getAuth(request);
  if (authorization.response) return authorization.response;
  if (!tenantId) return Response.json({ error: "Entreprise requise" }, { status: 400 });

  const { entityId } = await params;
  const url = new URL(request.url);
  const permanent = url.searchParams.get("permanent") === "true";
  const tenant = getTenant(tenantId);

  if (permanent) {
    const ok = permanentDeleteEntity(tenantId, entityId);
    if (!ok) return Response.json({ error: "Entite introuvable en corbeille", entityId }, { status: 404 });
    recordAuditEvent({ tenantId, tenant: tenant?.name ?? tenantId, actor: authorization.session.name, action: "Suppression definitive entite", target: entityId, severity: "Critique" });
    return Response.json({ success: true, permanent: true });
  }

  const entity = softDeleteEntity(tenantId, entityId);
  if (!entity) return Response.json({ error: "Entite introuvable", entityId }, { status: 404 });
  recordAuditEvent({ tenantId, tenant: tenant?.name ?? tenantId, actor: authorization.session.name, action: "Suppression entite (corbeille)", target: entity.name, severity: "Controle" });
  return Response.json({ data: entity });
}
