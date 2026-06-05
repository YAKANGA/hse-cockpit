export type TemplateColumn = {
  key: string;
  label: string;
  required: boolean;
  type: "texte" | "date" | "nombre" | "liste";
  values?: string[];
};

export type ModuleTemplate = {
  moduleId: string;
  filename: string;
  columns: TemplateColumn[];
};

const commonColumns: TemplateColumn[] = [
  { key: "site", label: "Site", required: true, type: "texte" },
  { key: "projet", label: "Projet", required: false, type: "texte" },
  { key: "service", label: "Service", required: false, type: "texte" },
  { key: "date", label: "Date", required: true, type: "date" },
  { key: "responsable", label: "Responsable", required: true, type: "texte" },
];

export const templates: Record<string, ModuleTemplate> = {
  events: {
    moduleId: "events",
    filename: "modele_evenements_hse.xlsx",
    columns: [
      ...commonColumns,
      { key: "type_evenement", label: "Type evenement", required: true, type: "liste", values: ["Accident", "Incident", "Presqu'accident"] },
      { key: "gravite", label: "Gravite", required: true, type: "liste", values: ["Faible", "Moyenne", "Elevee", "Critique"] },
      { key: "description", label: "Description", required: true, type: "texte" },
      { key: "cause_racine", label: "Cause racine", required: false, type: "texte" },
      { key: "statut", label: "Statut", required: true, type: "liste", values: ["Ouvert", "En cours", "Clos"] },
    ],
  },
  inspections: {
    moduleId: "inspections",
    filename: "modele_inspections_audits_hse.xlsx",
    columns: [
      ...commonColumns,
      { key: "type_controle", label: "Type controle", required: true, type: "liste", values: ["Inspection", "Audit", "Controle"] },
      { key: "theme", label: "Theme", required: true, type: "texte" },
      { key: "conformite", label: "Conformite", required: true, type: "liste", values: ["Conforme", "Non conforme", "Partiel"] },
      { key: "ecart", label: "Ecart observe", required: false, type: "texte" },
      { key: "preuve", label: "Preuve", required: false, type: "texte" },
    ],
  },
  permits: {
    moduleId: "permits",
    filename: "modele_permis_travail_dangereux.xlsx",
    columns: [
      ...commonColumns,
      { key: "type_permis", label: "Type permis", required: true, type: "liste", values: ["Travail a chaud", "Hauteur", "Espace confine", "Levage", "Electrique"] },
      { key: "zone", label: "Zone", required: true, type: "texte" },
      { key: "date_debut", label: "Date debut", required: true, type: "date" },
      { key: "date_fin", label: "Date fin", required: true, type: "date" },
      { key: "validation_hse", label: "Validation HSE", required: true, type: "liste", values: ["Oui", "Non"] },
    ],
  },
  actions: {
    moduleId: "actions",
    filename: "modele_plan_actions_hse.xlsx",
    columns: [
      ...commonColumns,
      { key: "origine", label: "Origine", required: true, type: "liste", values: ["Incident", "Audit", "Inspection", "Revue"] },
      { key: "action", label: "Action", required: true, type: "texte" },
      { key: "priorite", label: "Priorite", required: true, type: "liste", values: ["Basse", "Normale", "Haute", "Critique"] },
      { key: "echeance", label: "Echeance", required: true, type: "date" },
      { key: "statut", label: "Statut", required: true, type: "liste", values: ["Ouvert", "En cours", "Clos", "En retard"] },
    ],
  },
  indicators: {
    moduleId: "indicators",
    filename: "modele_indicateurs_hse_mensuels.xlsx",
    columns: [
      { key: "mois", label: "Mois", required: true, type: "texte" },
      { key: "site", label: "Site", required: true, type: "texte" },
      { key: "heures_travaillees", label: "Heures travaillees", required: true, type: "nombre" },
      { key: "accidents_avec_arret", label: "Accidents avec arret", required: true, type: "nombre" },
      { key: "jours_perdus", label: "Jours perdus", required: true, type: "nombre" },
      { key: "causeries", label: "Causeries HSE", required: true, type: "nombre" },
      { key: "formations", label: "Formations HSE", required: true, type: "nombre" },
    ],
  },
  ppe: {
    moduleId: "ppe",
    filename: "modele_suivi_epi_equipements_securite.xlsx",
    columns: [
      { key: "reference", label: "Reference", required: true, type: "texte" },
      { key: "designation", label: "Designation EPI / Equipement", required: true, type: "texte" },
      {
        key: "categorie",
        label: "Categorie",
        required: true,
        type: "liste",
        values: [
          "Protection mains",
          "Protection voies respiratoires",
          "Visibilite",
          "Detection gaz",
          "Premiers secours",
          "Protection genoux",
          "Protection auditive",
          "Espace confine",
          "Protection tete",
          "Protection pieds",
          "Protection yeux",
        ],
      },
      { key: "norme", label: "Norme CE / Certification", required: true, type: "texte" },
      {
        key: "risque_couvert",
        label: "Risque Couvert",
        required: true,
        type: "liste",
        values: [
          "Coupure / abrasion",
          "Poussieres / aerosols",
          "Heurt engins",
          "Gaz toxique / explosif",
          "Blessures legeres",
          "Incendie",
          "Contusion",
          "Bruit fort",
          "Sauvetage",
        ],
      },
      { key: "quantite_stock", label: "Quantite Stock", required: true, type: "nombre" },
      { key: "quantite_attribuee", label: "Quantite Attribuee", required: true, type: "nombre" },
      { key: "quantite_disponible", label: "Quantite Disponible", required: true, type: "nombre" },
      { key: "date_achat", label: "Date Achat", required: true, type: "date" },
      { key: "date_expiration", label: "Date Expiration", required: true, type: "date" },
      {
        key: "controle_periodique",
        label: "Controle Periodique",
        required: true,
        type: "liste",
        values: ["Selon usure", "Usage unique", "Mensuel", "Hebdomadaire", "Semestriel", "Trimestriel", "Annuel", "Avant chaque usage"],
      },
      { key: "fournisseur", label: "Fournisseur", required: true, type: "texte" },
      { key: "cout_unitaire", label: "Cout Unit. (FCFA)", required: true, type: "nombre" },
      { key: "observations", label: "Observations", required: false, type: "texte" },
    ],
  },

  environment: {
    moduleId: "environment",
    filename: "modele_impacts_environnementaux.xlsx",
    columns: [
      { key: "code_chantier", label: "Code Chantier", required: true, type: "texte" },
      { key: "chantier", label: "Chantier / Projet", required: true, type: "texte" },
      { key: "site", label: "Site", required: true, type: "texte" },
      { key: "type_travaux", label: "Type de travaux", required: true, type: "texte" },
      {
        key: "phase",
        label: "Phase",
        required: true,
        type: "liste",
        values: ["Preparation", "Construction", "Exploitation"],
      },
      { key: "impact", label: "Impact environnemental", required: true, type: "texte" },
      {
        key: "milieu_affecte",
        label: "Milieu affecte",
        required: true,
        type: "liste",
        values: ["Sol", "Eau de surface", "Eau souterraine", "Air", "Bruit", "Biodiversite", "Dechets", "Paysage", "Population"],
      },
      { key: "intensite", label: "Intensite (1-3)", required: true, type: "nombre" },
      { key: "portee", label: "Portee (1-3)", required: true, type: "nombre" },
      { key: "duree", label: "Duree (1-3)", required: true, type: "nombre" },
      { key: "mesures_attenuation", label: "Mesures d'attenuation", required: true, type: "texte" },
      { key: "responsable", label: "Responsable", required: true, type: "texte" },
      { key: "indicateur_suivi", label: "Indicateur de suivi", required: false, type: "texte" },
      {
        key: "statut",
        label: "Statut mesure",
        required: true,
        type: "liste",
        values: ["Planifie", "En cours", "Valide"],
      },
      { key: "echeance", label: "Echeance", required: true, type: "date" },
    ],
  },
};

export function getTemplate(moduleId: string) {
  return templates[moduleId];
}
