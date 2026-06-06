// ─── VBG — Violence Basée sur le Genre ───────────────────────────────────────
// Normes : World Bank ESS2/ESS4, IFC PS2, Good Practice Note on GBV (2018),
//          ILO C190, OMS Définitions, UN Women Standards

export const VBG_TYPES = [
  "Harcèlement sexuel",
  "Violence physique",
  "Violence psychologique / intimidation",
  "Exploitation et abus sexuels (EAS)",
  "Discrimination fondée sur le genre",
  "Traite des personnes",
  "Violence domestique",
  "Autre / Non classifié",
] as const;

export const VBG_GRAVITE = ["Mineur", "Modéré", "Grave", "Très grave"] as const;
export const VBG_STATUT  = ["Signalé", "En investigation", "Résolu", "Clôturé", "Non fondé", "Référé"] as const;
export const VBG_CANAL   = ["Boîte à plaintes", "Ligne directe", "Point focal VBG", "Application mobile", "Responsable HSE", "Direct"] as const;
export const VBG_AUTEUR  = ["Travailleur", "Superviseur / Cadre", "Sous-traitant", "Tiers / Communauté", "Non identifié"] as const;

export type VbgType      = (typeof VBG_TYPES)[number];
export type VbgGravite   = (typeof VBG_GRAVITE)[number];
export type VbgStatut    = (typeof VBG_STATUT)[number];

export type VbgIncident = {
  id:            string;
  reference:     string;      // Anonymisée ex: VBG-2026-001
  date:          string;
  site:          string;
  type:          VbgType;
  auteur:        string;
  gravite:       VbgGravite;
  statut:        VbgStatut;
  delaiResolution?: number;   // jours
  mesuresPrises: string;
  signalePar:    "Victime" | "Témoin" | "Superviseur" | "Anonyme";
};

export type VbgFormation = {
  id:           string;
  date:         string;
  site:         string;
  theme:        string;
  participants: number;
  formateur:    string;
  duree:        number;       // heures
  scoreSatisfaction?: number; // /5
};

export type VbgPlainte = {
  id:             string;
  reference:      string;     // Anonymisée
  dateDepot:      string;
  dateResolution?: string;
  canal:          string;
  typePlainte:    string;
  statut:         VbgStatut;
  delaiTraitement?: number;   // jours — cible WB: 30 jours max
  resolution:     string;
};

export type VbgCodeConduite = {
  site:          string;
  totalPersonnel: number;
  signataires:   number;
  dateMAJ:       string;
  valide:        boolean;
};

export type VbgPlanAction = {
  id:          string;
  mesure:      string;
  categorie:   "Prévention" | "Réponse" | "Atténuation" | "Suivi";
  responsable: string;
  echeance:    string;
  statut:      "Planifié" | "En cours" | "Réalisé" | "En retard";
  norme:       string;        // Référence normative
  priorite:    "Haute" | "Moyenne" | "Basse";
};

// ── Données seed ──────────────────────────────────────────────────────────────

