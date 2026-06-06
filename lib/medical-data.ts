export type Aptitude = "Apte" | "Apte avec restrictions" | "Inapte temporaire" | "Inapte definitif";
export type TypeVisite = "Embauche" | "Periodique" | "Reprise" | "Spontanee" | "Pre-reprise";

export type VisiteMedicale = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  poste: string;
  site: string;
  type_visite: TypeVisite;
  date_visite: string;
  date_prochaine: string;
  medecin: string;
  aptitude: Aptitude;
  restrictions: string;
  observations: string;
};

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export const VISITES_MEDICALES: VisiteMedicale[] = [
  { id:"vm-001", nom:"KOUAME",    prenom:"Eric",      matricule:"ACM-001", poste:"Chef de chantier",       site:"Abidjan",       type_visite:"Periodique",  date_visite:"2026-01-10", date_prochaine:"2027-01-10", medecin:"Dr ATTA Paul",      aptitude:"Apte",                    restrictions:"",                                  observations:"Bilan complet satisfaisant" },
  { id:"vm-002", nom:"BAMBA",     prenom:"Seydou",    matricule:"ACM-002", poste:"Chef d'equipe",          site:"Bouake",        type_visite:"Periodique",  date_visite:"2025-12-05", date_prochaine:"2026-06-05", medecin:"Dr KONE Aissatou",  aptitude:"Apte avec restrictions",  restrictions:"Pas de port de charge > 15 kg",     observations:"Hernie discale diagnostiquee" },
  { id:"vm-003", nom:"SORO",      prenom:"Gnangui",   matricule:"ACM-003", poste:"Conducteur d'engins",    site:"Abidjan",       type_visite:"Periodique",  date_visite:"2026-03-20", date_prochaine:"2027-03-20", medecin:"Dr ATTA Paul",      aptitude:"Apte",                    restrictions:"",                                  observations:"Vision et reflexes satisfaisants" },
  { id:"vm-004", nom:"ASSI",      prenom:"Rodrigue",  matricule:"ACM-004", poste:"Responsable HSE",        site:"Yamoussoukro",  type_visite:"Periodique",  date_visite:"2026-02-14", date_prochaine:"2027-02-14", medecin:"Dr DIALLO F.",      aptitude:"Apte",                    restrictions:"",                                  observations:"RAS" },
  { id:"vm-005", nom:"KONAN",     prenom:"Brice",     matricule:"ACM-005", poste:"Technicien maintenance", site:"San Pedro",     type_visite:"Reprise",     date_visite:"2026-05-03", date_prochaine:"2026-11-03", medecin:"Dr KONE Aissatou",  aptitude:"Apte avec restrictions",  restrictions:"Pas travaux en hauteur pendant 3 mois",observations:"Retour apres fracture cheville" },
  { id:"vm-006", nom:"COULIBALY", prenom:"Mariame",   matricule:"ACM-006", poste:"Infirmiere du travail",  site:"Abidjan",       type_visite:"Periodique",  date_visite:"2026-04-08", date_prochaine:"2027-04-08", medecin:"Dr ATTA Paul",      aptitude:"Apte",                    restrictions:"",                                  observations:"Vaccinations a jour" },
  { id:"vm-007", nom:"YAO",       prenom:"Augustin",  matricule:"ACM-007", poste:"Electricien",            site:"Bouake",        type_visite:"Periodique",  date_visite:"2025-11-20", date_prochaine:"2026-05-20", medecin:"Dr KONE Aissatou",  aptitude:"Apte",                    restrictions:"",                                  observations:"Visite a replanifier — depassee" },
  { id:"vm-008", nom:"DIALLO",    prenom:"Moussa",    matricule:"ACM-008", poste:"Grutier",                site:"Abidjan",       type_visite:"Periodique",  date_visite:"2026-05-15", date_prochaine:"2027-05-15", medecin:"Dr ATTA Paul",      aptitude:"Apte",                    restrictions:"",                                  observations:"Test daltonisme negatif" },
  { id:"vm-009", nom:"TRAORE",    prenom:"Salimata",  matricule:"ACM-009", poste:"Responsable HSE site",   site:"Yamoussoukro",  type_visite:"Embauche",    date_visite:"2026-04-01", date_prochaine:"2027-04-01", medecin:"Dr DIALLO F.",      aptitude:"Apte",                    restrictions:"",                                  observations:"Visite d'embauche complete" },
  { id:"vm-010", nom:"KONE",      prenom:"Ibrahim",   matricule:"ACM-010", poste:"Chef d'equipe soudure",  site:"San Pedro",     type_visite:"Periodique",  date_visite:"2026-01-25", date_prochaine:"2026-07-25", medecin:"Dr KONE Aissatou",  aptitude:"Apte avec restrictions",  restrictions:"Port masque poussiere obligatoire", observations:"Debut fibrose - surveillance renforcee" },
  { id:"vm-011", nom:"OUATTARA",  prenom:"Mamadou",   matricule:"ACM-011", poste:"Conducteur PL",          site:"Abidjan",       type_visite:"Periodique",  date_visite:"2026-03-10", date_prochaine:"2027-03-10", medecin:"Dr ATTA Paul",      aptitude:"Apte",                    restrictions:"",                                  observations:"Permis medical valide" },
  { id:"vm-012", nom:"GBAGBO",    prenom:"Paul",      matricule:"ACM-012", poste:"Echafaudeur",            site:"Bouake",        type_visite:"Reprise",     date_visite:"2026-05-28", date_prochaine:"2026-08-28", medecin:"Dr KONE Aissatou",  aptitude:"Inapte temporaire",     restrictions:"Arret travail 3 mois",             observations:"Intervention chirurgicale genou" },
  { id:"vm-013", nom:"DEMBELE",   prenom:"Fatou",     matricule:"ACM-013", poste:"Operatrice chimie",      site:"Abidjan",       type_visite:"Periodique",  date_visite:"2026-02-20", date_prochaine:"2026-08-20", medecin:"Dr ATTA Paul",      aptitude:"Apte",                    restrictions:"",                                  observations:"Bilan toxicologique satisfaisant" },
  { id:"vm-014", nom:"CISSE",     prenom:"Adama",     matricule:"ACM-014", poste:"Coordinateur HSE",       site:"Yamoussoukro",  type_visite:"Periodique",  date_visite:"2025-10-15", date_prochaine:"2026-04-15", medecin:"Dr DIALLO F.",      aptitude:"Apte",                    restrictions:"",                                  observations:"Visite en retard de 2 mois" },
  { id:"vm-015", nom:"FOFANA",    prenom:"Cheick",    matricule:"ACM-015", poste:"Manoeuvre",              site:"San Pedro",     type_visite:"Embauche",    date_visite:"2026-06-01", date_prochaine:"2027-06-01", medecin:"Dr KONE Aissatou",  aptitude:"Apte",                    restrictions:"",                                  observations:"Embauche validee" },
];

export function getMedicalSummary(ville?: string, dateDebut?: string, dateFin?: string) {
  let src = ville ? VISITES_MEDICALES.filter((v) => v.site === ville) : VISITES_MEDICALES;
  if (dateDebut || dateFin) {
    src = src.filter((v) => {
      if (dateDebut && v.date_visite < dateDebut) return false;
      if (dateFin   && v.date_visite > dateFin)   return false;
      return true;
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const total         = src.length || 1;
  const aptes         = src.filter((v) => v.aptitude === "Apte").length;
  const avecRestrictions = src.filter((v) => v.aptitude === "Apte avec restrictions").length;
  const inaptes       = src.filter((v) => v.aptitude.startsWith("Inapte")).length;
  const enRetard      = src.filter((v) => v.date_prochaine < today).length;
  const aVenir30j     = src.filter((v) => {
    const d30 = new Date(); d30.setDate(d30.getDate() + 30);
    return v.date_prochaine >= today && v.date_prochaine <= d30.toISOString().slice(0, 10);
  }).length;
  const tauxAJour     = Math.round(((total - enRetard) / total) * 100);
  return { total, aptes, avecRestrictions, inaptes, enRetard, aVenir30j, tauxAJour };
}
