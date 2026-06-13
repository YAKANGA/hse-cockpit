export type ImpactEnv = {
  id: number;
  projectId: string;
  projectName: string;
  typeTravraux: string;
  phase: "Preparation" | "Construction" | "Exploitation";
  impact: string;
  milieuAffecte: string;
  intensite: 1 | 2 | 3;
  portee: 1 | 2 | 3;
  duree: 1 | 2 | 3;
  importance: number;
  mesuresAttenuation: string;
  responsable: string;
  indicateurSuivi: string;
  statut: "Planifie" | "En cours" | "Valide";
  date_evaluation: string;
};

export type NiveauImportance = "Critique" | "Eleve" | "Modere" | "Faible";

export function getNiveauImportance(score: number): NiveauImportance {
  if (score >= 18) return "Critique";
  if (score >= 12) return "Eleve";
  if (score >= 9) return "Modere";
  return "Faible";
}

export const IMPORTANCE_COLOR: Record<NiveauImportance, string> = {
  Critique: "#dc2626",
  Eleve:    "#ea580c",
  Modere:   "#d97706",
  Faible:   "#16a34a",
};

export const STATUT_COLOR: Record<string, string> = {
  "Planifie":  "#2563eb",
  "En cours":  "#d97706",
  "Valide":    "#16a34a",
};

