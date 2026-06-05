export type ModuleGovernance = {
  moduleId: string;
  objective: string;
  ownerRole: string;
  workflow: string[];
  validationRules: string[];
  dataQualityChecks: string[];
  permissions: string[];
  reports: string[];
  operationalRisks: string[];
};

export const moduleGovernance: ModuleGovernance[] = [
  {
    moduleId: "events",
    objective: "Piloter les accidents, incidents, presqu'accidents et causes racines jusqu'a cloture documentee.",
    ownerRole: "Responsable HSE site / Responsable HSE groupe",
    workflow: [
      "Declaration de l'evenement",
      "Qualification du type, de la gravite et du site",
      "Analyse des causes racines",
      "Affectation des actions correctives",
      "Validation de cloture avec preuve",
    ],
    validationRules: [
      "Date, site, type evenement, gravite, responsable et description obligatoires",
      "Gravite limitee aux valeurs autorisees",
      "Un evenement critique ne peut pas etre clos sans cause racine",
      "La date de cloture ne doit pas etre anterieure a la date de declaration",
    ],
    dataQualityChecks: [
      "Doublons par site, date et description courte",
      "Evenements graves sans action associee",
      "Evenements ouverts depuis plus de 30 jours",
    ],
    permissions: [
      "Saisie terrain: declaration et modification avant validation",
      "Responsable HSE: validation et cloture",
      "Direction: lecture et rapports consolides",
    ],
    reports: ["Registre des evenements", "Analyse de gravite", "Rapport causes racines", "Plan d'actions associe"],
    operationalRisks: [
      "Sous-declaration des presqu'accidents",
      "Actions correctives non reliees aux causes racines",
      "Cloture administrative sans preuve terrain",
    ],
  },
  {
    moduleId: "inspections",
    objective: "Suivre les inspections, audits, controles HSE, ecarts et preuves de levee.",
    ownerRole: "Auditeur HSE / Responsable conformite",
    workflow: [
      "Planification du controle",
      "Execution terrain",
      "Enregistrement des ecarts",
      "Affectation et suivi des corrections",
      "Validation des preuves de levee",
    ],
    validationRules: [
      "Type controle, theme, site, date et conformite obligatoires",
      "Un ecart non conforme doit avoir une action ou une justification",
      "Le statut conforme ne doit pas contenir d'ecart critique ouvert",
    ],
    dataQualityChecks: [
      "Audits sans preuve",
      "Ecarts recurrents par site",
      "Controles planifies non realises",
    ],
    permissions: [
      "Auditeur: saisie des resultats",
      "Responsable site: reponse aux ecarts",
      "HSE groupe: validation et consolidation",
    ],
    reports: ["Rapport inspection", "Matrice des ecarts", "Conformite par site", "Suivi des preuves"],
    operationalRisks: [
      "Ecarts repetes non escalades",
      "Preuves insuffisantes",
      "Taux de conformite calcule sur donnees incompletes",
    ],
  },
  {
    moduleId: "permits",
    objective: "Controler les permis de travail dangereux et les validations HSE avant execution.",
    ownerRole: "Superviseur travaux / Responsable HSE site",
    workflow: [
      "Demande de permis",
      "Controle des risques et mesures preventives",
      "Validation HSE",
      "Execution du travail",
      "Cloture du permis",
    ],
    validationRules: [
      "Type permis, zone, dates, responsable et validation HSE obligatoires",
      "Date fin superieure ou egale a date debut",
      "Travaux critiques interdits sans validation HSE",
    ],
    dataQualityChecks: [
      "Permis sans validation",
      "Permis expires encore ouverts",
      "Zones avec recurrence de permis critiques",
    ],
    permissions: [
      "Demandeur: creation du permis",
      "Superviseur: validation operationnelle",
      "HSE: validation securite",
    ],
    reports: ["Registre des permis", "Permis critiques", "Permis par zone", "Historique des validations"],
    operationalRisks: [
      "Travail dangereux sans permis valide",
      "Chevauchement de permis incompatibles",
      "Cloture sans verification de fin de travaux",
    ],
  },
  {
    moduleId: "actions",
    objective: "Piloter les actions correctives et preventives avec responsabilites, echeances et preuves.",
    ownerRole: "Responsable action / Responsable HSE",
    workflow: [
      "Creation depuis incident, audit ou inspection",
      "Affectation responsable",
      "Suivi echeance",
      "Depot preuve",
      "Validation de cloture",
    ],
    validationRules: [
      "Origine, action, responsable, priorite, echeance et statut obligatoires",
      "Une action critique doit avoir une echeance",
      "Une action close doit avoir une preuve ou commentaire de cloture",
    ],
    dataQualityChecks: [
      "Actions en retard",
      "Actions sans responsable",
      "Actions critiques sans preuve",
    ],
    permissions: [
      "Responsable action: mise a jour avancement",
      "HSE site: suivi et relance",
      "HSE groupe: arbitrage et reporting",
    ],
    reports: ["Plan d'actions", "Actions en retard", "Actions critiques", "Taux de cloture"],
    operationalRisks: [
      "Plans d'actions crees mais non suivis",
      "Delais depasses sans escalation",
      "Cloture sans verification d'efficacite",
    ],
  },
  {
    moduleId: "indicators",
    objective: "Consolider les indicateurs HSE mensuels et fiabiliser le reporting direction.",
    ownerRole: "Responsable reporting HSE",
    workflow: [
      "Collecte mensuelle par site",
      "Controle de coherence",
      "Validation site",
      "Consolidation groupe",
      "Edition rapport mensuel",
    ],
    validationRules: [
      "Mois, site, heures travaillees et indicateurs accidentologie obligatoires",
      "Les valeurs numeriques doivent etre positives ou nulles",
      "Les taux derives doivent etre recalcules depuis les donnees sources",
    ],
    dataQualityChecks: [
      "Mois manquants par site",
      "Heures travaillees incoherentes",
      "Indicateurs accidentologie sans evenement source",
    ],
    permissions: [
      "Site: saisie mensuelle",
      "HSE groupe: validation consolidation",
      "Direction: consultation reporting",
    ],
    reports: ["Rapport mensuel HSE", "Tendances TF/TG", "Comparatif sites", "Synthese direction"],
    operationalRisks: [
      "Reporting base sur donnees non validees",
      "Incoherence entre evenements et indicateurs",
      "Retard de remontee mensuelle",
    ],
  },
  {
    moduleId: "ppe",
    objective: "Maitriser l'inventaire EPI, les dotations, expirations, controles periodiques et besoins de reapprovisionnement.",
    ownerRole: "Gestionnaire EPI / Responsable HSE chantier",
    workflow: [
      "Inventaire initial",
      "Attribution aux equipes",
      "Controle periodique",
      "Alerte expiration ou stock critique",
      "Reapprovisionnement ou remplacement",
    ],
    validationRules: [
      "Reference, designation, categorie, norme, risque, quantites, dates, controle et fournisseur obligatoires",
      "Quantite disponible = quantite stock - quantite attribuee",
      "Une reference EPI doit etre unique",
      "Les EPI expires doivent etre signales avant validation",
    ],
    dataQualityChecks: [
      "References en doublon",
      "Stocks negatifs ou incoherents",
      "EPI expires encore attribues",
      "EPI critiques avec stock disponible insuffisant",
    ],
    permissions: [
      "Gestionnaire EPI: inventaire et attribution",
      "HSE chantier: validation des controles",
      "Direction: consultation stock et couts",
    ],
    reports: ["Inventaire EPI", "EPI expires", "Stock critique", "Valorisation du stock", "Dotations par chantier"],
    operationalRisks: [
      "EPI indisponibles lors des travaux critiques",
      "EPI expires ou non conformes encore utilises",
      "Couts de stock non maitrises",
    ],
  },
];

export function getModuleGovernance(moduleId: string) {
  return moduleGovernance.find((item) => item.moduleId === moduleId);
}