export const vbgIncidents: VbgIncident[] = [
  { id: "vbg-001", reference: "VBG-2026-001", date: "05/03/2026", site: "Abidjan", type: "Harcèlement sexuel", auteur: "Superviseur / Cadre", gravite: "Grave", statut: "Clôturé", delaiResolution: 18, mesuresPrises: "Enquête interne, mise à pied du superviseur, suivi psychologique de la victime, révision du protocole RH.", signalePar: "Victime" },
  { id: "vbg-002", reference: "VBG-2026-002", date: "14/03/2026", site: "Bouake", type: "Violence psychologique / intimidation", auteur: "Superviseur / Cadre", gravite: "Modéré", statut: "Résolu", delaiResolution: 12, mesuresPrises: "Médiation, rappel au règlement intérieur, formation du management sur le respect au travail.", signalePar: "Témoin" },
  { id: "vbg-003", reference: "VBG-2026-003", date: "22/03/2026", site: "San Pedro", type: "Discrimination fondée sur le genre", auteur: "Travailleur", gravite: "Mineur", statut: "Résolu", delaiResolution: 7, mesuresPrises: "Sensibilisation de l'équipe, avertissement écrit.", signalePar: "Anonyme" },
  { id: "vbg-004", reference: "VBG-2026-004", date: "01/04/2026", site: "Bouake", type: "Harcèlement sexuel", auteur: "Sous-traitant", gravite: "Grave", statut: "En investigation", mesuresPrises: "Ouverture d'enquête formelle, suspicion provisoire, notification à l'organisme financeur.", signalePar: "Victime" },
  { id: "vbg-005", reference: "VBG-2026-005", date: "10/04/2026", site: "Yamoussoukro", type: "Violence psychologique / intimidation", auteur: "Non identifié", gravite: "Mineur", statut: "Clôturé", delaiResolution: 9, mesuresPrises: "Campagne de sensibilisation renforcée, augmentation des rondes de sécurité.", signalePar: "Anonyme" },
  { id: "vbg-006", reference: "VBG-2026-006", date: "18/04/2026", site: "Abidjan", type: "Discrimination fondée sur le genre", auteur: "Superviseur / Cadre", gravite: "Modéré", statut: "En investigation", mesuresPrises: "Entretien avec les parties, collecte de témoignages en cours.", signalePar: "Victime" },
  { id: "vbg-007", reference: "VBG-2026-007", date: "25/04/2026", site: "San Pedro", type: "Violence physique", auteur: "Travailleur", gravite: "Grave", statut: "Référé", mesuresPrises: "Alerte aux autorités, assistance à la victime, signalement à l'organisme de financement.", signalePar: "Témoin" },
];

export const vbgFormations: VbgFormation[] = [
  { id: "vbgf-001", date: "15/01/2026", site: "Abidjan",      theme: "Code de conduite VBG et EAS/HS",               participants: 145, formateur: "Point focal VBG certifié", duree: 4, scoreSatisfaction: 4.6 },
  { id: "vbgf-002", date: "20/01/2026", site: "Bouake",       theme: "Mécanisme de gestion des plaintes",             participants: 98,  formateur: "Consultant externe WB",     duree: 3, scoreSatisfaction: 4.2 },
  { id: "vbgf-003", date: "28/01/2026", site: "San Pedro",    theme: "Prévention du harcèlement sexuel",              participants: 76,  formateur: "Point focal VBG certifié", duree: 3, scoreSatisfaction: 4.5 },
  { id: "vbgf-004", date: "05/02/2026", site: "Yamoussoukro", theme: "Sensibilisation communautaire VBG",              participants: 62,  formateur: "ONG partenaire",           duree: 2, scoreSatisfaction: 4.3 },
  { id: "vbgf-005", date: "12/02/2026", site: "Abidjan",      theme: "Réponse aux incidents VBG — Management",        participants: 32,  formateur: "Consultant externe WB",     duree: 6, scoreSatisfaction: 4.7 },
  { id: "vbgf-006", date: "18/02/2026", site: "Bouake",       theme: "Code de conduite VBG et EAS/HS — Sous-traitants", participants: 88, formateur: "Point focal VBG certifié", duree: 4, scoreSatisfaction: 4.1 },
  { id: "vbgf-007", date: "25/02/2026", site: "San Pedro",    theme: "Droits et dignité au travail — ILO C190",       participants: 54,  formateur: "Consultant externe ILO",   duree: 3, scoreSatisfaction: 4.4 },
  { id: "vbgf-008", date: "04/03/2026", site: "Abidjan",      theme: "Recyclage annuel — Tous sites",                 participants: 210, formateur: "Point focal VBG certifié", duree: 4, scoreSatisfaction: 4.5 },
];

