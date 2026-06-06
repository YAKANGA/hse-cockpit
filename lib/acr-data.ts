export type MethodeACR = "5 Pourquoi" | "Arbre des causes" | "Ishikawa" | "ORION";
export type StatutACR = "En cours" | "Finalise" | "Actions lancees" | "Cloture";
export type TypeCause = "Immediate" | "Profonde" | "Organisationnelle" | "Systemique";

export type AnalyseCause = {
  id: string;
  evenement_ref: string;
  date_evenement: string;
  site: string;
  type_evenement: string;
  description_evenement: string;
  methode: MethodeACR;
  causes: { type: TypeCause; description: string }[];
  actions_correctives: { action: string; responsable: string; echeance: string; statut: string }[];
  responsable_analyse: string;
  date_analyse: string;
  retex_diffuse: boolean;
  statut: StatutACR;
  lecons_apprises: string;
};

export const ANALYSES_ACR: AnalyseCause[] = [
  {
    id: "acr-001",
    evenement_ref: "EVT-2026-034",
    date_evenement: "2026-05-28",
    site: "Abidjan",
    type_evenement: "Accident avec arret",
    description_evenement: "Chute d'un operateur depuis un echafaudage au niveau 3 (hauteur 4,2 m). Fracture du poignet droit.",
    methode: "Arbre des causes",
    causes: [
      { type: "Immediate",       description: "Absence de point d'ancrage utilisable au niveau 3" },
      { type: "Immediate",       description: "Operateur ne portait pas son harnais" },
      { type: "Profonde",        description: "Inspection echafaudage non realisee avant debut de travaux" },
      { type: "Organisationnelle", description: "Procedure de verification pre-tache non respectee par le chef d'equipe" },
      { type: "Systemique",      description: "Manque de supervision HSE sur ce secteur depuis 2 semaines" },
    ],
    actions_correctives: [
      { action: "Installer points d'ancrage certifies sur tous les niveaux echafaudage", responsable: "KOUAME Eric",   echeance: "2026-06-15", statut: "En cours" },
      { action: "Renforcer controle port EPI par chefs d'equipe - check quotidien",       responsable: "ASSI Rodrigue", echeance: "2026-06-10", statut: "Realise" },
      { action: "Former tous les chefs d'equipe sur inspection pre-tache echafaudage",   responsable: "TRAORE S.",     echeance: "2026-06-30", statut: "En cours" },
      { action: "Augmenter passages HSE quotidiens sur chantier Abidjan",                responsable: "ASSI Rodrigue", echeance: "2026-06-01", statut: "Realise" },
    ],
    responsable_analyse: "ASSI Rodrigue",
    date_analyse: "2026-06-01",
    retex_diffuse: true,
    statut: "Actions lancees",
    lecons_apprises: "La supervision HSE terrain est indispensable — les procedures seules ne suffisent pas. Instaurer passages HSE 2x/jour minimum.",
  },
  {
    id: "acr-002",
    evenement_ref: "EVT-2026-021",
    date_evenement: "2026-04-15",
    site: "Bouake",
    type_evenement: "Presqu'accident",
    description_evenement: "Engin de chantier (chargeuse) a failli ecraser un pieton qui traversait la zone de manoeuvre. Aucun blessé.",
    methode: "5 Pourquoi",
    causes: [
      { type: "Immediate",       description: "Pieton present dans la zone de manoeuvre des engins" },
      { type: "Profonde",        description: "Balisage zone engins insuffisant — un cone manquait" },
      { type: "Profonde",        description: "Conducteur engin n'a pas effectue le tour de l'engin avant manoeuvre" },
      { type: "Organisationnelle", description: "Plan de circulation non affiche dans la zone" },
      { type: "Systemique",      description: "Culture securite insuffisante sur cohabitation pieton/engin" },
    ],
    actions_correctives: [
      { action: "Reviser et afficher le plan de circulation dans toutes les zones engins", responsable: "BAMBA Seydou", echeance: "2026-04-22", statut: "Realise" },
      { action: "Causerie sur cohabitation pietons/engins pour tous les operateurs",       responsable: "BAMBA Seydou", echeance: "2026-04-25", statut: "Realise" },
      { action: "Installer barrieres physiques entre zones pietons et engins",              responsable: "SORO Gnangui", echeance: "2026-05-15", statut: "Realise" },
    ],
    responsable_analyse: "BAMBA Seydou",
    date_analyse: "2026-04-18",
    retex_diffuse: true,
    statut: "Cloture",
    lecons_apprises: "Les presqu'accidents doivent etre analyses avec autant de rigueur que les accidents. Ici l'incident a permis d'eviter un deces potentiel.",
  },
  {
    id: "acr-003",
    evenement_ref: "EVT-2026-008",
    date_evenement: "2026-03-02",
    site: "San Pedro",
    type_evenement: "Accident sans arret",
    description_evenement: "Brulure chimique main gauche lors de la manipulation de soude caustique sans gants adaptes.",
    methode: "Ishikawa",
    causes: [
      { type: "Immediate",       description: "Absence de gants chimiques adaptes — port de simples gants latex" },
      { type: "Profonde",        description: "Fiche de donnees securite (FDS) non consultee avant manipulation" },
      { type: "Profonde",        description: "Stock de gants chimiques epuise — non reapprovisionne" },
      { type: "Organisationnelle", description: "Procedure de gestion des EPI chimiques inexistante" },
    ],
    actions_correctives: [
      { action: "Reapprovisionner stock gants chimiques nitrile — stock minimum defini",   responsable: "KONAN Brice", echeance: "2026-03-10", statut: "Realise" },
      { action: "Afficher les FDS au poste de manipulation pour chaque produit",           responsable: "KONAN Brice", echeance: "2026-03-15", statut: "Realise" },
      { action: "Rediger procedure de gestion des EPI chimiques",                          responsable: "CISSE Adama", echeance: "2026-04-30", statut: "Realise" },
      { action: "Formation manipulation produits chimiques pour tout le personnel",         responsable: "KONAN Brice", echeance: "2026-05-30", statut: "En cours" },
    ],
    responsable_analyse: "KONAN Brice",
    date_analyse: "2026-03-05",
    retex_diffuse: false,
    statut: "Actions lancees",
    lecons_apprises: "La disponibilite des EPI adequats est aussi importante que leur port. Un systeme de gestion des stocks EPI est necessaire.",
  },
  {
    id: "acr-004",
    evenement_ref: "EVT-2026-042",
    date_evenement: "2026-06-01",
    site: "Yamoussoukro",
    type_evenement: "Malaise",
    description_evenement: "Operateur victime d'un malaise par coup de chaleur apres 4 heures de travail continu en plein soleil sans pause.",
    methode: "5 Pourquoi",
    causes: [
      { type: "Immediate",       description: "Travail prolonge sous forte chaleur (38°C) sans pause ni hydratation" },
      { type: "Profonde",        description: "Pause obligatoire de 15 min/heure non respectee par le chef d'equipe" },
      { type: "Profonde",        description: "Point d'eau/ombrage non accessible dans cette zone du chantier" },
      { type: "Organisationnelle", description: "Absence de protocole canicule formalise pour ce site" },
    ],
    actions_correctives: [
      { action: "Installer points d'eau et zones ombragees dans toutes les zones de travail",responsable:"TRAORE S.", echeance:"2026-06-10", statut:"En cours" },
      { action: "Formaliser protocole canicule: pauses 15min/heure si T > 35°C",            responsable:"CISSE Adama", echeance:"2026-06-08", statut:"Realise" },
      { action: "Briefing chefs d'equipe sur surveillance stress thermique",                  responsable:"TRAORE S.", echeance:"2026-06-12", statut:"En cours" },
    ],
    responsable_analyse: "TRAORE Salimata",
    date_analyse: "2026-06-03",
    retex_diffuse: false,
    statut: "En cours",
    lecons_apprises: "Le risque thermique doit etre gere activement — les consignes generales ne suffisent pas en saison chaude.",
  },
];

export function getAcrSummary() {
  const total        = ANALYSES_ACR.length;
  const finalises    = ANALYSES_ACR.filter((a) => a.statut === "Finalise" || a.statut === "Cloture" || a.statut === "Actions lancees").length;
  const enCours      = ANALYSES_ACR.filter((a) => a.statut === "En cours").length;
  const retexDiffuse = ANALYSES_ACR.filter((a) => a.retex_diffuse).length;
  const totalActions = ANALYSES_ACR.reduce((s, a) => s + a.actions_correctives.length, 0);
  const actionsOk    = ANALYSES_ACR.reduce((s, a) => s + a.actions_correctives.filter((ac) => ac.statut === "Realise").length, 0);
  const tauxActions  = Math.round((actionsOk / totalActions) * 100);
  return { total, finalises, enCours, retexDiffuse, totalActions, actionsOk, tauxActions };
}
