import { entities, rightsMatrix, roles, users, type Entity, type Role, type UserAccount } from "@/lib/admin-data";
import type { Permission } from "@/lib/permissions";

const TRASH_RETENTION_DAYS = 30;

type TenantAdminState = {
  tenantId: string;
  entities: Entity[];
  deletedEntities: Entity[];
  roles: Role[];
  users: UserAccount[];
  deletedUsers: UserAccount[];
  rightsMatrix: typeof rightsMatrix;
};

type CreateUserInput = {
  name: string;
  email: string;
  tenantId: string;
  entity: string;
  role: string;
  allowedSiteIds?: string[] | null;
  allowedProjectIds?: string[] | null;
};

type CreateEntityInput = {
  name: string;
  type: Entity["type"];
  tenantId: string;
};

type CreateRoleInput = {
  name: string;
  scope: Role["scope"];
  description: string;
  permissions: Permission[];
};

type UpdateUserInput = Partial<Pick<UserAccount, "entity" | "role" | "status" | "allowedSiteIds" | "allowedProjectIds">>;
type UpdateEntityInput = Partial<Pick<Entity, "name" | "type" | "active">>;
type UpdateRoleInput = Partial<Pick<Role, "name" | "scope" | "description" | "active" | "permissions">>;

const tenantEntitySeeds: Record<string, Entity[]> = {
  "acme-btp": entities.filter((e) => e.tenantId === "acme-btp"),
  "delta-mining": [
    { id: "SITE-DM-KOR", tenantId: "delta-mining", name: "Site Korhogo",            type: "Site",      siteId: "SITE-DM-KOR", users: 22, active: true },
    { id: "grp-dm",      tenantId: "delta-mining", name: "Groupe HSE Delta Mining", type: "Groupe",    users: 4,  active: true },
  ],
  "medlog-ci": [
    { id: "SITE-MDL-ABJ", tenantId: "medlog-ci", name: "Site Abidjan Port",  type: "Site", siteId: "SITE-MDL-ABJ", users: 30, active: true },
    { id: "SITE-MDL-BSM", tenantId: "medlog-ci", name: "Site Grand-Bassam",  type: "Site", siteId: "SITE-MDL-BSM", users: 12, active: true },
    { id: "grp-mdl",      tenantId: "medlog-ci", name: "Groupe HSE Medlog",  type: "Groupe", users: 3, active: true },
  ],
};

const tenantUserSeeds: Record<string, UserAccount[]> = {
  "acme-btp": users.filter((u) => u.tenantId === "acme-btp"),
  "delta-mining": [
    { id: "dm-u1", name: "S. Traore", email: "s.traore@delta.local", tenantId: "delta-mining", entity: "Groupe HSE Delta Mining", role: "Responsable HSE groupe",    status: "Actif",   allowedSiteIds: null,              allowedProjectIds: null },
    { id: "dm-u2", name: "F. Koffi",  email: "f.koffi@delta.local",  tenantId: "delta-mining", entity: "Site Korhogo",            role: "Responsable HSE site",      status: "Actif",   allowedSiteIds: ["SITE-DM-KOR"],   allowedProjectIds: null },
    { id: "dm-u3", name: "A. Bamba",  email: "a.bamba@delta.local",  tenantId: "delta-mining", entity: "Site Korhogo",            role: "Lecteur / direction",       status: "Invite",  allowedSiteIds: ["SITE-DM-KOR"],   allowedProjectIds: ["PRJ-DM-001"] },
  ],
  "medlog-ci": [
    { id: "ml-u1", name: "M. Diallo",  email: "m.diallo@medlog.local",  tenantId: "medlog-ci", entity: "Groupe HSE Medlog",  role: "Responsable HSE groupe",    status: "Actif",   allowedSiteIds: null,               allowedProjectIds: null },
    { id: "ml-u2", name: "N. Kone",    email: "n.kone@medlog.local",    tenantId: "medlog-ci", entity: "Site Abidjan Port", role: "Lecteur / direction",       status: "Actif",   allowedSiteIds: ["SITE-MDL-ABJ"],   allowedProjectIds: null },
    { id: "ml-u3", name: "A. Kouadio", email: "a.kouadio@medlog.local", tenantId: "medlog-ci", entity: "Site Grand-Bassam", role: "Utilisateur saisie / import", status: "Invite", allowedSiteIds: ["SITE-MDL-BSM"],   allowedProjectIds: ["PRJ-MDL-002"] },
  ],
};

