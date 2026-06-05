export type HseAlert = {
  id: string;
  tenantId: string;
  tenantName: string;
  moduleId: string;
  moduleName: string;
  site: string;
  title: string;
  source: string;
  severity: "Critique" | "Haute" | "Moyenne";
  status: "Ouvert" | "En cours" | "A verifier";
  dueDate: string;
  owner: string;
  recommendation: string;
};

export const hseAlerts: HseAlert[] = [
  {
    id: "alt-001",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    moduleId: "ppe",
    moduleName: "EPI",
    site: "San Pedro",
    title: "Masques FFP3 en rupture prochaine",
    source: "Inventaire EPI",
    severity: "Critique",
    status: "Ouvert",
    dueDate: "05/06/2026",
    owner: "K. Yao",
    recommendation: "Declencher une commande urgente et verifier les dotations respiratoires.",
  },
  {
    id: "alt-002",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    moduleId: "events",
    moduleName: "Evenements",
    site: "Abidjan",
    title: "Enquete incident grave non cloturee",
    source: "Declaration incident",
    severity: "Critique",
    status: "En cours",
    dueDate: "06/06/2026",
    owner: "A. Kouadio",
    recommendation: "Finaliser l'analyse causes racines et valider le plan d'actions.",
  },
  {
    id: "alt-003",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    moduleId: "actions",
    moduleName: "Actions",
    site: "Bouake",
    title: "Actions critiques en retard de plus de 30 jours",
    source: "Plan actions HSE",
    severity: "Haute",
    status: "Ouvert",
    dueDate: "07/06/2026",
    owner: "M. Diallo",
    recommendation: "Escalader les actions critiques au responsable de site.",
  },
  {
    id: "alt-004",
    tenantId: "delta-mining",
    tenantName: "Delta Mining",
    moduleId: "inspections",
    moduleName: "Inspections",
    site: "Bouake",
    title: "Conformite audit sous le seuil de 70%",
    source: "Audit terrain",
    severity: "Haute",
    status: "A verifier",
    dueDate: "08/06/2026",
    owner: "S. Traore",
    recommendation: "Programmer une contre-visite et controler les preuves de cloture.",
  },
  {
    id: "alt-005",
    tenantId: "delta-mining",
    tenantName: "Delta Mining",
    moduleId: "ppe",
    moduleName: "EPI",
    site: "Yamoussoukro",
    title: "Detecteurs gaz a recalibrer",
    source: "Controle periodique EPI",
    severity: "Moyenne",
    status: "En cours",
    dueDate: "12/06/2026",
    owner: "N. Kone",
    recommendation: "Planifier le recalibrage et isoler les detecteurs non conformes.",
  },
  {
    id: "alt-006",
    tenantId: "medlog-ci",
    tenantName: "Medlog CI",
    moduleId: "permits",
    moduleName: "Permis",
    site: "Abidjan",
    title: "Permis espace confine sans validation HSE",
    source: "Permis dangereux",
    severity: "Critique",
    status: "Ouvert",
    dueDate: "04/06/2026",
    owner: "M. Diallo",
    recommendation: "Bloquer l'execution tant que la validation HSE n'est pas complete.",
  },
  {
    id: "alt-007",
    tenantId: "medlog-ci",
    tenantName: "Medlog CI",
    moduleId: "actions",
    moduleName: "Actions",
    site: "San Pedro",
    title: "Preuves de cloture manquantes",
    source: "Plan actions HSE",
    severity: "Haute",
    status: "A verifier",
    dueDate: "10/06/2026",
    owner: "A. Kouadio",
    recommendation: "Demander les preuves terrain avant passage en cloture.",
  },
];

export function getAlertsForTenant(tenantId?: string | null) {
  return tenantId ? hseAlerts.filter((alert) => alert.tenantId === tenantId) : hseAlerts;
}

export function getAlertSummary(alerts: HseAlert[]) {
  return {
    total: alerts.length,
    critical: alerts.filter((alert) => alert.severity === "Critique").length,
    high: alerts.filter((alert) => alert.severity === "Haute").length,
    open: alerts.filter((alert) => alert.status === "Ouvert").length,
  };
}
