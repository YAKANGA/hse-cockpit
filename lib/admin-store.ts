import { entities, rightsMatrix, roles, users, type Entity, type Role, type UserAccount } from "@/lib/admin-data";
import type { Permission } from "@/lib/permissions";

type TenantAdminState = {
  tenantId: string;
  entities: Entity[];
  roles: Role[];
  users: UserAccount[];
  rightsMatrix: typeof rightsMatrix;
};

type CreateUserInput = {
  name: string;
  email: string;
  entity: string;
  role: string;
};

type CreateEntityInput = {
  name: string;
  type: Entity["type"];
};

type CreateRoleInput = {
  name: string;
  scope: string;
  description: string;
  permissions: Permission[];
};

type UpdateUserInput = Partial<Pick<UserAccount, "entity" | "role" | "status">>;
type UpdateEntityInput = Partial<Pick<Entity, "name" | "type" | "active">>;
type UpdateRoleInput = Partial<Pick<Role, "name" | "scope" | "description" | "active" | "permissions">>;

const tenantEntitySeeds: Record<string, Entity[]> = {
  "acme-btp": entities,
  "delta-mining": [
    { id: "dm-grp", name: "Direction Mines", type: "Direction", users: 7, active: true },
    { id: "dm-bke", name: "Mine Bouake", type: "Site", users: 19, active: true },
    { id: "dm-yam", name: "Projet Yamoussoukro", type: "Projet", users: 8, active: true },
  ],
  "medlog-ci": [
    { id: "ml-abj", name: "Hub Abidjan", type: "Site", users: 22, active: true },
    { id: "ml-spd", name: "Depot San Pedro", type: "Site", users: 15, active: true },
    { id: "ml-ops", name: "Operations Logistiques", type: "Direction", users: 9, active: true },
  ],
};

const tenantUserSeeds: Record<string, UserAccount[]> = {
  "acme-btp": users,
  "delta-mining": [
    { id: "dm-u1", name: "S. Traore", email: "s.traore@delta.local", entity: "Direction Mines", role: "Responsable HSE groupe", status: "Actif" },
    { id: "dm-u2", name: "F. Koffi", email: "f.koffi@delta.local", entity: "Mine Bouake", role: "Responsable HSE site", status: "Actif" },
    { id: "dm-u3", name: "A. Bamba", email: "a.bamba@delta.local", entity: "Projet Yamoussoukro", role: "Lecteur / direction", status: "Invite" },
  ],
  "medlog-ci": [
    { id: "ml-u1", name: "M. Diallo", email: "m.diallo@medlog.local", entity: "Operations Logistiques", role: "Responsable HSE site", status: "Actif" },
    { id: "ml-u2", name: "N. Kone", email: "n.kone@medlog.local", entity: "Hub Abidjan", role: "Lecteur / direction", status: "Actif" },
    { id: "ml-u3", name: "A. Kouadio", email: "a.kouadio@medlog.local", entity: "Depot San Pedro", role: "Utilisateur saisie / import", status: "Invite" },
  ],
};

let adminStore: Record<string, TenantAdminState> = Object.fromEntries(
  Object.entries(tenantEntitySeeds).map(([tenantId, tenantEntities]) => [
    tenantId,
    {
      tenantId,
      entities: tenantEntities.map((entity) => ({ ...entity })),
      roles: roles.map((role) => ({ ...role })),
      users: (tenantUserSeeds[tenantId] ?? []).map((user) => ({ ...user })),
      rightsMatrix: rightsMatrix.map((right) => ({ ...right })),
    },
  ]),
);

function cloneState(state: TenantAdminState) {
  const entitiesWithCounts = state.entities.map((entity) => ({
    ...entity,
    users: state.users.filter((user) => user.entity === entity.name).length,
  }));

  return {
    tenantId: state.tenantId,
    entities: entitiesWithCounts,
    roles: state.roles.map((role) => ({ ...role })),
    users: state.users.map((user) => ({ ...user })),
    rightsMatrix: state.rightsMatrix.map((right) => ({ ...right })),
  };
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `role-${Date.now()}`;
}

