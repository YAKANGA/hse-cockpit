export type AuditEvent = {
  id: string;
  date: string;
  tenantId: string | null;
  tenant: string;
  actor: string;
  action: string;
  target: string;
  severity: "Info" | "Controle" | "Critique";
};

const auditSeedEvents: AuditEvent[] = [
  { id: "evt-001", date: "2026-06-05 08:12", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "A. Kouadio",    action: "Connexion utilisateur",      target: "Session ouverte",                  severity: "Info" },
  { id: "evt-002", date: "2026-06-05 08:15", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "A. Kouadio",    action: "Import Excel valide",         target: "Module EPI — 42 lignes",           severity: "Info" },
  { id: "evt-003", date: "2026-06-05 08:20", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "A. Kouadio",    action: "Export rapport PDF",          target: "Rapport global HSE",               severity: "Info" },
  { id: "evt-004", date: "2026-06-04 17:40", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "K. Yao",        action: "Modification referentiel",    target: "Liste sites — ajout San Pedro",    severity: "Controle" },
  { id: "evt-005", date: "2026-06-04 17:20", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "Super Admin",   action: "Activation module",           target: "Module Indicateurs",               severity: "Controle" },
  { id: "evt-006", date: "2026-06-04 16:55", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "K. Yao",        action: "Ajout utilisateur",           target: "N. Kone — role HSE_SITE",          severity: "Controle" },
  { id: "evt-007", date: "2026-06-04 16:30", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "K. Yao",        action: "Modification regle validation","target": "Module Actions — echeance obligatoire", severity: "Controle" },
  { id: "evt-008", date: "2026-06-03 14:10", tenantId: "delta-mining",  tenant: "Delta Mining", actor: "S. Traore",    action: "Modification role",           target: "Responsable HSE site",             severity: "Controle" },
  { id: "evt-009", date: "2026-06-03 13:45", tenantId: "delta-mining",  tenant: "Delta Mining", actor: "S. Traore",    action: "Import Excel valide",         target: "Module Inspections — 18 lignes",   severity: "Info" },
  { id: "evt-010", date: "2026-06-03 11:20", tenantId: "delta-mining",  tenant: "Delta Mining", actor: "N. Kone",      action: "Telechargement modele",       target: "Modele Excel — Permis",            severity: "Info" },
  { id: "evt-011", date: "2026-06-03 09:00", tenantId: "medlog-ci",     tenant: "Medlog CI",   actor: "M. Diallo",    action: "Import rejete",               target: "Module Actions — 5 erreurs",       severity: "Critique" },
  { id: "evt-012", date: "2026-06-02 18:30", tenantId: "medlog-ci",     tenant: "Medlog CI",   actor: "M. Diallo",    action: "Connexion utilisateur",       target: "Session ouverte",                  severity: "Info" },
  { id: "evt-013", date: "2026-06-02 17:55", tenantId: null,             tenant: "Plateforme",  actor: "Super Admin",  action: "Creation entreprise",         target: "Agro Export CI",                   severity: "Controle" },
  { id: "evt-014", date: "2026-06-02 17:35", tenantId: null,             tenant: "Plateforme",  actor: "Super Admin",  action: "Desactivation module",        target: "Rapports — Agro Export CI",        severity: "Controle" },
  { id: "evt-015", date: "2026-06-01 16:00", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "A. Kouadio",   action: "Suppression enregistrement",  target: "Alerte ALT-007 — cloturee",        severity: "Critique" },
  { id: "evt-016", date: "2026-06-01 14:20", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "K. Yao",       action: "Reinitialisation mot de passe","target": "Compte N. Kone",                severity: "Critique" },
  { id: "evt-017", date: "2026-05-31 10:05", tenantId: "delta-mining",  tenant: "Delta Mining", actor: "S. Traore",   action: "Export rapport Word",         target: "Rapport module Permis",            severity: "Info" },
  { id: "evt-018", date: "2026-05-30 09:15", tenantId: "acme-btp",     tenant: "ACME BTP",    actor: "N. Kone",      action: "Connexion echouee",           target: "Tentative x3 — compte bloque",     severity: "Critique" },
];

let auditEventsStore = [...auditSeedEvents];

function nowForAudit() {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Abidjan",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}`;
}

export function getAuditEvents(tenantId?: string | null) {
  const scoped = tenantId ? auditEventsStore.filter((event) => event.tenantId === tenantId) : auditEventsStore;

  return scoped.map((event) => ({ ...event }));
}

export function recordAuditEvent(event: Omit<AuditEvent, "id" | "date">) {
  const auditEvent: AuditEvent = {
    ...event,
    id: `evt-${Date.now()}`,
    date: nowForAudit(),
  };

  auditEventsStore = [auditEvent, ...auditEventsStore].slice(0, 250);

  return { ...auditEvent };
}

export const auditEvents = auditEventsStore;