export const vbgPlaintes: VbgPlainte[] = [
  { id: "vbgp-001", reference: "PLT-VBG-001", dateDepot: "06/03/2026", dateResolution: "24/03/2026", canal: "Point focal VBG", typePlainte: "Harcèlement sexuel", statut: "Clôturé", delaiTraitement: 18, resolution: "Mesures disciplinaires appliquées, suivi psychosocial assuré." },
  { id: "vbgp-002", reference: "PLT-VBG-002", dateDepot: "14/03/2026", dateResolution: "26/03/2026", canal: "Boîte à plaintes",  typePlainte: "Intimidation",       statut: "Clôturé", delaiTraitement: 12, resolution: "Médiation réussie entre les parties." },
  { id: "vbgp-003", reference: "PLT-VBG-003", dateDepot: "22/03/2026", dateResolution: "29/03/2026", canal: "Ligne directe",     typePlainte: "Discrimination",     statut: "Clôturé", delaiTraitement: 7,  resolution: "Avertissement émis, sessions de sensibilisation organisées." },
  { id: "vbgp-004", reference: "PLT-VBG-004", dateDepot: "01/04/2026", canal: "Point focal VBG",                                 typePlainte: "Harcèlement sexuel", statut: "En investigation", resolution: "Enquête en cours — délai cible: 30 jours (WB ESS2)." },
  { id: "vbgp-005", reference: "PLT-VBG-005", dateDepot: "18/04/2026", canal: "Application mobile",                              typePlainte: "Discrimination",     statut: "En investigation", resolution: "Entretiens en cours." },
  { id: "vbgp-006", reference: "PLT-VBG-006", dateDepot: "25/04/2026", canal: "Responsable HSE",                                 typePlainte: "Violence physique",  statut: "Référé", resolution: "Renvoyé aux autorités judiciaires et à l'organisme de financement." },
];

export const vbgCodeConduite: VbgCodeConduite[] = [
  { site: "Abidjan",      totalPersonnel: 420, signataires: 412, dateMAJ: "01/01/2026", valide: true },
  { site: "Bouake",       totalPersonnel: 286, signataires: 271, dateMAJ: "01/01/2026", valide: true },
  { site: "San Pedro",    totalPersonnel: 195, signataires: 189, dateMAJ: "15/01/2026", valide: true },
  { site: "Yamoussoukro", totalPersonnel: 142, signataires: 128, dateMAJ: "01/01/2026", valide: false },
];

export const vbgPlanAction: VbgPlanAction[] = [
  { id: "vbgpa-001", mesure: "Nommer un Point Focal VBG certifié sur chaque site", categorie: "Prévention", responsable: "DRH", echeance: "01/02/2026", statut: "Réalisé",   norme: "WB Good Practice Note GBV §4.2", priorite: "Haute" },
  { id: "vbgpa-002", mesure: "Former 100% du personnel au Code de Conduite VBG/EAS/HS", categorie: "Prévention", responsable: "HSE Groupe", echeance: "31/03/2026", statut: "Réalisé", norme: "WB ESS2 §24, IFC PS2", priorite: "Haute" },
  { id: "vbgpa-003", mesure: "Mettre en place le Mécanisme de Gestion des Plaintes (MGP) accessible et confidentiel", categorie: "Réponse", responsable: "Chef projet", echeance: "15/01/2026", statut: "Réalisé", norme: "WB ESS2 §26, ESS10", priorite: "Haute" },
  { id: "vbgpa-004", mesure: "Atteindre 100% de signatures du Code de Conduite par tous les travailleurs (y compris sous-traitants)", categorie: "Prévention", responsable: "DRH", echeance: "30/04/2026", statut: "En cours", norme: "WB GBV Note §3.1, IFC PS2", priorite: "Haute" },
  { id: "vbgpa-005", mesure: "Réaliser une évaluation des risques VBG communautaires (E-SEA)", categorie: "Atténuation", responsable: "Consultant externe", echeance: "28/02/2026", statut: "Réalisé", norme: "WB ESS4 §22, GBV Note §2.3", priorite: "Haute" },
  { id: "vbgpa-006", mesure: "Établir des partenariats avec les services de soutien locaux (centres médicaux, ONG)", categorie: "Réponse", responsable: "HSE Groupe", echeance: "31/03/2026", statut: "Réalisé", norme: "WB GBV Note §5.4", priorite: "Moyenne" },
  { id: "vbgpa-007", mesure: "Conduire des audits VBG trimestriels sur tous les sites", categorie: "Suivi", responsable: "Auditeur VBG", echeance: "30/06/2026", statut: "En cours", norme: "WB ESS2 §28, EBRD PR2", priorite: "Moyenne" },
  { id: "vbgpa-008", mesure: "Installer un éclairage adéquat dans les zones sensibles (vestiaires, routes d'accès)", categorie: "Prévention", responsable: "Chef chantier", echeance: "28/02/2026", statut: "Réalisé", norme: "WB GBV Note §4.5", priorite: "Haute" },
  { id: "vbgpa-009", mesure: "Mettre à jour le Plan d'Action VBG suite aux incidents du T1 2026", categorie: "Atténuation", responsable: "HSE Groupe", echeance: "30/04/2026", statut: "En cours", norme: "WB ESS2 ESCP", priorite: "Haute" },
  { id: "vbgpa-010", mesure: "Former les superviseurs à l'identification et à la réponse aux cas VBG", categorie: "Prévention", responsable: "Consultant externe", echeance: "31/05/2026", statut: "Planifié", norme: "ILO C190, WB GBV Note §4.3", priorite: "Moyenne" },
];

