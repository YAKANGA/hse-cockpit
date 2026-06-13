import { EVENTS, MOIS_ORDER, recordsToEvents, type EventRow } from "./events-data";
import type { ModuleRecord } from "./module-records-data";

// ─── Events: dérivé depuis EventRow[] (records ou données seed) ──────────────
function buildEventsData(rows: EventRow[] = EVENTS): ModuleDashboardData {
  const total      = rows.length;
  const accidents  = rows.filter((e) => e.type === "Accident").length;
  const incidents  = rows.filter((e) => e.type === "Incident").length;
  const presqAcc   = rows.filter((e) => e.type === "Presqu'accident").length;
  const graves     = rows.filter((e) => e.gravite === "Critique" || e.gravite === "Elevee").length;
  const tauxCloture = total > 0 ? Math.round((presqAcc / total) * 100) : 0;

  const sitesSet = Array.from(new Set(rows.map((e) => e.site)));
  const siteComparison = sitesSet.map((site) => {
    const siteEvts   = rows.filter((e) => e.site === site);
    const siteAcc    = siteEvts.filter((e) => e.type === "Accident").length;
    const siteGraves = siteEvts.filter((e) => e.gravite === "Critique" || e.gravite === "Elevee").length;
    const conformite = siteEvts.length > 0
      ? Math.max(0, Math.round(100 - (siteAcc / siteEvts.length) * 100))
      : 100;
    return { site, conformite, alertes: siteGraves };
  });

  const trend = MOIS_ORDER.map((mois) => ({
    period: mois,
    value:     rows.filter((e) => e.mois === mois).length,
    secondary: rows.filter((e) => e.mois === mois && (e.gravite === "Critique" || e.gravite === "Elevee")).length,
  }));

  const tf = accidents > 0 ? (accidents / Math.max(total, 1) * 10).toFixed(1) : "0.0";
  const tg = graves > 0    ? (graves / Math.max(accidents, 1)).toFixed(2)      : "0.00";

  return {
    moduleId: "events",
    headline: [
      { label: "Evenements declares", value: String(total),     detail: "Accidents, incidents et presqu'accidents" },
      { label: "Evenements graves",   value: String(graves),    detail: `${Math.round(graves / Math.max(total, 1) * 100)}% du volume declare` },
      { label: "Enquetes ouvertes",   value: String(accidents), detail: "ACR a cloturer en priorite" },
      { label: "Taux de cloture",     value: `${tauxCloture}%`, detail: "Presqu'accidents / total declares" },
    ],
    trend,
    distribution: [
      { name: "Accident",        value: accidents },
      { name: "Incident",        value: incidents },
      { name: "Presqu'accident", value: presqAcc  },
    ],
    siteComparison,
    table: [
      { indicateur: "Taux de frequence (TF)", valeur: tf,        tendance: "-0.3",  statut: "Sous controle" },
      { indicateur: "Taux de gravite (TG)",   valeur: tg,        tendance: "+0.02", statut: "Surveillance"  },
      { indicateur: "Causes racines (ACR)",   valeur: accidents, tendance: "-1",    statut: accidents > 2 ? "Prioritaire" : "OK" },
    ],
  };
}

export type ModuleDashboardData = {
  moduleId: string;
  headline: {
    label: string;
    value: string;
    detail: string;
  }[];
  trend: {
    period: string;
    value: number;
    secondary: number;
  }[];
  distribution: {
    name: string;
    value: number;
  }[];
  siteComparison: {
    site: string;
    conformite: number;
    alertes: number;
  }[];
  table: {
    indicateur: string;
    valeur: string | number;
    tendance: string | number;
    statut: string;
  }[];
};

