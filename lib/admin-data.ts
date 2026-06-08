import type { Permission } from "@/lib/permissions";

export type Entity = {
  id: string;
  name: string;
  type: "Groupe" | "Site" | "Projet" | "Direction";
  tenantId: string;
  siteId?: string;    // renseigné pour les entités de type Site/Projet
  users: number;
  active: boolean;
};

export type Role = {
  id: string;
  name: string;
  /** Périmètre d'application du rôle dans la hiérarchie. */
  scope: "Plateforme" | "Entreprise" | "Site" | "Projet" | "Lecture";
  description: string;
  active: boolean;
  permissions: Permission[];
};

/**
 * Compte utilisateur avec périmètre d'accès structuré.
 * allowedSiteIds: null = tous les sites du tenant ; [] = aucun accès site.
 * allowedProjectIds: null = tous les projets des sites autorisés.
 */
export type UserAccount = {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  /** Nom de l'entité d'affectation (affichage). */
  entity: string;
  role: string;
  status: "Actif" | "Suspendu" | "Invite";
  allowedSiteIds: string[] | null;
  allowedProjectIds: string[] | null;
};

// ── Entités structurées par entreprise ──────────────────────────────────────

export const entities: Entity[] = [
  // ACME BTP — niveau groupe
  { id: "grp-acme",     tenantId: "acme-btp",     name: "Groupe HSE ACME",        type: "Groupe",    users: 8,  active: true  },
  // ACME BTP — sites
  { id: "SITE-ACME-ABJ", tenantId: "acme-btp",    name: "Site Abidjan",            type: "Site",      users: 42, active: true,  siteId: "SITE-ACME-ABJ" },
  { id: "SITE-ACME-BKE", tenantId: "acme-btp",    name: "Site Bouake",             type: "Site",      users: 24, active: true,  siteId: "SITE-ACME-BKE" },
  { id: "SITE-ACME-SPD", tenantId: "acme-btp",    name: "Site San Pedro",          type: "Site",      users: 18, active: true,  siteId: "SITE-ACME-SPD" },
  { id: "SITE-ACME-YMK", tenantId: "acme-btp",    name: "Site Yamoussoukro",       type: "Site",      users: 11, active: true,  siteId: "SITE-ACME-YMK" },
  // Delta Mining
  { id: "grp-dm",       tenantId: "delta-mining", name: "Groupe HSE Delta Mining", type: "Groupe",    users: 4,  active: true  },
  { id: "SITE-DM-KOR",  tenantId: "delta-mining", name: "Site Korhogo",            type: "Site",      users: 22, active: true,  siteId: "SITE-DM-KOR"  },
  // Medlog CI
  { id: "grp-mdl",      tenantId: "medlog-ci",    name: "Groupe HSE Medlog",       type: "Groupe",    users: 3,  active: true  },
  { id: "SITE-MDL-ABJ", tenantId: "medlog-ci",    name: "Site Abidjan Port",       type: "Site",      users: 30, active: true,  siteId: "SITE-MDL-ABJ" },
  { id: "SITE-MDL-BSM", tenantId: "medlog-ci",    name: "Site Grand-Bassam",       type: "Site",      users: 12, active: true,  siteId: "SITE-MDL-BSM" },
];

export function getEntitiesByTenant(tenantId: string): Entity[] {
  return entities.filter((e) => e.tenantId === tenantId && e.active);
}

// ── Rôles avec périmètre hiérarchique ───────────────────────────────────────

