import type { ImportHistoryItem } from "@/lib/operations-data";
import { importHistory } from "@/lib/operations-data";
import type { ModuleRecord } from "@/lib/module-records-data";

type IntegratedImportInput = {
  tenantId: string | null;
  tenantName: string;
  moduleId: string;
  moduleName: string;
  filename?: string;
  rows: Record<string, unknown>[];
  author: string;
};

const importedRecords: ModuleRecord[] = [];
let importHistoryStore: ImportHistoryItem[] = importHistory.map((item) => ({ ...item, errors: [...item.errors] }));

// Raw rows kept for indicator TF/TG computation
const rawIndicatorRows: Record<string, unknown>[] = [];

function nowForHistory() {
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

  return `${value("day")}/${value("month")}/${value("year")} ${value("hour")}:${value("minute")}`;
}

function stringValue(value: unknown, fallback = "") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return stringValue(value, new Date().toISOString().slice(0, 10));
}

function toRecordStatus(value: unknown): ModuleRecord["status"] {
  const status = stringValue(value, "Valide");

  if (status === "En retard") return "A corriger";
  if (["Ouvert", "En cours", "Clos", "A corriger", "Valide"].includes(status)) return status as ModuleRecord["status"];

  return "Valide";
}

function toPriority(value: unknown): ModuleRecord["priority"] {
  const priority = stringValue(value, "Normale");

  if (["Basse", "Normale", "Haute", "Critique"].includes(priority)) return priority as ModuleRecord["priority"];
  if (["Critique", "Elevee"].includes(stringValue(value))) return "Critique";

  return "Normale";
}

