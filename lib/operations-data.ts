export type ImportHistoryItem = {
  id: string;
  date: string;
  tenant: string;
  entity: string;
  module: string;
  filename: string;
  rows: number;
  acceptedRows: number;
  rejectedRows: number;
  status: "Valide" | "A corriger" | "Controle";
  author: string;
  errors: string[];
};

export type ValidationRule = {
  id: string;
  module: string;
  rule: string;
  field: string;
  severity: "Bloquante" | "Alerte" | "Information";
  status: "Active" | "Brouillon";
};

export type Referential = {
  id: string;
  name: string;
  owner: string;
  module: string;
  values: string[];
  lastUpdate: string;
};

export type ReportCatalogItem = {
  id: string;
  title: string;
  scope: string;
  format: "Word" | "PDF" | "Excel";
  frequency: string;
  href: string;
  audience: string;
};

export const importHistory: ImportHistoryItem[] = [
  {
    id: "imp-001",
    date: "02/06/2026 17:40",
    tenant: "ACME BTP",
    entity: "Projet San Pedro",
    module: "EPI",
    filename: "inventaire_epi_chantier.xlsx",
    rows: 64,
    acceptedRows: 61,
    rejectedRows: 3,
    status: "Controle",
    author: "K. Yao",
    errors: ["1 reference dupliquee", "2 dates expiration incoherentes"],
  },
  {
    id: "imp-002",
    date: "02/06/2026 16:55",
    tenant: "Medlog CI",
    entity: "Site Abidjan",
    module: "Actions",
    filename: "plan_actions_sites.xlsx",
    rows: 42,
    acceptedRows: 35,
    rejectedRows: 7,
    status: "A corriger",
    author: "M. Diallo",
    errors: ["Responsable obligatoire manquant", "Echeance invalide"],
  },
  {
    id: "imp-003",
    date: "01/06/2026 11:15",
    tenant: "ACME BTP",
    entity: "Direction Operations",
    module: "Permis",
    filename: "permis_travail_juin.xlsx",
    rows: 86,
    acceptedRows: 86,
    rejectedRows: 0,
    status: "Valide",
    author: "A. Kouadio",
    errors: [],
  },
  {
    id: "imp-004",
    date: "31/05/2026 09:30",
    tenant: "Delta Mining",
    entity: "Site Bouake",
    module: "Inspections",
    filename: "audits_q2.xlsx",
    rows: 123,
    acceptedRows: 119,
    rejectedRows: 4,
    status: "Controle",
    author: "S. Traore",
    errors: ["4 preuves de cloture absentes"],
  },
  {
    id: "imp-005",
    date: "30/05/2026 14:20",
    tenant: "ACME BTP",
    entity: "Groupe HSE",
    module: "Indicateurs",
    filename: "indicateurs_mensuels.xlsx",
    rows: 12,
    acceptedRows: 12,
    rejectedRows: 0,
    status: "Valide",
    author: "N. Kone",
    errors: [],
  },
];

export const validationRules: ValidationRule[] = [
  {
    id: "vr-001",
    module: "Tous modules",
    rule: "La feuille Saisie doit exister et conserver les intitules du modele.",
    field: "Structure",
    severity: "Bloquante",
    status: "Active",
  },
  {
    id: "vr-002",
    module: "EPI",
    rule: "Quantite disponible = quantite stock - quantite attribuee.",
    field: "Quantite Disponible",
    severity: "Bloquante",
    status: "Active",
  },
  {
    id: "vr-003",
    module: "EPI",
    rule: "La reference EPI doit etre unique dans le fichier importe.",
    field: "Reference",
    severity: "Bloquante",
    status: "Active",
  },
  {
    id: "vr-004",
    module: "Permis",
    rule: "La date de fin ne peut pas etre anterieure a la date de debut.",
    field: "Date fin",
    severity: "Bloquante",
    status: "Active",
  },
  {
    id: "vr-005",
    module: "Actions",
    rule: "Une action critique en retard doit conserver un responsable nomme.",
    field: "Responsable",
    severity: "Alerte",
    status: "Active",
  },
  {
    id: "vr-006",
    module: "Indicateurs",
    rule: "Les heures travaillees doivent etre strictement positives.",
    field: "Heures travaillees",
    severity: "Bloquante",
    status: "Active",
  },
];

export const referentials: Referential[] = [
  {
    id: "ref-sites",
    name: "Sites et projets",
    owner: "Administration entreprise",
    module: "Tous modules",
    values: ["Abidjan", "Yamoussoukro", "Bouake", "San Pedro"],
    lastUpdate: "02/06/2026",
  },
  {
    id: "ref-gravity",
    name: "Niveaux de gravite",
    owner: "Responsable HSE groupe",
    module: "Evenements",
    values: ["Faible", "Moyenne", "Elevee", "Critique"],
    lastUpdate: "28/05/2026",
  },
  {
    id: "ref-permits",
    name: "Types de permis dangereux",
    owner: "Responsable HSE site",
    module: "Permis",
    values: ["Travail a chaud", "Hauteur", "Espace confine", "Levage", "Electrique"],
    lastUpdate: "29/05/2026",
  },
  {
    id: "ref-ppe",
    name: "Categories EPI",
    owner: "Magasin HSE",
    module: "EPI",
    values: ["Protection mains", "Voies respiratoires", "Detection gaz", "Espace confine", "Protection auditive"],
    lastUpdate: "02/06/2026",
  },
];

export const reportCatalog: ReportCatalogItem[] = [
  {
    id: "rep-global-docx",
    title: "Rapport global HSE",
    scope: "Cockpit general",
    format: "Word",
    frequency: "A la demande",
    href: "/api/reports/global/docx",
    audience: "Direction generale",
  },
  {
    id: "rep-global-pdf",
    title: "Rapport global HSE",
    scope: "Cockpit general",
    format: "PDF",
    frequency: "A la demande",
    href: "/api/reports/global/pdf",
    audience: "Comite HSE",
  },
  {
    id: "rep-ppe-docx",
    title: "Rapport EPI",
    scope: "Module EPI",
    format: "Word",
    frequency: "Hebdomadaire",
    href: "/api/reports/modules/ppe/docx",
    audience: "Responsable magasin HSE",
  },
  {
    id: "rep-actions-pdf",
    title: "Rapport actions critiques",
    scope: "Module Actions",
    format: "PDF",
    frequency: "Hebdomadaire",
    href: "/api/reports/modules/actions/pdf",
    audience: "Responsables de sites",
  },
];