export const moduleDashboardData: Record<string, ModuleDashboardData> = {
  events: buildEventsData(),
  inspections: {
    moduleId: "inspections",
    headline: [
      { label: "Controles realises", value: "431", detail: "Inspections, audits et controles" },
      { label: "Conformite moyenne", value: "74%", detail: "Sites sous seuil a surveiller" },
      { label: "Ecarts ouverts", value: "31", detail: "Dont 9 critiques" },
      { label: "Preuves validees", value: "68%", detail: "Progression attendue" },
    ],
    trend: [
      { period: "Jan", value: 61, secondary: 81 },
      { period: "Fev", value: 74, secondary: 78 },
      { period: "Mar", value: 69, secondary: 75 },
      { period: "Avr", value: 82, secondary: 77 },
      { period: "Mai", value: 96, secondary: 74 },
      { period: "Juin", value: 49, secondary: 72 },
    ],
    distribution: [
      { name: "Conforme", value: 219 },
      { name: "Partiel", value: 116 },
      { name: "Non conforme", value: 96 },
    ],
    siteComparison: [
      { site: "Abidjan", conformite: 84, alertes: 6 },
      { site: "Bouake", conformite: 66, alertes: 18 },
      { site: "San Pedro", conformite: 71, alertes: 11 },
      { site: "Yamoussoukro", conformite: 79, alertes: 7 },
    ],
    table: [
      { indicateur: "Audits planifies", valeur: 38, tendance: "+4", statut: "OK" },
      { indicateur: "Ecarts critiques", valeur: 9, tendance: "-2", statut: "Prioritaire" },
      { indicateur: "Preuves manquantes", valeur: 17, tendance: "+5", statut: "A corriger" },
    ],
  },
  permits: {
    moduleId: "permits",
    headline: [
      { label: "Permis emis", value: "612", detail: "Travaux dangereux" },
      { label: "Conformite permis", value: "92%", detail: "Validations completes" },
      { label: "Permis critiques", value: "54", detail: "Hauteur, chaud, espace confine" },
      { label: "Validations manquantes", value: "7", detail: "Blocage avant execution" },
    ],
    trend: [
      { period: "Jan", value: 88, secondary: 5 },
      { period: "Fev", value: 92, secondary: 6 },
      { period: "Mar", value: 109, secondary: 8 },
      { period: "Avr", value: 117, secondary: 7 },
      { period: "Mai", value: 124, secondary: 4 },
      { period: "Juin", value: 84, secondary: 3 },
    ],
    distribution: [
      { name: "Travail a chaud", value: 176 },
      { name: "Hauteur", value: 151 },
      { name: "Espace confine", value: 74 },
      { name: "Levage", value: 109 },
      { name: "Electrique", value: 102 },
    ],
    siteComparison: [
      { site: "Abidjan", conformite: 95, alertes: 2 },
      { site: "Bouake", conformite: 86, alertes: 4 },
      { site: "San Pedro", conformite: 91, alertes: 3 },
      { site: "Yamoussoukro", conformite: 93, alertes: 1 },
    ],
    table: [
      { indicateur: "Permis expires ouverts", valeur: 3, tendance: "-1", statut: "A fermer" },
      { indicateur: "Travaux critiques", valeur: 54, tendance: "+6", statut: "Surveillance" },
      { indicateur: "Validations HSE", valeur: "92%", tendance: "+2 pts", statut: "OK" },
    ],
  },
  actions: {
    moduleId: "actions",
    headline: [
      { label: "Actions suivies", value: "196", detail: "Correctives et preventives" },
      { label: "Taux de cloture", value: "67%", detail: "Objectif minimum 85%" },
      { label: "Actions en retard", value: "44", detail: "Point critique de pilotage" },
      { label: "Actions critiques", value: "18", detail: "Escalade management" },
    ],
    trend: [
      { period: "Jan", value: 32, secondary: 19 },
      { period: "Fev", value: 41, secondary: 22 },
      { period: "Mar", value: 38, secondary: 26 },
      { period: "Avr", value: 52, secondary: 31 },
      { period: "Mai", value: 47, secondary: 29 },
      { period: "Juin", value: 29, secondary: 18 },
    ],
    distribution: [
      { name: "Ouvert", value: 44 },
      { name: "En cours", value: 61 },
      { name: "Clos", value: 91 },
    ],
    siteComparison: [
      { site: "Abidjan", conformite: 73, alertes: 12 },
      { site: "Bouake", conformite: 58, alertes: 18 },
      { site: "San Pedro", conformite: 68, alertes: 9 },
      { site: "Yamoussoukro", conformite: 77, alertes: 5 },
    ],
    table: [
      { indicateur: "Actions critiques", valeur: 18, tendance: "+3", statut: "Escalade" },
      { indicateur: "Retards > 30 jours", valeur: 21, tendance: "+4", statut: "Prioritaire" },
      { indicateur: "Preuves attendues", valeur: 27, tendance: "-8", statut: "A verifier" },
    ],
  },
  indicators: {
    moduleId: "indicators",
    headline: [
      { label: "Mois consolides", value: "10", detail: "Reporting multi-sites" },
      { label: "Completude donnees", value: "96%", detail: "2 donnees manquantes" },
      { label: "Heures travaillees", value: "1.8M", detail: "Base des taux HSE" },
      { label: "TF consolide", value: "2.4", detail: "Tendance en baisse" },
    ],
    trend: [
      { period: "Jan", value: 2.9, secondary: 0.21 },
      { period: "Fev", value: 2.7, secondary: 0.2 },
      { period: "Mar", value: 2.8, secondary: 0.23 },
      { period: "Avr", value: 2.5, secondary: 0.19 },
      { period: "Mai", value: 2.4, secondary: 0.18 },
      { period: "Juin", value: 2.2, secondary: 0.16 },
    ],
    distribution: [
      { name: "Complets", value: 58 },
      { name: "Partiels", value: 2 },
      { name: "Non recus", value: 0 },
    ],
    siteComparison: [
      { site: "Abidjan", conformite: 98, alertes: 0 },
      { site: "Bouake", conformite: 92, alertes: 1 },
      { site: "San Pedro", conformite: 95, alertes: 1 },
      { site: "Yamoussoukro", conformite: 100, alertes: 0 },
    ],
    table: [
      { indicateur: "TF", valeur: 2.4, tendance: "-0.3", statut: "Amelioration" },
      { indicateur: "TG", valeur: 0.18, tendance: "-0.01", statut: "OK" },
      { indicateur: "Donnees manquantes", valeur: 2, tendance: "-4", statut: "A completer" },
    ],
  },
  ppe: {
    moduleId: "ppe",
    headline: [
      { label: "Stock total", value: "460", detail: "EPI et equipements suivis" },
      { label: "Disponibilite", value: "21%", detail: "Stock disponible / stock total" },
      { label: "Stock critique", value: "2", detail: "Categories a reapprovisionner" },
      { label: "EPI expires", value: "4", detail: "Remplacement prioritaire" },
    ],
    trend: [
      { period: "Jan", value: 102, secondary: 18 },
      { period: "Fev", value: 118, secondary: 22 },
      { period: "Mar", value: 91, secondary: 14 },
      { period: "Avr", value: 137, secondary: 27 },
      { period: "Mai", value: 156, secondary: 33 },
      { period: "Juin", value: 96, secondary: 19 },
    ],
    distribution: [
      { name: "Disponible", value: 96 },
      { name: "Attribue", value: 364 },
      { name: "Expire", value: 4 },
      { name: "Critique", value: 2 },
    ],
    siteComparison: [
      { site: "Abidjan", conformite: 81, alertes: 6 },
      { site: "Bouake", conformite: 69, alertes: 11 },
      { site: "San Pedro", conformite: 76, alertes: 8 },
      { site: "Yamoussoukro", conformite: 88, alertes: 3 },
    ],
    table: [
      { indicateur: "Valeur stock", valeur: "15 939 000 FCFA", tendance: "+6%", statut: "Suivi cout" },
      { indicateur: "Stock critique", valeur: 2, tendance: "+1", statut: "A commander" },
      { indicateur: "EPI expires", valeur: 4, tendance: "Stable", statut: "A remplacer" },
    ],
  },
};

export function getModuleDashboardData(moduleId: string, records?: ModuleRecord[]) {
  if (moduleId === "events" && records && records.length > 0) {
    const evtRecords = records.filter((r) => r.moduleId === "events");
    if (evtRecords.length > 0) return buildEventsData(recordsToEvents(evtRecords));
  }
  return moduleDashboardData[moduleId];
}