function rowToModuleRecord(moduleId: string, tenantId: string | null, row: Record<string, unknown>, index: number): ModuleRecord {
  const site = stringValue(row.site, "Non renseigne");
  const entity = stringValue(row.projet, stringValue(row.service, site));
  const projectId = stringValue(row.code_projet, "");
  const projectName = stringValue(row.nom_projet ?? row.projet, site);
  const base = {
    id: `imp-${tenantId ?? "global"}-${moduleId}-${Date.now()}-${index}`,
    moduleId,
    date: normalizeDate(row.date ?? row.mois ?? row.date_achat),
    tenantId: tenantId ?? "global",
    site,
    projectId,
    projectName,
    entity,
    owner: stringValue(row.responsable, "Non assigne"),
    status: toRecordStatus(row.statut),
    priority: toPriority(row.priorite ?? row.gravite),
    dueDate: normalizeDate(row.echeance ?? row.date_fin ?? row.date_expiration ?? row.date),
  };

  if (moduleId === "events") {
    return {
      ...base,
      label: stringValue(row.description, "Evenement importe"),
      category: stringValue(row.type_evenement, "Evenement"),
    };
  }

  if (moduleId === "inspections") {
    return {
      ...base,
      label: stringValue(row.theme, stringValue(row.ecart, "Controle importe")),
      category: stringValue(row.type_controle, "Controle"),
      status: stringValue(row.conformite) === "Conforme" ? "Clos" : "A corriger",
      priority: stringValue(row.conformite) === "Non conforme" ? "Haute" : "Normale",
    };
  }

  if (moduleId === "permits") {
    return {
      ...base,
      label: `${stringValue(row.type_permis, "Permis")} - ${stringValue(row.zone, site)}`,
      category: stringValue(row.type_permis, "Permis"),
      status: stringValue(row.validation_hse) === "Oui" ? "Valide" : "A corriger",
      priority: stringValue(row.validation_hse) === "Oui" ? "Normale" : "Critique",
    };
  }

  if (moduleId === "actions") {
    return {
      ...base,
      label: stringValue(row.action, "Action importee"),
      category: stringValue(row.origine, "Action HSE"),
    };
  }

  if (moduleId === "indicators") {
    return {
      ...base,
      label: `Reporting mensuel ${stringValue(row.mois, "")}`.trim(),
      category: "Indicateurs mensuels",
      owner: "Responsable HSE",
      status: "Valide",
      priority: Number(row.accidents_avec_arret ?? 0) > 0 ? "Haute" : "Normale",
    };
  }

  if (moduleId === "ppe") {
    return {
      ...base,
      date: normalizeDate(row.date_achat),
      label: stringValue(row.designation, "EPI importe"),
      category: stringValue(row.categorie, "EPI"),
      owner: stringValue(row.fournisseur, "Magasin HSE"),
      status: Number(row.quantite_disponible ?? 0) <= 0 ? "A corriger" : "Valide",
      priority: Number(row.quantite_disponible ?? 0) <= 5 ? "Haute" : "Normale",
      dueDate: normalizeDate(row.date_expiration),
    };
  }

  if (moduleId === "training") {
    return {
      ...base,
      date:     normalizeDate(row.date_formation),
      dueDate:  normalizeDate(row.date_expiration ?? row.date_formation),
      label:    stringValue(row.titre, "Habilitation importee"),
      category: stringValue(row.type, "Formation"),
      owner:    stringValue(row.nom, "") + " " + stringValue(row.prenom, ""),
      status:   stringValue(row.statut) === "Valide" ? "Valide" : stringValue(row.statut) === "Expire" ? "A corriger" : "En cours",
      priority: stringValue(row.statut) === "Expire" ? "Critique" : stringValue(row.statut) === "A renouveler" ? "Haute" : "Normale",
    };
  }

  if (moduleId === "causeries") {
    const taux = Number(row.nb_participants ?? 0) / Math.max(Number(row.nb_prevus ?? 1), 1);
    return {
      ...base,
      label:    stringValue(row.theme, "Causerie importee"),
      category: stringValue(row.type, "Causerie"),
      owner:    stringValue(row.animateur, "Animateur HSE"),
      status:   taux >= 0.9 ? "Valide" : taux >= 0.75 ? "En cours" : "A corriger",
      priority: taux < 0.75 ? "Haute" : "Normale",
    };
  }

  if (moduleId === "duerp") {
    const criticite = Number(row.frequence ?? 1) * Number(row.gravite ?? 1) * Number(row.probabilite ?? 1);
    return {
      ...base,
      label:    stringValue(row.risque, "Risque importe"),
      category: stringValue(row.unite_travail, "Unite de travail"),
      status:   stringValue(row.statut) === "Maitrise" ? "Clos" : stringValue(row.statut) === "En cours de traitement" ? "En cours" : "Ouvert",
      priority: criticite >= 50 ? "Critique" : criticite >= 25 ? "Haute" : criticite >= 10 ? "Normale" : "Basse",
    };
  }

  if (moduleId === "medical") {
    const today = new Date().toISOString().slice(0, 10);
    const expired = stringValue(row.date_prochaine) < today;
    return {
      ...base,
      date:     normalizeDate(row.date_visite),
      dueDate:  normalizeDate(row.date_prochaine),
      label:    `${stringValue(row.nom, "")} ${stringValue(row.prenom, "")} — ${stringValue(row.type_visite, "Visite")}`,
      category: stringValue(row.type_visite, "Visite medicale"),
      owner:    stringValue(row.medecin, "Medecin du travail"),
      status:   expired ? "A corriger" : stringValue(row.aptitude) === "Apte" ? "Valide" : "En cours",
      priority: expired ? "Critique" : stringValue(row.aptitude).startsWith("Inapte") ? "Haute" : "Normale",
    };
  }

  if (moduleId === "acr") {
    return {
      ...base,
      date:     normalizeDate(row.date_analyse ?? row.date_evenement),
      label:    `ACR — ${stringValue(row.evenement_ref, "Evenement")} : ${stringValue(row.description ?? row.type_evenement, "")}`,
      category: stringValue(row.type_evenement, "Analyse"),
      owner:    stringValue(row.responsable, "Responsable HSE"),
      status:   stringValue(row.statut) === "Cloture" ? "Clos" : stringValue(row.statut) === "Actions lancees" ? "En cours" : "Ouvert",
      priority: "Haute",
    };
  }

  if (moduleId === "consumption") {
    const depasse = Number(row.eau_m3 ?? 0) > Number(row.objectif_eau ?? 9999);
    return {
      ...base,
      date:     `${stringValue(row.mois, new Date().toISOString().slice(0, 7))}-01`,
      label:    `Consommations ${stringValue(row.mois, "")} — ${stringValue(row.site, "")}`,
      category: "Consommations environnementales",
      owner:    "Responsable HSE site",
      status:   depasse ? "A corriger" : "Valide",
      priority: depasse ? "Haute" : "Normale",
    };
  }

  if (moduleId === "environment") {
    const intensite = Number(row.intensite ?? 1);
    const portee = Number(row.portee ?? 1);
    const duree = Number(row.duree ?? 1);
    const importance = intensite * portee * duree;
    const isCritique = importance >= 18;
    const isEleve = importance >= 12;
    return {
      ...base,
      label: stringValue(row.impact, "Impact environnemental importe"),
      category: stringValue(row.milieu_affecte, "Environnement"),
      owner: stringValue(row.responsable, "Responsable HSE"),
      status: stringValue(row.statut) === "Valide" ? "Valide" : stringValue(row.statut) === "En cours" ? "En cours" : "Ouvert",
      priority: isCritique ? "Critique" : isEleve ? "Haute" : "Normale",
      dueDate: normalizeDate(row.echeance),
    };
  }

  return {
    ...base,
    label: "Ligne importee",
    category: "Donnee HSE",
  };
}

