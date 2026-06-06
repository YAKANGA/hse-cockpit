export type ProjectStatus = "En cours" | "Termine" | "Planifie";
export type ProjectType = "Infrastructure" | "Construction" | "Industrie" | "Logistique" | "Minier";

export type Project = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  type: ProjectType;
  status: ProjectStatus;
  client: string;
  startDate: string;
  endDate?: string;
  workforce: number;
  description: string;
  color: string;
};

export const projects: Project[] = [
  /* ── Abidjan ── */
  {
    id: "PRJ-ABJ-001",
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

  /* ── Bouaké ── */
  {
    id: "PRJ-BKE-001",
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

  /* ── San Pedro ── */
  {
    id: "PRJ-SPD-001",
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

  /* ── Yamoussoukro ── */
  {
    id: "PRJ-YMK-001",
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
];

export function getProjectsByCity(city: string) {
  return projects.filter((p) => p.city === city);
}

export function getProject(id: string) {
  return projects.find((p) => p.id === id);
}

export function getProjectsMap(): Record<string, Project> {
  return Object.fromEntries(projects.map((p) => [p.id, p]));
}

/** Toutes les villes avec leurs projets */
export const CITIES_WITH_PROJECTS: Record<string, Project[]> = {
  Abidjan:      projects.filter((p) => p.city === "Abidjan"),
  Bouake:       projects.filter((p) => p.city === "Bouake"),
  "San Pedro":  projects.filter((p) => p.city === "San Pedro"),
  Yamoussoukro: projects.filter((p) => p.city === "Yamoussoukro"),
};