export const IMPACTS_ENV: ImpactEnv[] = [
  { id: 1,  projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam Phase 2",             typeTravraux: "Genie Civil / Pont",      phase: "Exploitation",  impact: "Erosion berges et cours d'eau",    milieuAffecte: "Eau / Sol",          intensite: 3, portee: 3, duree: 2, importance: 18, mesuresAttenuation: "Geotextile, enrochements, fascines",            responsable: "KOUAME Eric",    indicateurSuivi: "Mesure hebdo – Eau/Sol",             statut: "Planifie",   date_evaluation: "2026-01-15" },
  { id: 2,  projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam Phase 2",             typeTravraux: "Genie Civil / Pont",      phase: "Exploitation",  impact: "Turbidite eaux fluviales",         milieuAffecte: "Eau",                intensite: 2, portee: 3, duree: 2, importance: 12, mesuresAttenuation: "Barriere a sediments, decanteur",               responsable: "KOUAME Eric",    indicateurSuivi: "Mesure mensuelle – Eau",             statut: "En cours",   date_evaluation: "2026-01-15" },
  { id: 3,  projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam Phase 2",             typeTravraux: "Genie Civil / Pont",      phase: "Construction",  impact: "Bruit chantier riverains",         milieuAffecte: "Bruit / Population", intensite: 2, portee: 3, duree: 2, importance: 12, mesuresAttenuation: "Plages horaires + merlons anti-bruit",          responsable: "KOUAME Eric",    indicateurSuivi: "Mesure mensuelle – Bruit",           statut: "Planifie",   date_evaluation: "2026-01-15" },
  { id: 4,  projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance Center",                  typeTravraux: "Batiment R+5",            phase: "Preparation",   impact: "Poussieres construction",          milieuAffecte: "Air / Sante",        intensite: 2, portee: 1, duree: 3, importance: 6,  mesuresAttenuation: "Arrosage + bache facade",                responsable: "BAMBA Seydou",   indicateurSuivi: "Mesure mensuelle – Air/Sante",       statut: "En cours",   date_evaluation: "2026-02-10" },
  { id: 5,  projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance Center",                  typeTravraux: "Batiment R+5",            phase: "Construction",  impact: "Dechets inertes BTP",              milieuAffecte: "Sol",                intensite: 3, portee: 1, duree: 2, importance: 6,  mesuresAttenuation: "Benne tri, centre agree",                responsable: "BAMBA Seydou",   indicateurSuivi: "Mesure mensuelle – Sol",             statut: "Planifie",   date_evaluation: "2026-02-10" },
  { id: 6,  projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance Center",                  typeTravraux: "Batiment R+5",            phase: "Construction",  impact: "Eaux beton / laitance",            milieuAffecte: "Eau souterraine",    intensite: 3, portee: 1, duree: 2, importance: 6,  mesuresAttenuation: "Bac retention + neutralisation pH",      responsable: "BAMBA Seydou",   indicateurSuivi: "Mesure mensuelle – Eau souterraine", statut: "Planifie",   date_evaluation: "2026-02-10" },
  { id: 7,  projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam Phase 2",             typeTravraux: "Voirie / VRD",            phase: "Construction",  impact: "Emissions engins diesel",          milieuAffecte: "Air / GES",          intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Norme Euro V + maintenance",             responsable: "SORO Gnangui",   indicateurSuivi: "Mesure mensuelle – Air/GES",         statut: "Valide",     date_evaluation: "2026-01-20" },
  { id: 8,  projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam Phase 2",             typeTravraux: "Voirie / VRD",            phase: "Construction",  impact: "Destruction vegetation",           milieuAffecte: "Biodiversite",       intensite: 3, portee: 2, duree: 2, importance: 12, mesuresAttenuation: "Plantation compensatoire",               responsable: "SORO Gnangui",   indicateurSuivi: "Mesure mensuelle – Biodiversite",    statut: "Planifie",   date_evaluation: "2026-01-20" },
  { id: 9,  projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam Phase 2",             typeTravraux: "Voirie / VRD",            phase: "Exploitation",  impact: "Impermeabilisation sols",          milieuAffecte: "Sol / Eau",          intensite: 3, portee: 3, duree: 3, importance: 27, mesuresAttenuation: "Noues, tranchees drainantes",            responsable: "SORO Gnangui",   indicateurSuivi: "Mesure hebdo – Sol/Eau",             statut: "En cours",   date_evaluation: "2026-01-25" },
  { id: 10, projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance Center",                  typeTravraux: "Batiment Grand Hauteur",  phase: "Preparation",   impact: "Ombre portee batiments voisins",   milieuAffecte: "Population",         intensite: 1, portee: 2, duree: 3, importance: 6,  mesuresAttenuation: "Etude impact lumineux",                  responsable: "ASSI Rodrigue",  indicateurSuivi: "Mesure mensuelle – Population",      statut: "En cours",   date_evaluation: "2026-02-15" },
  { id: 11, projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance Center",                  typeTravraux: "Batiment Grand Hauteur",  phase: "Exploitation",  impact: "Dechets construction",             milieuAffecte: "Sol",                intensite: 3, portee: 1, duree: 3, importance: 9,  mesuresAttenuation: "Plan gestion dechets 5 flux",            responsable: "ASSI Rodrigue",  indicateurSuivi: "Mesure mensuelle – Sol",             statut: "Valide",     date_evaluation: "2026-02-20" },
  { id: 12, projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance Center",                  typeTravraux: "Batiment Grand Hauteur",  phase: "Preparation",   impact: "Vibrations travaux fondations",    milieuAffecte: "Sol / Batiments",    intensite: 2, portee: 2, duree: 2, importance: 8,  mesuresAttenuation: "Suivi piezometrique",                    responsable: "ASSI Rodrigue",  indicateurSuivi: "Mesure mensuelle – Sol/Batiments",   statut: "En cours",   date_evaluation: "2026-02-20" },
  { id: 13, projectId: "PRJ-YMK-001", projectName: "Rehabilitation Infrastructures Yamoussoukro", typeTravraux: "Genie Industriel",        phase: "Preparation",   impact: "Deversement produits chimiques",   milieuAffecte: "Sol / Eau",          intensite: 3, portee: 2, duree: 2, importance: 12, mesuresAttenuation: "Bac retention 110% + FDS",               responsable: "KONAN Brice",    indicateurSuivi: "Mesure mensuelle – Sol/Eau",         statut: "Planifie",   date_evaluation: "2026-02-01" },
  { id: 14, projectId: "PRJ-YMK-001", projectName: "Rehabilitation Infrastructures Yamoussoukro", typeTravraux: "Genie Industriel",        phase: "Exploitation",  impact: "Emissions rejets atmospheriques",  milieuAffecte: "Air",                intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Filtres + mesures periodiques",          responsable: "KONAN Brice",    indicateurSuivi: "Mesure mensuelle – Air",             statut: "Planifie",   date_evaluation: "2026-02-01" },
  { id: 15, projectId: "PRJ-YMK-001", projectName: "Rehabilitation Infrastructures Yamoussoukro", typeTravraux: "Genie Industriel",        phase: "Exploitation",  impact: "Contamination nappes phreatiques", milieuAffecte: "Eau souterraine",    intensite: 3, portee: 3, duree: 2, importance: 18, mesuresAttenuation: "Pompage securise + georadar",            responsable: "KONAN Brice",    indicateurSuivi: "Mesure hebdo – Eau souterraine",     statut: "En cours",   date_evaluation: "2026-02-28" },
  { id: 16, projectId: "PRJ-BKE-002", projectName: "Carriere Granite Bouake Nord",                typeTravraux: "Genie Electrique",        phase: "Construction",  impact: "Pollution sonore engins lourds",   milieuAffecte: "Bruit / Population", intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Capotage moteurs + haies acoustiques",   responsable: "COULIBALY M.",   indicateurSuivi: "Mesure mensuelle – Bruit",           statut: "En cours",   date_evaluation: "2026-01-20" },
  { id: 17, projectId: "PRJ-BKE-002", projectName: "Carriere Granite Bouake Nord",                typeTravraux: "Genie Electrique",        phase: "Exploitation",  impact: "Champs electromagnetiques",        milieuAffecte: "Population",         intensite: 2, portee: 3, duree: 3, importance: 18, mesuresAttenuation: "Zones de securite + signalisation",      responsable: "COULIBALY M.",   indicateurSuivi: "Mesure hebdo – Champs EM",           statut: "Planifie",   date_evaluation: "2026-01-20" },
  { id: 18, projectId: "PRJ-BKE-002", projectName: "Carriere Granite Bouake Nord",                typeTravraux: "Genie Electrique",        phase: "Preparation",   impact: "Defrichement terrain 4 ha",        milieuAffecte: "Biodiversite",       intensite: 3, portee: 2, duree: 1, importance: 6,  mesuresAttenuation: "Replantation + corridor ecologique",     responsable: "COULIBALY M.",   indicateurSuivi: "Suivi annuel – Biodiversite",        statut: "Valide",     date_evaluation: "2026-02-15" },
  { id: 19, projectId: "PRJ-SPD-002", projectName: "Zone Industrielle San Pedro Extension",       typeTravraux: "Amenagement Industriel",  phase: "Construction",  impact: "Ruissellement eaux pluviales",       milieuAffecte: "Eau / Sol",          intensite: 3, portee: 3, duree: 2, importance: 18, mesuresAttenuation: "Bassins de retention + noues paysageres",  responsable: "YAO Augustin",    indicateurSuivi: "Mesure hebdo – Pluviometrie",        statut: "En cours",   date_evaluation: "2026-03-01" },
  { id: 20, projectId: "PRJ-SPD-002", projectName: "Zone Industrielle San Pedro Extension",       typeTravraux: "Amenagement Industriel",  phase: "Exploitation",  impact: "Dechets industriels banals",         milieuAffecte: "Sol",                intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Convention collecte + traitement",        responsable: "YAO Augustin",    indicateurSuivi: "Mesure mensuelle – Sol",             statut: "Planifie",   date_evaluation: "2026-03-01" },

  // ── PRJ-BKE-001 — Route Nationale RN3 Bouake-Katiola ────────────────────
  { id: 21, projectId: "PRJ-BKE-001", projectName: "Route Nationale RN3 Bouake-Katiola",          typeTravraux: "Terrassement / VRD",      phase: "Construction",  impact: "Erosion talus de deblai",            milieuAffecte: "Sol",                intensite: 3, portee: 2, duree: 2, importance: 12, mesuresAttenuation: "Ensemencement + perres maconnes",         responsable: "DIOMANDE Issouf", indicateurSuivi: "Mesure mensuelle – Sol",             statut: "En cours",   date_evaluation: "2026-01-10" },
  { id: 22, projectId: "PRJ-BKE-001", projectName: "Route Nationale RN3 Bouake-Katiola",          typeTravraux: "Terrassement / VRD",      phase: "Exploitation",  impact: "Poussieres et emissions routieres",  milieuAffecte: "Air / Population",   intensite: 2, portee: 3, duree: 3, importance: 18, mesuresAttenuation: "Arrosage pistes + brise-vents",           responsable: "DIOMANDE Issouf", indicateurSuivi: "Mesure hebdo – Air",                 statut: "Planifie",   date_evaluation: "2026-01-10" },

  // ── PRJ-SPD-001 — Terminal Vraquiers Port San Pedro ─────────────────────
  { id: 23, projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers Port San Pedro",            typeTravraux: "Genie Civil Portuaire",   phase: "Exploitation",  impact: "Deversements accidentels hydrocarbures", milieuAffecte: "Eau / Sol",       intensite: 3, portee: 3, duree: 2, importance: 18, mesuresAttenuation: "Bacs retention 110% + kit antipollution", responsable: "AHUI Marcel",     indicateurSuivi: "Mesure hebdo – Eau/Sol",             statut: "En cours",   date_evaluation: "2026-02-05" },
  { id: 24, projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers Port San Pedro",            typeTravraux: "Genie Civil Portuaire",   phase: "Construction",  impact: "Bruit engins portuaires",            milieuAffecte: "Bruit / Population", intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Planification horaire + EPI auditif",    responsable: "AHUI Marcel",     indicateurSuivi: "Mesure mensuelle – Bruit",           statut: "Valide",     date_evaluation: "2026-02-05" },

  // ── PRJ-DM-001 — Mine de Fer Korhogo Nord ───────────────────────────────
  { id: 25, projectId: "PRJ-DM-001", projectName: "Mine de Fer Korhogo Nord",                     typeTravraux: "Exploitation Miniere",    phase: "Exploitation",  impact: "Excavation et modification terrain", milieuAffecte: "Sol",                intensite: 3, portee: 3, duree: 3, importance: 27, mesuresAttenuation: "Plan remise en etat + talutage",         responsable: "TRAORE Moussa",   indicateurSuivi: "Mesure mensuelle – Sol",             statut: "En cours",   date_evaluation: "2026-03-10" },
  { id: 26, projectId: "PRJ-DM-001", projectName: "Mine de Fer Korhogo Nord",                     typeTravraux: "Exploitation Miniere",    phase: "Construction",  impact: "Poussieres forage et abattage",      milieuAffecte: "Air / Population",   intensite: 3, portee: 2, duree: 3, importance: 18, mesuresAttenuation: "Abattage humide + asperseurs",           responsable: "TRAORE Moussa",   indicateurSuivi: "Mesure hebdo – Air",                 statut: "Planifie",   date_evaluation: "2026-03-10" },

  // ── PRJ-DM-002 — Centrale Electrique Mine Korhogo ───────────────────────
  { id: 27, projectId: "PRJ-DM-002", projectName: "Centrale Electrique Mine Korhogo",              typeTravraux: "Installation Electrique", phase: "Preparation",   impact: "Emissions sonores centrale",         milieuAffecte: "Bruit / Population", intensite: 2, portee: 2, duree: 2, importance: 8,  mesuresAttenuation: "Caisson anti-bruit + surveillance",      responsable: "KONE Sekou",      indicateurSuivi: "Mesure mensuelle – Bruit",           statut: "Planifie",   date_evaluation: "2026-04-01" },
  { id: 28, projectId: "PRJ-DM-002", projectName: "Centrale Electrique Mine Korhogo",              typeTravraux: "Installation Electrique", phase: "Exploitation",  impact: "Rejets thermiques centrale",         milieuAffecte: "Air",                intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Systeme refroidissement + mesures T°",  responsable: "KONE Sekou",      indicateurSuivi: "Mesure mensuelle – Air",             statut: "En cours",   date_evaluation: "2026-04-01" },

  // ── PRJ-MDL-001 — Hub Logistique Vridi Abidjan ──────────────────────────
  { id: 29, projectId: "PRJ-MDL-001", projectName: "Hub Logistique Vridi Abidjan",                 typeTravraux: "Logistique / Manutention",phase: "Exploitation",  impact: "Rejets eaux pluviales zone logistique", milieuAffecte: "Eau / Sol",       intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Degraisseur + bassin ecreteur",          responsable: "GNEBA Armel",     indicateurSuivi: "Mesure mensuelle – Eau/Sol",         statut: "Valide",     date_evaluation: "2026-01-20" },
  { id: 30, projectId: "PRJ-MDL-001", projectName: "Hub Logistique Vridi Abidjan",                 typeTravraux: "Logistique / Manutention",phase: "Construction",  impact: "Pollution visuelle stockage conteneurs", milieuAffecte: "Population",      intensite: 1, portee: 2, duree: 2, importance: 4,  mesuresAttenuation: "Plan masse + ecran vegetal",             responsable: "GNEBA Armel",     indicateurSuivi: "Suivi trimestriel – Population",    statut: "Planifie",   date_evaluation: "2026-01-20" },

  // ── PRJ-MDL-002 — Entrepôt Frigorifique Grand-Bassam ────────────────────
  { id: 31, projectId: "PRJ-MDL-002", projectName: "Entrepot Frigorifique Grand-Bassam",           typeTravraux: "Froid Industriel",        phase: "Exploitation",  impact: "Emissions gaz refrigerants HFC",     milieuAffecte: "Air / GES",          intensite: 3, portee: 2, duree: 3, importance: 18, mesuresAttenuation: "Detecteurs fuite + fluides F-Gas Reg",   responsable: "LOBA Patrick",    indicateurSuivi: "Mesure mensuelle – Air/GES",         statut: "Planifie",   date_evaluation: "2026-02-25" },
  { id: 32, projectId: "PRJ-MDL-002", projectName: "Entrepot Frigorifique Grand-Bassam",           typeTravraux: "Froid Industriel",        phase: "Construction",  impact: "Consommation energetique elevee",    milieuAffecte: "Air / GES",          intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Isolation thermique + VMC optimisee",    responsable: "LOBA Patrick",    indicateurSuivi: "Mesure mensuelle – Air/GES",         statut: "En cours",   date_evaluation: "2026-02-25" },
];

export function getEnvSummary() {
  const total    = IMPACTS_ENV.length;
  const critique = IMPACTS_ENV.filter((i) => i.importance >= 18).length;
  const eleve    = IMPACTS_ENV.filter((i) => i.importance >= 12 && i.importance < 18).length;
  const modere   = IMPACTS_ENV.filter((i) => i.importance >= 9  && i.importance < 12).length;
  const faible   = IMPACTS_ENV.filter((i) => i.importance < 9).length;
  const valide   = IMPACTS_ENV.filter((i) => i.statut === "Valide").length;
  const enCours  = IMPACTS_ENV.filter((i) => i.statut === "En cours").length;
  const planifie = IMPACTS_ENV.filter((i) => i.statut === "Planifie").length;
  const projets  = new Set(IMPACTS_ENV.map((i) => i.projectId)).size;
  return { total, critique, eleve, modere, faible, valide, enCours, planifie, projets };
}