export const roles: Role[] = [
  {
    id: "platform_admin",
    name: "Administrateur plateforme",
    scope: "Plateforme",
    description: "Parametrage complet : utilisateurs, roles, entites, droits — périmètre global.",
    active: true,
    permissions: ["tenant:manage-settings", "tenant:manage-users", "tenant:manage-roles", "module:view", "module:import", "module:validate", "module:export", "audit:view"],
  },
  {
    id: "hse_group",
    name: "Responsable HSE groupe",
    scope: "Entreprise",
    description: "Validation consolidation, reporting global — voit tous les sites et projets de l'entreprise.",
    active: true,
    permissions: ["module:view", "module:validate", "module:export", "audit:view"],
  },
  {
    id: "hse_site",
    name: "Responsable HSE site",
    scope: "Site",
    description: "Import, validation et pilotage — restreint aux sites et projets assignés.",
    active: true,
    permissions: ["module:view", "module:import", "module:validate", "module:export"],
  },
  {
    id: "contributor",
    name: "Utilisateur saisie / import",
    scope: "Projet",
    description: "Import Excel et correction des erreurs — restreint au(x) projet(s) assigné(s).",
    active: true,
    permissions: ["module:view", "module:import"],
  },
  {
    id: "viewer",
    name: "Lecteur / direction",
    scope: "Lecture",
    description: "Consultation tableaux de bord et exports — périmètre défini par l'administrateur.",
    active: true,
    permissions: ["module:view", "module:export"],
  },
];

// ── Utilisateurs demo avec scoping hiérarchique ──────────────────────────────

export const users: UserAccount[] = [
  {
    id: "u1", name: "A. Kouadio", email: "a.kouadio@acme.local",
    tenantId: "acme-btp", entity: "Groupe HSE ACME",
    role: "Responsable HSE groupe", status: "Actif",
    allowedSiteIds: null, allowedProjectIds: null,
  },
  {
    id: "u2", name: "K. Bamba", email: "k.bamba@acme.local",
    tenantId: "acme-btp", entity: "Site Abidjan",
    role: "Responsable HSE site", status: "Actif",
    allowedSiteIds: ["SITE-ACME-ABJ", "SITE-ACME-BKE"], allowedProjectIds: null,
  },
  {
    id: "u3", name: "M. Diallo", email: "m.diallo@acme.local",
    tenantId: "acme-btp", entity: "Site Bouake",
    role: "Utilisateur saisie / import", status: "Actif",
    allowedSiteIds: ["SITE-ACME-BKE"], allowedProjectIds: ["PRJ-BKE-001"],
  },
  {
    id: "u4", name: "P. Yao", email: "p.yao@acme.local",
    tenantId: "acme-btp", entity: "Site San Pedro",
    role: "Lecteur / direction", status: "Invite",
    allowedSiteIds: ["SITE-ACME-SPD"], allowedProjectIds: null,
  },
  {
    id: "u5", name: "S. Traore", email: "s.traore@delta.local",
    tenantId: "delta-mining", entity: "Site Korhogo",
    role: "Responsable HSE site", status: "Actif",
    allowedSiteIds: ["SITE-DM-KOR"], allowedProjectIds: null,
  },
  {
    id: "u6", name: "N. Kone", email: "n.kone@medlog.local",
    tenantId: "medlog-ci", entity: "Groupe HSE Medlog",
    role: "Lecteur / direction", status: "Actif",
    allowedSiteIds: null, allowedProjectIds: null,
  },
];

export function getUsersByTenant(tenantId: string): UserAccount[] {
  return users.filter((u) => u.tenantId === tenantId);
}

// ── Matrice des droits (affichage) ───────────────────────────────────────────

export const rightsMatrix = [
  {
    role: "Administrateur plateforme",
    perimetre: "Entreprise entière",
    modules: "Tous",
    actions: "Lire, importer, valider, exporter, administrer",
  },
  {
    role: "Responsable HSE groupe",
    perimetre: "Tous les sites de l'entreprise",
    modules: "Tous modules HSE",
    actions: "Lire, valider, exporter, consolider",
  },
  {
    role: "Responsable HSE site",
    perimetre: "Sites assignés + leurs projets",
    modules: "Modules des sites assignés",
    actions: "Lire, importer, valider, exporter",
  },
  {
    role: "Utilisateur saisie / import",
    perimetre: "Projet(s) assigné(s)",
    modules: "Modules du projet",
    actions: "Lire modele, importer, corriger",
  },
  {
    role: "Lecteur / direction",
    perimetre: "Périmètre défini par l'admin",
    modules: "Cockpit et modules autorisés",
    actions: "Lire, exporter si autorisé",
  },
];