let adminStore: Record<string, TenantAdminState> = Object.fromEntries(
  Object.entries(tenantEntitySeeds).map(([tenantId, tenantEntities]) => [
    tenantId,
    {
      tenantId,
      entities: tenantEntities.map((entity) => ({ ...entity })),
      deletedEntities: [],
      roles: roles.map((role) => ({ ...role })),
      users: (tenantUserSeeds[tenantId] ?? []).map((user) => ({ ...user })),
      deletedUsers: [],
      rightsMatrix: rightsMatrix.map((right) => ({ ...right })),
    },
  ]),
);

function isExpired(deletedAt: string): boolean {
  const diff = Date.now() - new Date(deletedAt).getTime();
  return diff > TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

function cloneState(state: TenantAdminState) {
  const stillInEntityTrash = state.deletedEntities.filter((e) => e.deletedAt && !isExpired(e.deletedAt));
  const stillInUserTrash   = state.deletedUsers.filter((u) => u.deletedAt && !isExpired(u.deletedAt));
  const entitiesWithCounts = state.entities.map((entity) => ({
    ...entity,
    users: state.users.filter((user) => user.entity === entity.name).length,
  }));
  return {
    tenantId:       state.tenantId,
    entities:       entitiesWithCounts,
    deletedEntities: stillInEntityTrash.map((e) => ({ ...e })),
    roles:          state.roles.map((role) => ({ ...role })),
    users:          state.users.map((user) => ({ ...user })),
    deletedUsers:   stillInUserTrash.map((u) => ({ ...u })),
    rightsMatrix:   state.rightsMatrix.map((right) => ({ ...right })),
  };
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `role-${Date.now()}`;
}

function permissionActions(permissions: Permission[]) {
  const actions = [
    permissions.includes("module:view")     ? "Lire"        : null,
    permissions.includes("module:import")   ? "Importer"    : null,
    permissions.includes("module:validate") ? "Valider"     : null,
    permissions.includes("module:export")   ? "Exporter"    : null,
    permissions.some((p) => p.startsWith("tenant:")) ? "Administrer" : null,
    permissions.includes("audit:view")      ? "Auditer"     : null,
  ].filter(Boolean);
  return actions.join(", ") || "Aucun droit actif";
}

function roleRightRow(role: Role) {
  return {
    role: role.name,
    perimetre: role.scope,
    modules: role.permissions.includes("module:view") ? "Modules autorises" : "Administration",
    actions: permissionActions(role.permissions),
  };
}

export function getTenantAdminState(tenantId: string) {
  if (!adminStore[tenantId]) {
    adminStore[tenantId] = {
      tenantId,
      entities: [
        { id: `${tenantId}-default`, tenantId, name: "Entite principale", type: "Direction", users: 1, active: true },
      ],
      deletedEntities: [],
      roles: roles.map((role) => ({ ...role })),
      users: [],
      deletedUsers: [],
      rightsMatrix: rightsMatrix.map((right) => ({ ...right })),
    };
  }
  return cloneState(adminStore[tenantId]);
}

export function softDeleteEntity(tenantId: string, entityId: string) {
  const state = getTenantAdminState(tenantId);
  const target = state.entities.find((e) => e.id === entityId);
  if (!target) return null;
  const deleted = { ...target, deletedAt: new Date().toISOString(), active: false };
  adminStore[tenantId] = {
    ...adminStore[tenantId],
    entities: adminStore[tenantId].entities.filter((e) => e.id !== entityId),
    deletedEntities: [deleted, ...adminStore[tenantId].deletedEntities],
  };
  return deleted;
}

export function restoreEntity(tenantId: string, entityId: string) {
  const raw = adminStore[tenantId];
  if (!raw) return null;
  const target = raw.deletedEntities.find((e) => e.id === entityId);
  if (!target) return null;
  const restored = { ...target, deletedAt: undefined, active: true };
  adminStore[tenantId] = {
    ...raw,
    deletedEntities: raw.deletedEntities.filter((e) => e.id !== entityId),
    entities: [restored, ...raw.entities],
  };
  return restored;
}

export function permanentDeleteEntity(tenantId: string, entityId: string) {
  const raw = adminStore[tenantId];
  if (!raw) return false;
  const inTrash = raw.deletedEntities.some((e) => e.id === entityId);
  if (!inTrash) return false;
  adminStore[tenantId] = { ...raw, deletedEntities: raw.deletedEntities.filter((e) => e.id !== entityId) };
  return true;
}

export function softDeleteUser(tenantId: string, userId: string) {
  const state = getTenantAdminState(tenantId);
  const target = state.users.find((u) => u.id === userId);
  if (!target) return null;
  const deleted = { ...target, deletedAt: new Date().toISOString(), status: "Suspendu" as const };
  adminStore[tenantId] = {
    ...adminStore[tenantId],
    users: adminStore[tenantId].users.filter((u) => u.id !== userId),
    deletedUsers: [deleted, ...adminStore[tenantId].deletedUsers],
  };
  return deleted;
}

export function restoreUser(tenantId: string, userId: string) {
  const raw = adminStore[tenantId];
  if (!raw) return null;
  const target = raw.deletedUsers.find((u) => u.id === userId);
  if (!target) return null;
  const restored = { ...target, deletedAt: undefined, status: "Invite" as const };
  adminStore[tenantId] = {
    ...raw,
    deletedUsers: raw.deletedUsers.filter((u) => u.id !== userId),
    users: [restored, ...raw.users],
  };
  return restored;
}

export function permanentDeleteUser(tenantId: string, userId: string) {
  const raw = adminStore[tenantId];
  if (!raw) return false;
  const inTrash = raw.deletedUsers.some((u) => u.id === userId);
  if (!inTrash) return false;
  adminStore[tenantId] = { ...raw, deletedUsers: raw.deletedUsers.filter((u) => u.id !== userId) };
  return true;
}

export function createTenantUser(tenantId: string, input: CreateUserInput) {
  const state = getTenantAdminState(tenantId);
  const name  = input.name.trim();
  const email = input.email.trim();
  if (!name || !email) return null;

  const user: UserAccount = {
    id: `${tenantId}-u-${Date.now()}`,
    name,
    email,
    tenantId,
    entity: input.entity,
    role: input.role,
    status: "Invite",
    allowedSiteIds: input.allowedSiteIds ?? null,
    allowedProjectIds: input.allowedProjectIds ?? null,
  };

  adminStore[tenantId] = { ...state, users: [user, ...state.users] };
  return user;
}

export function createTenantEntity(tenantId: string, input: CreateEntityInput) {
  const state = getTenantAdminState(tenantId);
  const name  = input.name.trim();
  if (!name) return null;

  const entity: Entity = {
    id: `${tenantId}-ent-${Date.now()}`,
    tenantId,
    name,
    type: input.type,
    users: 0,
    active: true,
  };

  adminStore[tenantId] = { ...state, entities: [entity, ...state.entities] };
  return entity;
}

export function createTenantRole(tenantId: string, input: CreateRoleInput) {
  const state = getTenantAdminState(tenantId);
  const name  = input.name.trim();
  if (!name) return null;

  const role: Role = {
    id: `${tenantId}-${slugify(name)}-${Date.now()}`,
    name,
    scope: input.scope,
    description: input.description.trim() || "Role cree pour le perimetre entreprise.",
    active: true,
    permissions: input.permissions ?? [],
  };

  adminStore[tenantId] = {
    ...state,
    roles: [role, ...state.roles],
    rightsMatrix: [roleRightRow(role), ...state.rightsMatrix],
  };
  return role;
}

export function updateTenantRole(tenantId: string, roleId: string, input: UpdateRoleInput) {
  const state    = getTenantAdminState(tenantId);
  const existing = state.roles.find((role) => role.id === roleId);
  if (!existing) return null;

  const updated: Role = { ...existing, ...input };
  const withoutOld = state.rightsMatrix.filter((r) => r.role !== existing.name);

  adminStore[tenantId] = {
    ...state,
    roles: state.roles.map((role) => (role.id === roleId ? updated : role)),
    rightsMatrix: [roleRightRow(updated), ...withoutOld],
  };
  return updated;
}

export function updateTenantEntity(tenantId: string, entityId: string, input: UpdateEntityInput) {
  const state    = getTenantAdminState(tenantId);
  const existing = state.entities.find((e) => e.id === entityId);
  if (!existing) return null;

  const updated = { ...existing, ...input };
  adminStore[tenantId] = {
    ...state,
    entities: state.entities.map((e) => (e.id === entityId ? updated : e)),
  };
  return updated;
}

export function updateTenantUser(tenantId: string, userId: string, input: UpdateUserInput) {
  const state    = getTenantAdminState(tenantId);
  const existing = state.users.find((u) => u.id === userId);
  if (!existing) return null;

  const updated = { ...existing, ...input };
  adminStore[tenantId] = {
    ...state,
    users: state.users.map((u) => (u.id === userId ? updated : u)),
  };
  return updated;
}
