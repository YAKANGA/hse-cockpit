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
  /**
   * IDs des sites autorisés (HSESite.id).
   * null = accès à tous les sites du tenant (ou plateforme entière pour SUPER_ADMIN).
   * [] = aucun site (compte désactivé / en attente d'assignation).
   */
  allowedSiteIds: string[] | null;
  /**
   * IDs des projets autorisés dans les sites autorisés.
   * null = tous les projets des sites autorisés.
   */
  allowedProjectIds: string[] | null;
};

export const rolePermissions: Record<AppRole, Permission[]> = {
  SUPER_ADMIN: [
    "platform:manage-tenants",
    "tenant:manage-settings",
    // tenant:manage-users retiré — création d'utilisateurs réservée au TENANT_ADMIN
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
  HSE_GROUP:   ["module:view", "module:validate", "module:export", "audit:view"],
  HSE_SITE:    ["module:view", "module:import", "module:validate", "module:export"],
  IMPORT_USER: ["module:view", "module:import"],
  VIEWER:      ["module:view", "module:export"],
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
    allowedSiteIds: null,
    allowedProjectIds: null,
  },
  {
    userId: "tenant-admin-acme",
    name: "A. Kouadio",
    email: "a.kouadio@acme.local",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    role: "TENANT_ADMIN",
    permissions: rolePermissions.TENANT_ADMIN,
    allowedSiteIds: null,       // tous les sites ACME
    allowedProjectIds: null,    // tous les projets ACME
  },
  {
    userId: "hse-group-acme",
    name: "S. Traore",
    email: "s.traore@acme.local",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    role: "HSE_GROUP",
    permissions: rolePermissions.HSE_GROUP,
    allowedSiteIds: null,       // voit tous les sites (rôle groupe)
    allowedProjectIds: null,
  },
  {
    userId: "hse-site-acme",
    name: "K. Bamba",
    email: "k.bamba@acme.local",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    role: "HSE_SITE",
    permissions: rolePermissions.HSE_SITE,
    allowedSiteIds: ["SITE-ACME-ABJ", "SITE-ACME-BKE"],  // 2 sites uniquement
    allowedProjectIds: null,    // tous les projets de ces sites
  },
  {
    userId: "import-user-acme",
    name: "M. Diallo",
    email: "m.diallo@acme.local",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    role: "IMPORT_USER",
    permissions: rolePermissions.IMPORT_USER,
    allowedSiteIds: ["SITE-ACME-BKE"],          // un seul site
    allowedProjectIds: ["PRJ-BKE-001"],         // un seul projet
  },
  {
    userId: "viewer-medlog",
    name: "N. Kone",
    email: "n.kone@medlog.local",
    tenantId: "medlog-ci",
    tenantName: "Medlog CI",
    role: "VIEWER",
    permissions: rolePermissions.VIEWER,
    allowedSiteIds: null,       // tous les sites Medlog
    allowedProjectIds: null,
  },
];

// ── Helpers de contrôle d'accès ──────────────────────────────────────────────

export function hasPermission(session: AppSession, permission: Permission): boolean {
  return session.permissions.includes(permission);
}

export function getDemoSession(userId = "tenant-admin-acme"): AppSession {
  return demoSessions.find((s) => s.userId === userId) ?? demoSessions[1];
}

/**
 * Vérifie si la session peut accéder à un projet spécifique.
 * Cascade : tenant → site → projet.
 */
export function canAccessProject(
  session: AppSession,
  projectTenantId: string,
  projectSiteId: string,
  projectId: string,
): boolean {
  if (session.role === "SUPER_ADMIN") return true;
  if (session.tenantId !== projectTenantId) return false;
  if (session.allowedSiteIds && !session.allowedSiteIds.includes(projectSiteId)) return false;
  if (session.allowedProjectIds && !session.allowedProjectIds.includes(projectId)) return false;
  return true;
}

/**
 * Retourne les siteIds autorisés pour un tenant donné.
 * null = tous les sites du tenant (pas de restriction fine).
 */
export function resolveScopedSiteIds(session: AppSession): string[] | null {
  if (session.role === "SUPER_ADMIN") return null;
  return session.allowedSiteIds;
}

/**
 * Retourne les projectIds autorisés.
 * null = tous les projets des sites autorisés.
 */
export function resolveScopedProjectIds(session: AppSession): string[] | null {
  if (session.role === "SUPER_ADMIN") return null;
  return session.allowedProjectIds;
}