export function recordValidatedImport(input: IntegratedImportInput) {
  const records = input.rows.map((row, index) => rowToModuleRecord(input.moduleId, input.tenantId, row, index));
  importedRecords.unshift(...records);

  if (input.moduleId === "indicators") {
    rawIndicatorRows.unshift(...input.rows);
  }

  const importId = `imp-${Date.now()}`;
  const historyItem: ImportHistoryItem = {
    id: importId,
    date: nowForHistory(),
    tenant: input.tenantName,
    entity: records[0]?.entity ?? "Non renseigne",
    module: input.moduleName,
    filename: input.filename ?? "import.xlsx",
    rows: input.rows.length,
    acceptedRows: input.rows.length,
    rejectedRows: 0,
    status: "Valide",
    author: input.author,
    errors: [],
  };
  importHistoryStore = [historyItem, ...importHistoryStore].slice(0, 250);

  return { historyItem, records };
}

export function getIntegratedModuleRecords(moduleId: string, tenantId?: string | null) {
  return importedRecords.filter((record) => {
    const matchesModule = record.moduleId === moduleId;
    const matchesTenant = tenantId ? record.id.startsWith(`imp-${tenantId}-`) : true;

    return matchesModule && matchesTenant;
  });
}

export function getImportHistory() {
  return importHistoryStore.map((item) => ({ ...item, errors: [...item.errors] }));
}

export type IndicatorMonthlyRow = {
  mois: string;
  heures: number;
  accidents: number;
  jours: number;
  causeries: number;
  formations: number;
};

export function getImportedIndicatorMonthlyData(): IndicatorMonthlyRow[] {
  if (rawIndicatorRows.length === 0) return [];

  const byMonth = new Map<string, IndicatorMonthlyRow>();

  for (const row of rawIndicatorRows) {
    const mois = String(row.mois ?? row.periode ?? "").trim() || "Inconnu";
    const existing = byMonth.get(mois) ?? { mois, heures: 0, accidents: 0, jours: 0, causeries: 0, formations: 0 };

    existing.heures    += Number(row.heures_travaillees ?? row.heures ?? 0) || 0;
    existing.accidents += Number(row.accidents_avec_arret ?? row.accidents ?? 0) || 0;
    existing.jours     += Number(row.jours_perdus ?? row.jours ?? 0) || 0;
    existing.causeries += Number(row.causeries ?? 0) || 0;
    existing.formations += Number(row.formations ?? 0) || 0;

    byMonth.set(mois, existing);
  }

  return Array.from(byMonth.values());
}
