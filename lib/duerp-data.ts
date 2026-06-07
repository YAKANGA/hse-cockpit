export type NiveauRisque = "Critique" | "Eleve" | "Modere" | "Acceptable";
export type StatutDuerp = "Maitrise" | "En cours de traitement" | "Non traite";

export type RisqueDuerp = {
  id: string;
  unite_travail: string;
  activite: string;
  danger: string;
  risque: string;
  frequence: 1 | 2 | 3 | 4 | 5;
  gravite: 1 | 2 | 3 | 4 | 5;
  probabilite: 1 | 2 | 3 | 4 | 5;
  criticite: number;
  mesures_existantes: string;
  mesures_prevues: string;
  responsable: string;
  echeance: string;
  statut: StatutDuerp;
  site: string;
  date_evaluation: string;
};

export function getNiveauRisque(criticite: number): NiveauRisque {
  if (criticite >= 50) return "Critique";
  if (criticite >= 25) return "Eleve";
  if (criticite >= 10) return "Modere";
  return "Acceptable";
}

export const RISQUES_DUERP: RisqueDuerp[] = [
  { id:"r-001", unite_travail:"Gros oeuvre",        activite:"Travaux en hauteur",           danger:"Chute de hauteur",                 risque:"Fractures, deces",               frequence:4, gravite:5, probabilite:3, criticite:60, mesures_existantes:"Garde-corps, harnais obligatoire",       mesures_prevues:"Formation recyclage CACES",              responsable:"KOUAME Eric",    echeance:"2026-07-31", statut:"En cours de traitement", site:"Abidjan"      , date_evaluation:"2026-01-15" },
  { id:"r-002", unite_travail:"Electricite",         activite:"Raccordement electrique",      danger:"Contact electrique",               risque:"Electrocution, brulures",         frequence:3, gravite:5, probabilite:2, criticite:30, mesures_existantes:"Habilitation electrique, consignation",  mesures_prevues:"Audit installations annuel",             responsable:"YAO Augustin",   echeance:"2026-08-30", statut:"En cours de traitement", site:"Bouake"       , date_evaluation:"2026-01-20" },
  { id:"r-003", unite_travail:"Conduite engins",     activite:"Manoeuvres engins chantier",   danger:"Collision engin/pieton",           risque:"Ecrasement, deces",              frequence:3, gravite:5, probabilite:3, criticite:45, mesures_existantes:"Plan circulation, gyrophares",           mesures_prevues:"Camera recul, signal sonore",            responsable:"SORO Gnangui",   echeance:"2026-06-30", statut:"Non traite",             site:"Abidjan"      , date_evaluation:"2026-01-15" },
  { id:"r-004", unite_travail:"Manutention",         activite:"Port de charges manuelles",    danger:"Surcharge physique",               risque:"TMS, lombalgies",                frequence:5, gravite:3, probabilite:4, criticite:60, mesures_existantes:"Formation gestes postures",              mesures_prevues:"Aide mecanisee, rotation des taches",    responsable:"BAMBA Seydou",   echeance:"2026-09-30", statut:"En cours de traitement", site:"Bouake"       , date_evaluation:"2026-02-01" },
  { id:"r-005", unite_travail:"Chimie / Traitement", activite:"Manipulation produits chimiques",danger:"Exposition substances CMR",      risque:"Intoxication, cancers",          frequence:3, gravite:4, probabilite:3, criticite:36, mesures_existantes:"EPI, MSDS disponibles",                  mesures_prevues:"Substitution produits dangereux",        responsable:"KONAN Brice",    echeance:"2026-10-31", statut:"En cours de traitement", site:"San Pedro"    , date_evaluation:"2026-02-10" },
  { id:"r-006", unite_travail:"Soudure",             activite:"Travaux de soudage",           danger:"Rayonnements UV, fumees",          risque:"Brulures oculaires, pneumoconiose",frequence:4,gravite:3, probabilite:3, criticite:36, mesures_existantes:"Masque soudure, aspiration fumees",      mesures_prevues:"Cabines de soudage fermees",             responsable:"KONE Ibrahim",   echeance:"2026-07-31", statut:"Non traite",             site:"San Pedro"    , date_evaluation:"2026-02-10" },
  { id:"r-007", unite_travail:"Gros oeuvre",         activite:"Coffrage beton",               danger:"Chute d'objets / outils",          risque:"Traumatismes craniens",          frequence:4, gravite:4, probabilite:3, criticite:48, mesures_existantes:"Casque obligatoire, filets",             mesures_prevues:"Contenants outils en hauteur",           responsable:"KOUAME Eric",    echeance:"2026-06-30", statut:"En cours de traitement", site:"Abidjan"      , date_evaluation:"2026-01-15" },
  { id:"r-008", unite_travail:"Espaces confines",    activite:"Intervention cuves / egouts",  danger:"Manque d'oxygene / gaz toxiques",  risque:"Asphyxie, intoxication",         frequence:2, gravite:5, probabilite:3, criticite:30, mesures_existantes:"Detecteur gaz, equipe de secours",       mesures_prevues:"Procedure espace confine formalisee",    responsable:"KONAN Brice",    echeance:"2026-07-15", statut:"En cours de traitement", site:"San Pedro"    , date_evaluation:"2026-02-10" },
  { id:"r-009", unite_travail:"Circulation",         activite:"Deplacement vehicules legers",  danger:"Accident de la route",             risque:"Blessures graves, deces",        frequence:5, gravite:4, probabilite:2, criticite:40, mesures_existantes:"Formation conduite defensive",           mesures_prevues:"Limiteur vitesse, ceinture",             responsable:"ASSI Rodrigue",  echeance:"2026-08-31", statut:"Non traite",             site:"Yamoussoukro" , date_evaluation:"2026-01-25" },
  { id:"r-010", unite_travail:"Chaleur / Soleil",    activite:"Travaux exterieurs ete",        danger:"Stress thermique",                 risque:"Coup de chaleur, malaise",       frequence:5, gravite:3, probabilite:3, criticite:45, mesures_existantes:"Pauses regulieres, eau fraiche",         mesures_prevues:"Tentes ombrage, horaires adaptes",       responsable:"TRAORE Salimata",echeance:"2026-06-15", statut:"En cours de traitement", site:"Yamoussoukro" , date_evaluation:"2026-03-01" },
  { id:"r-011", unite_travail:"Bruit",               activite:"Utilisation marteau-piqueur",   danger:"Exposition bruit > 85 dB",         risque:"Surdite professionnelle",        frequence:4, gravite:3, probabilite:4, criticite:48, mesures_existantes:"Protections auditives disponibles",      mesures_prevues:"Mesures phonometriques regulieres",      responsable:"BAMBA Seydou",   echeance:"2026-09-30", statut:"Non traite",             site:"Bouake"       , date_evaluation:"2026-02-01" },
  { id:"r-012", unite_travail:"Incendie",            activite:"Stockage materiaux combustibles",danger:"Incendie / explosion",            risque:"Brulures, deces, sinistre",      frequence:2, gravite:5, probabilite:2, criticite:20, mesures_existantes:"Extincteurs, detente incendie",           mesures_prevues:"Exercice evacuation trimestriel",        responsable:"COULIBALY M.",   echeance:"2026-07-31", statut:"Maitrise",               site:"Abidjan"      , date_evaluation:"2026-01-15" },
  { id:"r-013", unite_travail:"Terrassement",        activite:"Fouilles et tranchees",          danger:"Eboulement de terrain",            risque:"Ensevelissement",                frequence:3, gravite:5, probabilite:2, criticite:30, mesures_existantes:"Blindage systematique > 1,30 m",         mesures_prevues:"Inspection quotidienne avant travaux",   responsable:"SORO Gnangui",   echeance:"2026-06-30", statut:"Maitrise",               site:"Abidjan"      , date_evaluation:"2026-01-15" },
  { id:"r-014", unite_travail:"Administration",      activite:"Travail ecran prolonge",         danger:"Troubles musculo-squelettiques",   risque:"TMS membres superieurs",         frequence:5, gravite:2, probabilite:4, criticite:40, mesures_existantes:"Pause toutes les heures recommandee",    mesures_prevues:"Audit ergonomie postes de travail",      responsable:"CISSE Adama",    echeance:"2026-10-31", statut:"Non traite",             site:"Yamoussoukro" , date_evaluation:"2026-03-01" },
  { id:"r-015", unite_travail:"Levage",              activite:"Utilisation grues et palans",    danger:"Chute de charge",                  risque:"Ecrasement, deces",              frequence:3, gravite:5, probabilite:2, criticite:30, mesures_existantes:"Zone balisee, chef de manoeuvre designee",mesures_prevues:"Maintenance preventive trimestrielle",   responsable:"DIALLO Moussa",  echeance:"2026-07-31", statut:"Maitrise",               site:"Abidjan"      , date_evaluation:"2026-01-15" },
];

export function getDuerpSummary(ville?: string, dateDebut?: string, dateFin?: string) {
  let src = ville ? RISQUES_DUERP.filter((r) => r.site === ville) : RISQUES_DUERP;
  if (dateDebut || dateFin) {
    src = src.filter((r) => {
      if (dateDebut && r.date_evaluation < dateDebut) return false;
      if (dateFin   && r.date_evaluation > dateFin)   return false;
      return true;
    });
  }
  const total        = src.length;
  const critique     = src.filter((r) => r.criticite >= 50).length;
  const eleve        = src.filter((r) => r.criticite >= 25 && r.criticite < 50).length;
  const modere       = src.filter((r) => r.criticite >= 10 && r.criticite < 25).length;
  const acceptable   = src.filter((r) => r.criticite < 10).length;
  const maitrise     = src.filter((r) => r.statut === "Maitrise").length;
  const nonTraite    = src.filter((r) => r.statut === "Non traite").length;
  const criticiteMax = src.length > 0 ? Math.max(...src.map((r) => r.criticite)) : 0;
  const tauxMaitrise = total === 0 ? 0 : Math.round((maitrise / total) * 100);
  return { total, critique, eleve, modere, acceptable, maitrise, nonTraite, criticiteMax, tauxMaitrise };
}
