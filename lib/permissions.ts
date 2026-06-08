export type Permission =
  | "platform:manage-tenants"
  | "tenant:manage-settings"
  | "tenant:manage-users"
  | "tenant:manage-roles"
  | "module:view"
  | "module:import"
  | "module:validate"
  | "module:export"
  | "audit:view";

export type AppRole =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "HSE_GROUP"
  | "HSE_SITE"
  | "IMPORT_USER"
  | "VIEWER";

export type AppSession = {
  userId: string;
  name: string;
  email: string;
  tenantId: string | null;
  tenantName: string | null;
  role: AppRole;
  permissions: Permission[];
};

export const rolePermissions: Record<AppRole, Permission[]> = {
  SUPER_ADMIN: [
    "platform:manage-tenants",
    "tenant:manage-settings",
    "tenant:manage-users",
    "tenant:manage-roles",
    "module:view",
    "module:import",
    "module:validate",
    "module:export",
    "audit:view",
  ],
  TENANT_ADMIN: [
    "tenant:manage-settings",
    "tenant:manage-users",
    "tenant:manage-roles",
    "module:view",
    "module:import",
    "module:validate",
    "module:export",
    "audit:view",
  ],
  HSE_GROUP: ["module:view", "module:validate", "module:export", "audit:view"],
  HSE_SITE: ["module:view", "module:import", "module:validate", "module:export"],
  IMPORT_USER: ["module:view", "module:import"],
  VIEWER: ["module:view", "module:export"],
};

export const demoSessions: AppSession[] = [
  {
    userId: "super-admin",
    name: "Super Admin",
    email: "superadmin@platform.local",
    tenantId: null,
    tenantName: null,
    role: "SUPER_ADMIN",
    permissions: rolePermissions.SUPER_ADMIN,
  },
  {
    userId: "tenant-admin-acme",
    name: "A. Kouadio",
    email: "a.kouadio@acme.local",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    role: "TENANT_ADMIN",
    permissions: rolePermissions.TENANT_ADMIN,
  },
  {
    userId: "hse-group-acme",
    name: "S. Traore",
    email: "s.traore@acme.local",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    role: "HSE_GROUP",
    permissions: rolePermissions.HSE_GROUP,
  },
  {
    userId: "viewer-medlog",
    name: "N. Kone",
    email: "n.kone@medlog.local",
    tenantId: "medlog-ci",
    tenantName: "Medlog CI",
    role: "VIEWER",
    permissions: rolePermissions.VIEWER,
  },
  {
    userId: "import-user-acme",
    name: "M. Diallo",
    email: "m.diallo@acme.local",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    role: "IMPORT_USER",
    permissions: rolePermissions.IMPORT_USER,
  },
];

export function hasPermission(session: AppSession, permission: Permission) {
  return session.permissions.includes(permission);
}

export function getDemoSession(userId = "tenant-admin-acme") {
  return demoSessions.find((session) => session.userId === userId) ?? demoSessions[0];
}
