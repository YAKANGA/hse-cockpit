import { getSitesByTenant, type HSESite } from "@/lib/sites-catalog";

export type ProjectStatus = "En cours" | "Termine" | "Planifie";
export type ProjectType   = "Infrastructure" | "Construction" | "Industrie" | "Logistique" | "Minier";

export type Project = {
  id: string;
  tenantId: string;  // entreprise propriétaire
  siteId: string;    // site de rattachement (HSESite.id)
  name: string;
  shortName: string;
  city: string;      // = HSESite.name — conservé pour rétro-compat avec moduleRecords.site
  type: ProjectType;
  status: ProjectStatus;
  client: string;
  startDate: string;
  endDate?: string;
  workforce: number;
  description: string;
  color: string;
};

/** Alias sémantique — même type, nom explicite dans le contexte hiérarchique. */
export type HSEProjet = Project;

export const projects: Project[] = [
  // ── ACME BTP — Site Abidjan ──────────────────────────────────────────
  {
    id: "PRJ-ABJ-001",
    tenantId: "acme-btp",
    siteId: "SITE-ACME-ABJ",
    name: "Autoroute Abidjan-Bassam Phase 2",
    shortName: "ABJ-Autoroute",
    city: "Abidjan",
    type: "Infrastructure",
    status: "En cours",
    client: "AGEROUTE CI",
    startDate: "01/01/2025",
    workforce: 420,
    description: "Construction et bitumage de la section II de l'autoroute Abidjan–Grand-Bassam.",
    color: "#2563eb",
  },
  {
    id: "PRJ-ABJ-002",
    tenantId: "acme-btp",
    siteId: "SITE-ACME-ABJ",
    name: "Tour Plateau Finance Center",
    shortName: "ABJ-Tour",
    city: "Abidjan",
    type: "Construction",
    status: "En cours",
    client: "BCI Immobilier",
    startDate: "15/03/2025",
    workforce: 310,
    description: "Construction d'un immeuble de bureaux R+18 au Plateau.",
    color: "#0e7490",
  },

  // ── ACME BTP — Site Bouaké ───────────────────────────────────────────
  {
    id: "PRJ-BKE-001",
    tenantId: "acme-btp",
    siteId: "SITE-ACME-BKE",
    name: "Route Nationale RN3 Bouake-Katiola",
    shortName: "BKE-RN3",
    city: "Bouake",
    type: "Infrastructure",
    status: "En cours",
    client: "Ministere des Transports",
    startDate: "01/06/2024",
    workforce: 280,
    description: "Rehabilitation et elargissement de 68 km de la RN3.",
    color: "#c2410c",
  },
  {
    id: "PRJ-BKE-002",
    tenantId: "acme-btp",
    siteId: "SITE-ACME-BKE",
    name: "Carriere Granite Bouake Nord",
    shortName: "BKE-Carriere",
    city: "Bouake",
    type: "Minier",
    status: "En cours",
    client: "SMCI Granulats",
    startDate: "01/09/2024",
    workforce: 145,
    description: "Exploitation de carriere de granit pour fourniture de materiaux de construction.",
    color: "#b45309",
  },

  // ── ACME BTP — Site San Pedro ────────────────────────────────────────
  {
    id: "PRJ-SPD-001",
    tenantId: "acme-btp",
    siteId: "SITE-ACME-SPD",
    name: "Terminal Vraquiers Port San Pedro",
    shortName: "SPD-Terminal",
    city: "San Pedro",
    type: "Logistique",
    status: "En cours",
    client: "Port Autonome San Pedro",
    startDate: "01/04/2025",
    workforce: 520,
    description: "Construction du nouveau terminal polyvalent et vraquiers du port de San Pedro.",
    color: "#047857",
  },
  {
    id: "PRJ-SPD-002",
    tenantId: "acme-btp",
    siteId: "SITE-ACME-SPD",
    name: "Zone Industrielle San Pedro Extension",
    shortName: "SPD-ZI",
    city: "San Pedro",
    type: "Industrie",
    status: "Planifie",
    client: "SODEMI",
    startDate: "01/09/2026",
    workforce: 0,
    description: "Amenagement de la zone industrielle sur 120 ha en phase de preparation.",
    color: "#0891b2",
  },

  // ── ACME BTP — Site Yamoussoukro ─────────────────────────────────────
  {
    id: "PRJ-YMK-001",
    tenantId: "acme-btp",
    siteId: "SITE-ACME-YMK",
    name: "Rehabilitation Infrastructures Yamoussoukro",
    shortName: "YMK-Rehab",
    city: "Yamoussoukro",
    type: "Infrastructure",
    status: "En cours",
    client: "District Autonome YMK",
    startDate: "01/02/2025",
    workforce: 195,
    description: "Renovation de voiries, reseaux et equipements collectifs du district.",
    color: "#7c3aed",
  },

  // ── Delta Mining — Site Korhogo ──────────────────────────────────────
  {
    id: "PRJ-DM-001",
    tenantId: "delta-mining",
    siteId: "SITE-DM-KOR",
    name: "Mine de Fer Korhogo Nord",
    shortName: "DM-Fer",
    city: "Korhogo",
    type: "Minier",
    status: "En cours",
    client: "SODEMI",
    startDate: "01/03/2025",
    workforce: 340,
    description: "Exploitation du gisement de fer de Korhogo Nord, phase d'extraction pilote.",
    color: "#92400e",
  },
  {
    id: "PRJ-DM-002",
    tenantId: "delta-mining",
    siteId: "SITE-DM-KOR",
    name: "Centrale Electrique Mine Korhogo",
    shortName: "DM-Centrale",
    city: "Korhogo",
    type: "Industrie",
    status: "Planifie",
    client: "Delta Mining SA",
    startDate: "01/01/2027",
    workforce: 0,
    description: "Centrale solaire et groupe electrogene de secours pour le site minier.",
    color: "#78350f",
  },

  // ── Medlog CI — Site Abidjan Port ────────────────────────────────────
  {
    id: "PRJ-MDL-001",
    tenantId: "medlog-ci",
    siteId: "SITE-MDL-ABJ",
    name: "Hub Logistique Vridi Abidjan",
    shortName: "MDL-Hub",
    city: "Abidjan Port",
    type: "Logistique",
    status: "En cours",
    client: "PAA Abidjan",
    startDate: "01/07/2024",
    workforce: 210,
    description: "Plateforme logistique multimodale dans la zone Vridi du port d'Abidjan.",
    color: "#1d4ed8",
  },

  // ── Medlog CI — Site Grand-Bassam ────────────────────────────────────
  {
    id: "PRJ-MDL-002",
    tenantId: "medlog-ci",
    siteId: "SITE-MDL-BSM",
    name: "Entrepôt Frigorifique Grand-Bassam",
    shortName: "MDL-Frigori",
    city: "Grand-Bassam",
    type: "Logistique",
    status: "En cours",
    client: "CIDT Export",
    startDate: "15/09/2024",
    workforce: 85,
    description: "Entrepôt frigorifique 4 000 m² pour stockage produits agro-alimentaires à l'export.",
    color: "#1e40af",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getProjectsByTenant(tenantId: string): Project[] {
  return projects.filter((p) => p.tenantId === tenantId);
}

export function getProjectsBySite(siteId: string): Project[] {
  return projects.filter((p) => p.siteId === siteId);
}

export function getProjectsByCity(city: string): Project[] {
  return projects.filter((p) => p.city === city);
}

/** Projets disponibles pour un tenant, filtrés par siteIds (null = tous). */
export function getProjectsForSites(tenantId: string, siteIds: string[] | null): Project[] {
  const pool = getProjectsByTenant(tenantId);
  if (!siteIds || !siteIds.length) return pool;
  return pool.filter((p) => siteIds.includes(p.siteId));
}

/** Projets d'un tenant filtrés par liste de villes (legacy — prefer getProjectsForSites). */
export function getProjectsForCities(cities: string[]): Project[] {
  if (!cities.length) return projects;
  return projects.filter((p) => cities.includes(p.city));
}

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getProjectsMap(): Record<string, Project> {
  return Object.fromEntries(projects.map((p) => [p.id, p]));
}

/** Toutes les villes ACME (legacy — pour rétro-compat avec SITES / getSiteKpis). */
export const CITIES_WITH_PROJECTS: Record<string, Project[]> = {
  Abidjan:      projects.filter((p) => p.city === "Abidjan"),
  Bouake:       projects.filter((p) => p.city === "Bouake"),
  "San Pedro":  projects.filter((p) => p.city === "San Pedro"),
  Yamoussoukro: projects.filter((p) => p.city === "Yamoussoukro"),
};

/** Dérive le tenantId d'un record depuis son projectId. */
export function tenantIdForProjectId(projectId: string): string | undefined {
  return getProject(projectId)?.tenantId;
}

/** Sites structurés d'un tenant (dépendance circulaire évitée — délégué à sites-catalog). */
export function getTenantSites(tenantId: string): HSESite[] {
  return getSitesByTenant(tenantId);
}
