export type TenantPreference = {
  primaryColor: string;
  secondaryColor: string;
  logoText: string;
  dashboardDensity: "Compact" | "Standard" | "Detaille";
  language: "fr" | "en";
};

export type Tenant = {
  id: string;
  name: string;
  sector: string;
  country: string;
  status: "Actif" | "Suspendu" | "Configuration";
  admin: string;
  modules: string[];
  users: number;
  preferences: TenantPreference;
};

export const tenants: Tenant[] = [
  {
    id: "acme-btp",
    name: "ACME BTP",
    sector: "Construction",
    country: "Cote d'Ivoire",
    status: "Actif",
    admin: "A. Kouadio",
    modules: ["events", "inspections", "permits", "actions", "indicators", "ppe"],
    users: 86,
    preferences: {
      primaryColor: "#0f766e",
      secondaryColor: "#101828",
      logoText: "ACME",
      dashboardDensity: "Standard",
      language: "fr",
    },
  },
  {
    id: "delta-mining",
    name: "Delta Mining",
    sector: "Mines",
    country: "Cote d'Ivoire",
    status: "Configuration",
    admin: "S. Traore",
    modules: ["events", "inspections", "actions", "indicators", "ppe"],
    users: 34,
    preferences: {
      primaryColor: "#b45309",
      secondaryColor: "#1f2937",
      logoText: "DM",
      dashboardDensity: "Detaille",
      language: "fr",
    },
  },
  {
    id: "medlog-ci",
    name: "Medlog CI",
    sector: "Logistique",
    country: "Cote d'Ivoire",
    status: "Actif",
    admin: "M. Diallo",
    modules: ["events", "permits", "actions", "indicators"],
    users: 52,
    preferences: {
      primaryColor: "#2563eb",
      secondaryColor: "#172033",
      logoText: "ML",
      dashboardDensity: "Compact",
      language: "fr",
    },
  },
];

export const superAdminCapabilities = [
  "Creer, suspendre ou reactiver une entreprise",
  "Definir le nom, logo, couleurs et preferences d'affichage",
  "Activer ou retirer les modules disponibles par entreprise",
  "Nommer l'administrateur principal de chaque entreprise",
  "Auditer les droits sans acceder aux donnees metier confidentielles",
  "Garantir le cloisonnement complet des donnees par entreprise",
];

export const tenantIsolationRules = [
  "Chaque enregistrement metier porte un identifiant d'entreprise obligatoire",
  "Les utilisateurs ne voient que les donnees de leur entreprise",
  "Les roles sont definis et appliques dans le perimetre d'une entreprise",
  "Les preferences visuelles d'une entreprise n'impactent aucune autre entreprise",
  "Les modules non actives sont invisibles dans le menu de l'entreprise",
  "Les exports et rapports sont generes uniquement sur le perimetre autorise",
];

export function getTenantModules(tenantId: string) {
  return tenants.find((tenant) => tenant.id === tenantId)?.modules ?? [];
}