function permissionActions(permissions: Permission[]) {
  const actions = [
    permissions.includes("module:view") ? "Lire" : null,
    permissions.includes("module:import") ? "Importer" : null,
    permissions.includes("module:validate") ? "Valider" : null,
    permissions.includes("module:export") ? "Exporter" : null,
    permissions.some((permission) => permission.startsWith("tenant:")) ? "Administrer" : null,
    permissions.includes("audit:view") ? "Auditer" : null,
  ].filter(Boolean);

  return actions.join(", ") || "Aucun droit actif";
}

function roleRightRow(role: Role) {
  return {
    role: role.name,
    modules: role.permissions.includes("module:view") ? "Modules autorises" : "Administration",
    actions: permissionActions(role.permissions),
  };
}

export function getTenantAdminState(tenantId: string) {
  if (!adminStore[tenantId]) {
    adminStore[tenantId] = {
      tenantId,
      entities: [
        { id: `${tenantId}-default`, name: "Entite principale", type: "Direction", users: 1, active: true },
      ],
      roles: roles.map((role) => ({ ...role })),
      users: [],
      rightsMatrix: rightsMatrix.map((right) => ({ ...right })),
    };
  }

  return cloneState(adminStore[tenantId]);
}

export function createTenantUser(tenantId: string, input: CreateUserInput) {
  const state = getTenantAdminState(tenantId);
  const name = input.name.trim();
  const email = input.email.trim();

  if (!name || !email) {
    return null;
  }

  const user: UserAccount = {
    id: `${tenantId}-u-${Date.now()}`,
    name,
    email,
    entity: input.entity,
    role: input.role,
    status: "Invite",
  };

  adminStore[tenantId] = {
    ...state,
    users: [user, ...state.users],
  };

  return user;
}

export function createTenantEntity(tenantId: string, input: CreateEntityInput) {
  const state = getTenantAdminState(tenantId);
  const name = input.name.trim();

  if (!name) {
    return null;
  }

  const entity: Entity = {
    id: `${tenantId}-ent-${Date.now()}`,
    name,
    type: input.type,
    users: 0,
    active: true,
  };

  adminStore[tenantId] = {
    ...state,
    entities: [entity, ...state.entities],
  };

  return entity;
}

export function createTenantRole(tenantId: string, input: CreateRoleInput) {
  const state = getTenantAdminState(tenantId);
  const name = input.name.trim();

  if (!name) {
    return null;
  }

  const role: Role = {
    id: `${tenantId}-${slugify(name)}-${Date.now()}`,
    name,
    scope: input.scope.trim() || "Entreprise",
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
  const state = getTenantAdminState(tenantId);
  const existing = state.roles.find((role) => role.id === roleId);

  if (!existing) {
    return null;
  }

  const updated: Role = { ...existing, ...input };
  const rightsMatrixWithoutRole = state.rightsMatrix.filter((right) => right.role !== existing.name);

  adminStore[tenantId] = {
    ...state,
    roles: state.roles.map((role) => (role.id === roleId ? updated : role)),
    rightsMatrix: [roleRightRow(updated), ...rightsMatrixWithoutRole],
  };

  return updated;
}

export function updateTenantEntity(tenantId: string, entityId: string, input: UpdateEntityInput) {
  const state = getTenantAdminState(tenantId);
  const existing = state.entities.find((entity) => entity.id === entityId);

  if (!existing) {
    return null;
  }

  const updated = { ...existing, ...input };
  adminStore[tenantId] = {
    ...state,
    entities: state.entities.map((entity) => (entity.id === entityId ? updated : entity)),
  };

  return updated;
}

export function updateTenantUser(tenantId: string, userId: string, input: UpdateUserInput) {
  const state = getTenantAdminState(tenantId);
  const existing = state.users.find((user) => user.id === userId);

  if (!existing) {
    return null;
  }

  const updated = { ...existing, ...input };
  adminStore[tenantId] = {
    ...state,
    users: state.users.map((user) => (user.id === userId ? updated : user)),
  };

  return updated;
}
