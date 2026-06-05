export type ServiceHealth = {
  id: string;
  service: string;
  target: string;
  status: "OK" | "Surveillance" | "Incident";
  latencyMs: number;
  errorRate: string;
  lastCheck: string;
};

export type SloMetric = {
  id: string;
  label: string;
  target: string;
  current: string;
  status: "OK" | "Surveillance" | "Risque";
};

export type PlatformIncident = {
  id: string;
  date: string;
  severity: "Info" | "Controle" | "Critique";
  scope: string;
  summary: string;
  owner: string;
  status: "Ouvert" | "En cours" | "Clos";
};

export type VercelReadinessItem = {
  id: string;
  area: string;
  requirement: string;
  status: "Pret" | "A configurer" | "A surveiller";
  evidence: string;
};

export const serviceHealth: ServiceHealth[] = [
  {
    id: "svc-api",
    service: "APIs metier",
    target: "Fonctions Next.js",
    status: "OK",
    latencyMs: 184,
    errorRate: "0.4%",
    lastCheck: "03/06/2026 09:10",
  },
  {
    id: "svc-import",
    service: "Validation imports Excel",
    target: "Parser .xlsx serveur",
    status: "Surveillance",
    latencyMs: 920,
    errorRate: "2.1%",
    lastCheck: "03/06/2026 09:10",
  },
  {
    id: "svc-reports",
    service: "Generation rapports",
    target: "PDF, Word, Excel",
    status: "OK",
    latencyMs: 640,
    errorRate: "0.8%",
    lastCheck: "03/06/2026 09:10",
  },
  {
    id: "svc-security",
    service: "Controle droits",
    target: "Roles, permissions, tenant",
    status: "OK",
    latencyMs: 72,
    errorRate: "0%",
    lastCheck: "03/06/2026 09:10",
  },
];

export const sloMetrics: SloMetric[] = [
  {
    id: "slo-home",
    label: "Ouverture cockpit",
    target: "< 3 s",
    current: "1.6 s",
    status: "OK",
  },
  {
    id: "slo-module",
    label: "Dashboard module",
    target: "< 2 s",
    current: "1.2 s",
    status: "OK",
  },
  {
    id: "slo-import",
    label: "Validation import standard",
    target: "< 30 s",
    current: "9.8 s",
    status: "OK",
  },
  {
    id: "slo-error",
    label: "Taux erreur API",
    target: "< 1%",
    current: "0.7%",
    status: "Surveillance",
  },
];

export const platformIncidents: PlatformIncident[] = [
  {
    id: "ops-001",
    date: "03/06/2026 08:45",
    severity: "Controle",
    scope: "Imports Excel",
    summary: "Hausse des fichiers rejetes sur le module Actions apres modele incomplet.",
    owner: "Admin entreprise",
    status: "En cours",
  },
  {
    id: "ops-002",
    date: "02/06/2026 17:55",
    severity: "Info",
    scope: "Rapports",
    summary: "Generation Word/PDF par module activee et verifiee.",
    owner: "Plateforme",
    status: "Clos",
  },
  {
    id: "ops-003",
    date: "02/06/2026 17:20",
    severity: "Controle",
    scope: "Securite",
    summary: "Controle d'acces croise tenant ajoute aux routes entreprise.",
    owner: "Super Admin",
    status: "Clos",
  },
];

export const vercelReadiness: VercelReadinessItem[] = [
  {
    id: "vr-db",
    area: "Base de donnees",
    requirement: "Postgres externe avec pooling de connexions",
    status: "A configurer",
    evidence: "Modele de donnees pret, persistance reelle a brancher.",
  },
  {
    id: "vr-cache",
    area: "Cache",
    requirement: "Cache faible latence pour agrégats dashboards",
    status: "A configurer",
    evidence: "Aggregats actuellement calcules depuis donnees applicatives.",
  },
  {
    id: "vr-storage",
    area: "Stockage fichiers",
    requirement: "Stockage objet pour imports et rapports generes",
    status: "A configurer",
    evidence: "Imports traites cote serveur, stockage durable a connecter.",
  },
  {
    id: "vr-security",
    area: "Securite",
    requirement: "Secrets via variables d'environnement et droits par tenant",
    status: "A surveiller",
    evidence: "Controle role/permission/tenant en place sur routes sensibles.",
  },
  {
    id: "vr-logs",
    area: "Observabilite",
    requirement: "Journalisation activite, erreurs, imports et exports",
    status: "Pret",
    evidence: "Journal audit, historique imports et supervision operationnelle disponibles.",
  },
];

export function getOperationsSummary() {
  return {
    servicesOk: serviceHealth.filter((service) => service.status === "OK").length,
    servicesWatched: serviceHealth.filter((service) => service.status !== "OK").length,
    averageLatency: Math.round(serviceHealth.reduce((sum, service) => sum + service.latencyMs, 0) / serviceHealth.length),
    openIncidents: platformIncidents.filter((incident) => incident.status !== "Clos").length,
    readinessConfigured: vercelReadiness.filter((item) => item.status === "Pret").length,
  };
}