// ── Fonctions d'agrégation ────────────────────────────────────────────────────

export function getVbgSummary() {
  const total         = vbgIncidents.length;
  const graves        = vbgIncidents.filter((i) => i.gravite === "Grave" || i.gravite === "Très grave").length;
  const ouverts       = vbgIncidents.filter((i) => i.statut === "Signalé" || i.statut === "En investigation").length;
  const clotures      = vbgIncidents.filter((i) => i.statut === "Clôturé" || i.statut === "Résolu").length;
  const totalPersonnel = vbgCodeConduite.reduce((s, c) => s + c.totalPersonnel, 0);
  const signataires   = vbgCodeConduite.reduce((s, c) => s + c.signataires, 0);
  const tauxSignature = Math.round((signataires / Math.max(totalPersonnel, 1)) * 100);
  const totalFormes   = vbgFormations.reduce((s, f) => s + f.participants, 0);
  const tauxFormation = Math.round((totalFormes / Math.max(totalPersonnel, 1)) * 100);
  const plaintesCloturees = vbgPlaintes.filter((p) => p.statut === "Clôturé").length;
  const tauxResolution    = Math.round((plaintesCloturees / Math.max(vbgPlaintes.length, 1)) * 100);
  const delaiMoyen = Math.round(
    vbgPlaintes.filter((p) => p.delaiTraitement).reduce((s, p) => s + (p.delaiTraitement ?? 0), 0) /
    Math.max(vbgPlaintes.filter((p) => p.delaiTraitement).length, 1)
  );
  const planRealise = vbgPlanAction.filter((p) => p.statut === "Réalisé").length;
  const tauxPlanAction = Math.round((planRealise / Math.max(vbgPlanAction.length, 1)) * 100);

  return {
    total, graves, ouverts, clotures,
    totalPersonnel, signataires, tauxSignature,
    totalFormes, tauxFormation,
    plaintesCloturees, tauxResolution, delaiMoyen,
    planRealise, tauxPlanAction,
  };
}

export function getVbgByType() {
  const map: Record<string, number> = {};
  vbgIncidents.forEach((i) => { map[i.type] = (map[i.type] ?? 0) + 1; });
  return Object.entries(map).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}

export function getVbgBySite() {
  const map: Record<string, { total: number; graves: number }> = {};
  vbgIncidents.forEach((i) => {
    if (!map[i.site]) map[i.site] = { total: 0, graves: 0 };
    map[i.site].total++;
    if (i.gravite === "Grave" || i.gravite === "Très grave") map[i.site].graves++;
  });
  return Object.entries(map).map(([site, v]) => ({ site, ...v }));
}

export function getVbgFormationBySite() {
  const map: Record<string, number> = {};
  vbgFormations.forEach((f) => { map[f.site] = (map[f.site] ?? 0) + f.participants; });
  return Object.entries(map).map(([site, participants]) => ({ site, participants }));
}
