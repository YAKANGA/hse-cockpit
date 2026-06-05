import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  HardHat,
  Leaf,
  Shirt,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

export type HseModule = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: typeof AlertTriangle;
  color: string;
  accent: string;
  records: number;
  validatedImports: number;
  pendingItems: number;
  compliance: number;
  lastImport: string;
};

export type ModuleOperationalKpi = {
  moduleId: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  alertLabel: string;
  alertValue: number;
  usefulAction: string;
};

export const modules: HseModule[] = [
  {
    id: "events",
    name: "Accidents, incidents et presqu'accidents",
    shortName: "Evenements",
    description: "Suivi des evenements, gravite, causes, sites touches et actions associees.",
    icon: AlertTriangle,
    color: "#c2410c",
    accent: "#fff2e8",
    records: 284,
    validatedImports: 18,
    pendingItems: 12,
    compliance: 88,
    lastImport: "02/06/2026",
  },
  {
    id: "inspections",
    name: "Inspections, audits et controles HSE",
    shortName: "Inspections",
    description: "Programmes d'audit, ecarts releves, conformite et preuves de cloture.",
    icon: ClipboardCheck,
    color: "#047857",
    accent: "#e9f8f1",
    records: 431,
    validatedImports: 24,
    pendingItems: 31,
    compliance: 74,
    lastImport: "31/05/2026",
  },
  {
    id: "permits",
    name: "Permis de travail dangereux",
    shortName: "Permis",
    description: "Travaux a chaud, hauteur, espaces confines et validations operationnelles.",
    icon: HardHat,
    color: "#b45309",
    accent: "#fff7dc",
    records: 612,
    validatedImports: 32,
    pendingItems: 7,
    compliance: 92,
    lastImport: "01/06/2026",
  },
  {
    id: "actions",
    name: "Plans d'actions correctives et preventives",
    shortName: "Actions",
    description: "Actions issues des incidents, audits, inspections et revues de direction.",
    icon: FileCheck2,
    color: "#2563eb",
    accent: "#ecf4ff",
    records: 196,
    validatedImports: 14,
    pendingItems: 44,
    compliance: 67,
    lastImport: "28/05/2026",
  },
  {
    id: "indicators",
    name: "Indicateurs HSE mensuels consolides",
    shortName: "Indicateurs",
    description: "TF, TG, heures travaillees, causeries, formations et donnees mensuelles.",
    icon: Gauge,
    color: "#7c3aed",
    accent: "#f4efff",
    records: 120,
    validatedImports: 10,
    pendingItems: 2,
    compliance: 96,
    lastImport: "30/05/2026",
  },
  {
    id: "ppe",
    name: "Suivi des EPI et equipements de securite",
    shortName: "EPI",
    description: "Inventaire, attribution, stock disponible, dates d'expiration et controles periodiques des EPI.",
    icon: Shirt,
    color: "#0e7490",
    accent: "#ecfeff",
    records: 168,
    validatedImports: 9,
    pendingItems: 18,
    compliance: 81,
    lastImport: "02/06/2026",
  },
  {
    id: "environment",
    name: "Gestion environnementale — impacts par chantier",
    shortName: "Environnement",
    description: "Identification, cotation et suivi des impacts environnementaux par chantier (ISO 14001:2015, IFC Standards).",
    icon: Leaf,
    color: "#15803d",
    accent: "#f0fdf4",
    records: 20,
    validatedImports: 3,
    pendingItems: 6,
    compliance: 78,
    lastImport: "05/06/2026",
  },
];

export const kpis = [
  { label: "Conformite globale", value: "83%", trend: "Moyenne ponderee modules", icon: ShieldCheck },
  { label: "Actions critiques", value: "44", trend: "A traiter avant echeance", icon: Activity },
  { label: "Imports a corriger", value: "2", trend: "Fichiers rejetes ou en controle", icon: AlertTriangle },
  { label: "Modules actifs", value: "6", trend: "Couverture HSE complete", icon: UsersRound },
];

