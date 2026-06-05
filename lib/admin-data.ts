import type { Permission } from "@/lib/permissions";

export type Entity = {
  id: string;
  name: string;
  type: "Groupe" | "Site" | "Projet" | "Direction";
  users: number;
  active: boolean;
};

export type Role = {
  id: string;
  name: string;
  scope: string;
  description: string;
  active: boolean;
  permissions: Permission[];
};

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  entity: string;
  role: string;
  status: "Actif" | "Suspendu" | "Invite";
};

export const entities: Entity[] = [
  { id: "grp", name: "Groupe HSE", type: "Groupe", users: 8, active: true },
  { id: "abj", name: "Site Abidjan", type: "Site", users: 42, active: true },
  { id: "bke", name: "Site Bouake", type: "Site", users: 24, active: true },
  { id: "spd", name: "Projet San Pedro", type: "Projet", users: 18, active: true },
  { id: "ops", name: "Direction Operations", type: "Direction", users: 11, active: true },
];

export const roles: Role[] = [
  {
    id: "platform_admin",
    name: "Administrateur plateforme",
    scope: "Global",
    description: "Parametrage complet, utilisateurs, roles, entites et droits.",
    active: true,
    permissions: ["tenant:manage-settings", "tenant:manage-users", "tenant:manage-roles", "module:view", "module:import", "module:validate", "module:export", "audit:view"],
  },
  {
    id: "hse_group",
    name: "Responsable HSE groupe",
    scope: "Global HSE",
    description: "Validation consolidation, reporting global et supervision modules.",
    active: true,
    permissions: ["module:view", "module:validate", "module:export", "audit:view"],
  },
  {
    id: "hse_site",
    name: "Responsable HSE site",
    scope: "Entite",
    description: "Import, validation et pilotage des donnees de son perimetre.",
    active: true,
    permissions: ["module:view", "module:import", "module:validate", "module:export"],
  },
  {
    id: "contributor",
    name: "Utilisateur saisie / import",
    scope: "Module",
    description: "Telechargement modele, import Excel et correction des erreurs.",
    active: true,
    permissions: ["module:view", "module:import"],
  },
  {
    id: "viewer",
    name: "Lecteur / direction",
    scope: "Lecture",
    description: "Consultation tableaux de bord et exports autorises.",
    active: true,
    permissions: ["module:view", "module:export"],
  },
];

export const users: UserAccount[] = [
  { id: "u1", name: "A. Kouadio", email: "a.kouadio@hse.local", entity: "Site Abidjan", role: "Responsable HSE site", status: "Actif" },
  { id: "u2", name: "M. Diallo", email: "m.diallo@hse.local", entity: "Direction Operations", role: "Utilisateur saisie / import", status: "Actif" },
  { id: "u3", name: "S. Traore", email: "s.traore@hse.local", entity: "Groupe HSE", role: "Responsable HSE groupe", status: "Actif" },
  { id: "u4", name: "N. Kone", email: "n.kone@hse.local", entity: "Projet San Pedro", role: "Lecteur / direction", status: "Invite" },
];

export const rightsMatrix = [
  { role: "Administrateur plateforme", modules: "Tous", actions: "Lire, importer, valider, exporter, administrer" },
  { role: "Responsable HSE groupe", modules: "Tous modules HSE", actions: "Lire, valider, exporter, consolider" },
  { role: "Responsable HSE site", modules: "Modules de son entite", actions: "Lire, importer, valider, exporter" },
  { role: "Utilisateur saisie / import", modules: "Modules autorises", actions: "Lire modele, importer, corriger" },
  { role: "Lecteur / direction", modules: "Cockpit et modules autorises", actions: "Lire, exporter si autorise" },
];
