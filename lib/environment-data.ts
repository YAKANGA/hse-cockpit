export type ImpactEnv = {
  id: number;
  codeChantier: string;
  chantier: string;
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
  { id: 1,  codeChantier: "CHT-01", chantier: "Chantier Pont d'Abidjan",    typeTravraux: "Genie Civil / Pont",      phase: "Exploitation",  impact: "Erosion berges et cours d'eau",    milieuAffecte: "Eau / Sol",       intensite: 3, portee: 3, duree: 2, importance: 18, mesuresAttenuation: "Geotextile, enrochements, fascines",        responsable: "KOUAME Eric",    indicateurSuivi: "Mesure hebdo – Eau/Sol",              statut: "Planifie"  },
  { id: 2,  codeChantier: "CHT-01", chantier: "Chantier Pont d'Abidjan",    typeTravraux: "Genie Civil / Pont",      phase: "Exploitation",  impact: "Turbidite eaux fluviales",         milieuAffecte: "Eau",             intensite: 2, portee: 3, duree: 2, importance: 12, mesuresAttenuation: "Barriere a sediments, decanteur",           responsable: "KOUAME Eric",    indicateurSuivi: "Mesure mensuelle – Eau",              statut: "En cours"  },
  { id: 3,  codeChantier: "CHT-01", chantier: "Chantier Pont d'Abidjan",    typeTravraux: "Genie Civil / Pont",      phase: "Construction",  impact: "Bruit chantier riverains",         milieuAffecte: "Bruit / Population", intensite: 2, portee: 3, duree: 2, importance: 12, mesuresAttenuation: "Plages horaires + merlons anti-bruit",    responsable: "KOUAME Eric",    indicateurSuivi: "Mesure mensuelle – Bruit",            statut: "Planifie"  },
  { id: 4,  codeChantier: "CHT-02", chantier: "Residence Les Cocotiers",    typeTravraux: "Batiment R+5",            phase: "Preparation",   impact: "Poussieres construction",          milieuAffecte: "Air / Sante",     intensite: 2, portee: 1, duree: 3, importance: 6,  mesuresAttenuation: "Arrosage + bache facade",            responsable: "BAMBA Seydou",   indicateurSuivi: "Mesure mensuelle – Air/Sante",        statut: "En cours"  },
  { id: 5,  codeChantier: "CHT-02", chantier: "Residence Les Cocotiers",    typeTravraux: "Batiment R+5",            phase: "Construction",  impact: "Dechets inertes BTP",              milieuAffecte: "Sol",             intensite: 3, portee: 1, duree: 2, importance: 6,  mesuresAttenuation: "Benne tri, centre agree",            responsable: "BAMBA Seydou",   indicateurSuivi: "Mesure mensuelle – Sol",              statut: "Planifie"  },
  { id: 6,  codeChantier: "CHT-02", chantier: "Residence Les Cocotiers",    typeTravraux: "Batiment R+5",            phase: "Construction",  impact: "Eaux beton / laitance",            milieuAffecte: "Eau souterraine", intensite: 3, portee: 1, duree: 2, importance: 6,  mesuresAttenuation: "Bac retention + neutralisation pH",  responsable: "BAMBA Seydou",   indicateurSuivi: "Mesure mensuelle – Eau souterraine",  statut: "Planifie"  },
  { id: 7,  codeChantier: "CHT-03", chantier: "Route Nationale N1 KM12",   typeTravraux: "Voirie / VRD",            phase: "Construction",  impact: "Emissions engins diesel",          milieuAffecte: "Air / GES",       intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Norme Euro V + maintenance",         responsable: "SORO Gnangui",   indicateurSuivi: "Mesure mensuelle – Air/GES",          statut: "Valide"    },
  { id: 8,  codeChantier: "CHT-03", chantier: "Route Nationale N1 KM12",   typeTravraux: "Voirie / VRD",            phase: "Construction",  impact: "Destruction vegetation",           milieuAffecte: "Biodiversite",    intensite: 3, portee: 2, duree: 2, importance: 12, mesuresAttenuation: "Plantation compensatoire",           responsable: "SORO Gnangui",   indicateurSuivi: "Mesure mensuelle – Biodiversite",     statut: "Planifie"  },
  { id: 9,  codeChantier: "CHT-03", chantier: "Route Nationale N1 KM12",   typeTravraux: "Voirie / VRD",            phase: "Exploitation",  impact: "Impermeabilisation sols",          milieuAffecte: "Sol / Eau",       intensite: 3, portee: 3, duree: 3, importance: 27, mesuresAttenuation: "Noues, tranchees drainantes",        responsable: "SORO Gnangui",   indicateurSuivi: "Mesure hebdo – Sol/Eau",              statut: "En cours"  },
  { id: 10, codeChantier: "CHT-04", chantier: "Immeuble Ivoire Tower",      typeTravraux: "Batiment Grand Hauteur",  phase: "Preparation",   impact: "Ombre portee batiments voisins",   milieuAffecte: "Population",      intensite: 1, portee: 2, duree: 3, importance: 6,  mesuresAttenuation: "Etude impact lumineux",              responsable: "ASSI Rodrigue",  indicateurSuivi: "Mesure mensuelle – Population",       statut: "En cours"  },
  { id: 11, codeChantier: "CHT-04", chantier: "Immeuble Ivoire Tower",      typeTravraux: "Batiment Grand Hauteur",  phase: "Exploitation",  impact: "Dechets construction",             milieuAffecte: "Sol",             intensite: 3, portee: 1, duree: 3, importance: 9,  mesuresAttenuation: "Plan gestion dechets 5 flux",        responsable: "ASSI Rodrigue",  indicateurSuivi: "Mesure mensuelle – Sol",              statut: "Valide"    },
  { id: 12, codeChantier: "CHT-04", chantier: "Immeuble Ivoire Tower",      typeTravraux: "Batiment Grand Hauteur",  phase: "Preparation",   impact: "Vibrations travaux fondations",    milieuAffecte: "Sol / Batiments", intensite: 2, portee: 2, duree: 2, importance: 8,  mesuresAttenuation: "Suivi piezometrique",                responsable: "ASSI Rodrigue",  indicateurSuivi: "Mesure mensuelle – Sol/Batiments",    statut: "En cours"  },
  { id: 13, codeChantier: "CHT-05", chantier: "Station Traitement Eau",     typeTravraux: "Genie Industriel",        phase: "Preparation",   impact: "Deversement produits chimiques",   milieuAffecte: "Sol / Eau",       intensite: 3, portee: 2, duree: 2, importance: 12, mesuresAttenuation: "Bac retention 110% + FDS",           responsable: "KONAN Brice",    indicateurSuivi: "Mesure mensuelle – Sol/Eau",          statut: "Planifie"  },
  { id: 14, codeChantier: "CHT-05", chantier: "Station Traitement Eau",     typeTravraux: "Genie Industriel",        phase: "Exploitation",  impact: "Emissions rejets atmospheriques",  milieuAffecte: "Air",             intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Filtres + mesures periodiques",      responsable: "KONAN Brice",    indicateurSuivi: "Mesure mensuelle – Air",              statut: "Planifie"  },
  { id: 15, codeChantier: "CHT-05", chantier: "Station Traitement Eau",     typeTravraux: "Genie Industriel",        phase: "Exploitation",  impact: "Contamination nappes phreatiques", milieuAffecte: "Eau souterraine", intensite: 3, portee: 3, duree: 2, importance: 18, mesuresAttenuation: "Pompage securise + georadar",        responsable: "KONAN Brice",    indicateurSuivi: "Mesure hebdo – Eau souterraine",      statut: "En cours"  },
  { id: 16, codeChantier: "CHT-06", chantier: "Centrale Electrique Bouake", typeTravraux: "Genie Electrique",        phase: "Construction",  impact: "Pollution sonore engins lourds",   milieuAffecte: "Bruit / Population", intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Capotage moteurs + haies acoustiques", responsable: "COULIBALY M.",   indicateurSuivi: "Mesure mensuelle – Bruit",            statut: "En cours"  },
  { id: 17, codeChantier: "CHT-06", chantier: "Centrale Electrique Bouake", typeTravraux: "Genie Electrique",        phase: "Exploitation",  impact: "Champs electromagnetiques",        milieuAffecte: "Population",      intensite: 2, portee: 3, duree: 3, importance: 18, mesuresAttenuation: "Zones de securite + signalisation",  responsable: "COULIBALY M.",   indicateurSuivi: "Mesure hebdo – Champs EM",            statut: "Planifie"  },
  { id: 18, codeChantier: "CHT-06", chantier: "Centrale Electrique Bouake", typeTravraux: "Genie Electrique",        phase: "Preparation",   impact: "Defrichement terrain 4 ha",        milieuAffecte: "Biodiversite",    intensite: 3, portee: 2, duree: 1, importance: 6,  mesuresAttenuation: "Replantation + corridor ecologique", responsable: "COULIBALY M.",   indicateurSuivi: "Suivi annuel – Biodiversite",         statut: "Valide"    },
  { id: 19, codeChantier: "CHT-07", chantier: "ZI San Pedro Phase 2",       typeTravraux: "Amenagement Industriel",  phase: "Construction",  impact: "Ruissellement eaux pluviales",     milieuAffecte: "Eau / Sol",       intensite: 3, portee: 3, duree: 2, importance: 18, mesuresAttenuation: "Bassins de retention + noues paysageres", responsable: "YAO Augustin",   indicateurSuivi: "Mesure hebdo – Pluviometrie",         statut: "En cours"  },
  { id: 20, codeChantier: "CHT-07", chantier: "ZI San Pedro Phase 2",       typeTravraux: "Amenagement Industriel",  phase: "Exploitation",  impact: "Dechets industriels banals",       milieuAffecte: "Sol",             intensite: 2, portee: 2, duree: 3, importance: 12, mesuresAttenuation: "Convention collecte + traitement",   responsable: "YAO Augustin",   indicateurSuivi: "Mesure mensuelle – Sol",              statut: "Planifie"  },
];

export function getEnvSummary() {
  const total = IMPACTS_ENV.length;
  const critique  = IMPACTS_ENV.filter((i) => i.importance >= 18).length;
  const eleve     = IMPACTS_ENV.filter((i) => i.importance >= 12 && i.importance < 18).length;
  const modere    = IMPACTS_ENV.filter((i) => i.importance >= 9  && i.importance < 12).length;
  const faible    = IMPACTS_ENV.filter((i) => i.importance < 9).length;
  const valide    = IMPACTS_ENV.filter((i) => i.statut === "Valide").length;
  const enCours   = IMPACTS_ENV.filter((i) => i.statut === "En cours").length;
  const planifie  = IMPACTS_ENV.filter((i) => i.statut === "Planifie").length;
  const chantiers = new Set(IMPACTS_ENV.map((i) => i.codeChantier)).size;
  return { total, critique, eleve, modere, faible, valide, enCours, planifie, chantiers };
}