export const moduleOperationalKpis: ModuleOperationalKpi[] = [
  {
    moduleId: "events",
    primaryLabel: "Evenements declares",
    primaryValue: "284",
    secondaryLabel: "Taux de gravite elevee",
    secondaryValue: "11%",
    alertLabel: "Enquete non cloturee",
    alertValue: 12,
    usefulAction: "Prioriser les evenements graves et les causes racines ouvertes.",
  },
  {
    moduleId: "inspections",
    primaryLabel: "Inspections realisees",
    primaryValue: "431",
    secondaryLabel: "Taux de conformite",
    secondaryValue: "74%",
    alertLabel: "Ecarts ouverts",
    alertValue: 31,
    usefulAction: "Cloturer les ecarts des sites sous 80% de conformite.",
  },
  {
    moduleId: "permits",
    primaryLabel: "Permis emis",
    primaryValue: "612",
    secondaryLabel: "Permis conformes",
    secondaryValue: "92%",
    alertLabel: "Validations manquantes",
    alertValue: 7,
    usefulAction: "Verifier les permis dangereux sans validation HSE complete.",
  },
  {
    moduleId: "actions",
    primaryLabel: "Actions suivies",
    primaryValue: "196",
    secondaryLabel: "Taux de cloture",
    secondaryValue: "67%",
    alertLabel: "Actions en retard",
    alertValue: 44,
    usefulAction: "Relancer les responsables des actions critiques en retard.",
  },
  {
    moduleId: "indicators",
    primaryLabel: "Mois consolides",
    primaryValue: "10",
    secondaryLabel: "Donnees completes",
    secondaryValue: "96%",
    alertLabel: "Donnees manquantes",
    alertValue: 2,
    usefulAction: "Completer les indicateurs manquants avant reporting direction.",
  },
  {
    moduleId: "ppe",
    primaryLabel: "EPI en stock",
    primaryValue: "460",
    secondaryLabel: "Disponibilite EPI",
    secondaryValue: "21%",
    alertLabel: "Alertes EPI",
    alertValue: 6,
    usefulAction: "Reapprovisionner les EPI critiques et remplacer les elements expires.",
  },
  {
    moduleId: "environment",
    primaryLabel: "Impacts identifies",
    primaryValue: "20",
    secondaryLabel: "Mesures validees",
    secondaryValue: "15%",
    alertLabel: "Impacts critiques (≥18)",
    alertValue: 5,
    usefulAction: "Mettre en oeuvre en priorite les mesures pour les impacts critiques et eleves.",
  },
];

export const globalSummary = {
  totalRecords: modules.reduce((sum, module) => sum + module.records, 0),
  totalImports: modules.reduce((sum, module) => sum + module.validatedImports, 0),
  totalOpenItems: modules.reduce((sum, module) => sum + module.pendingItems, 0),
  averageCompliance: Math.round(modules.reduce((sum, module) => sum + module.compliance, 0) / modules.length),
  modulesAtRisk: modules.filter((module) => module.compliance < 80 || module.pendingItems > 25).length,
};

export const monthlyTrend = [
  { month: "Jan", accidents: 13, inspections: 34, actions: 22, accN1: 16, inspN1: 29, actN1: 19 },
  { month: "Fev", accidents: 9,  inspections: 41, actions: 28, accN1: 12, inspN1: 35, actN1: 24 },
  { month: "Mar", accidents: 15, inspections: 38, actions: 31, accN1: 18, inspN1: 31, actN1: 28 },
  { month: "Avr", accidents: 8,  inspections: 46, actions: 24, accN1: 11, inspN1: 40, actN1: 22 },
  { month: "Mai", accidents: 11, inspections: 52, actions: 36, accN1: 14, inspN1: 44, actN1: 31 },
  { month: "Juin", accidents: 7, inspections: 29, actions: 18, accN1: 10, inspN1: 26, actN1: 15 },
];

export const siteBreakdown = [
  { site: "Abidjan", conformite: 91, evenements: 38 },
  { site: "Yamoussoukro", conformite: 84, evenements: 24 },
  { site: "Bouake", conformite: 76, evenements: 31 },
  { site: "San Pedro", conformite: 69, evenements: 19 },
];

export const imports = [
  { module: "Permis", fichier: "permis_travail_juin.xlsx", statut: "Valide", lignes: 86, auteur: "A. Kouadio" },
  { module: "EPI", fichier: "inventaire_epi_chantier.xlsx", statut: "Controle", lignes: 64, auteur: "K. Yao" },
  { module: "Actions", fichier: "plan_actions_sites.xlsx", statut: "A corriger", lignes: 42, auteur: "M. Diallo" },
  { module: "Inspections", fichier: "audits_q2.xlsx", statut: "Valide", lignes: 123, auteur: "S. Traore" },
  { module: "Evenements", fichier: "incidents_mai.xlsx", statut: "Controle", lignes: 17, auteur: "N. Kone" },
];
