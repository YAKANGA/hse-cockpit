import type { ModuleRecord } from "@/lib/module-records-data";

function stringValue(value: unknown, fallback = "") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return stringValue(value, new Date().toISOString().slice(0, 10));
}

function toRecordStatus(value: unknown): ModuleRecord["status"] {
  const s = stringValue(value, "Valide");
  if (["Ouvert", "En cours", "Clos", "A corriger", "Valide"].includes(s)) return s as ModuleRecord["status"];
  return "Valide";
}

function toPriority(value: unknown): ModuleRecord["priority"] {
  const p = stringValue(value, "Normale");
  if (["Basse", "Normale", "Haute", "Critique"].includes(p)) return p as ModuleRecord["priority"];
  return "Normale";
}

export function rowToModuleRecord(moduleId: string, tenantId: string | null | undefined, row: Record<string, unknown>, index: number): ModuleRecord {
  const site = stringValue(row.site, "Non renseigne");
  const entity = stringValue(row.projet, stringValue(row.service, site));
  const projectId = stringValue(row.code_projet, "");
  const projectName = stringValue(row.nom_projet ?? row.chantier ?? row.projet, site);
  const base = {
    id: `db-${tenantId ?? "global"}-${moduleId}-${index}`,
    moduleId,
    date: normalizeDate(row.date ?? row.mois ?? row.date_achat),
    site,
    projectId,
    projectName,
    entity,
    owner: stringValue(row.responsable, "Non assigne"),
    status: toRecordStatus(row.statut),
    priority: toPriority(row.priorite ?? row.gravite),
    dueDate: normalizeDate(row.echeance ?? row.date_fin ?? row.date_expiration ?? row.date),
  };

  if (moduleId === "events") return { ...base, label: stringValue(row.description, "Evenement"), category: stringValue(row.type_evenement, "Evenement") };
  if (moduleId === "inspections") return { ...base, label: stringValue(row.theme, stringValue(row.ecart, "Controle")), category: stringValue(row.type_controle, "Controle"), status: stringValue(row.conformite) === "Conforme" ? "Clos" : "A corriger", priority: stringValue(row.conformite) === "Non conforme" ? "Haute" : "Normale" };
  if (moduleId === "permits") return { ...base, label: `${stringValue(row.type_permis, "Permis")} - ${stringValue(row.zone, site)}`, category: stringValue(row.type_permis, "Permis"), status: stringValue(row.validation_hse) === "Oui" ? "Valide" : "A corriger", priority: stringValue(row.validation_hse) === "Oui" ? "Normale" : "Critique" };
  if (moduleId === "actions") return { ...base, label: stringValue(row.action, "Action"), category: stringValue(row.origine, "Action HSE") };
  if (moduleId === "indicators") return { ...base, label: `Reporting ${stringValue(row.mois, "")}`.trim(), category: "Indicateurs mensuels", owner: "Responsable HSE", status: "Valide", priority: Number(row.accidents_avec_arret ?? 0) > 0 ? "Haute" : "Normale" };
  if (moduleId === "ppe") return { ...base, date: normalizeDate(row.date_achat), label: stringValue(row.designation, "EPI"), category: stringValue(row.categorie, "EPI"), owner: stringValue(row.fournisseur, "Magasin HSE"), status: Number(row.quantite_disponible ?? 0) <= 0 ? "A corriger" : "Valide", priority: Number(row.quantite_disponible ?? 0) <= 5 ? "Haute" : "Normale", dueDate: normalizeDate(row.date_expiration) };
  if (moduleId === "environment") {
    const score = Number(row.intensite ?? 1) * Number(row.portee ?? 1) * Number(row.duree ?? 1);
    return { ...base, label: stringValue(row.impact, "Impact environnemental"), category: stringValue(row.milieu_affecte, "Environnement"), priority: score >= 18 ? "Critique" : score >= 12 ? "Haute" : "Normale" };
  }
  return { ...base, label: "Ligne importee", category: "Donnee HSE" };
}
