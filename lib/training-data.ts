export type TypeFormation = "Formation" | "Habilitation" | "Attestation" | "Recyclage";
export type StatutHabilitation = "Valide" | "Expire" | "En cours" | "A renouveler";

export type Habilitation = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  poste: string;
  site: string;
  type: TypeFormation;
  titre: string;
  organisme: string;
  date_formation: string;
  date_expiration: string | null;
  statut: StatutHabilitation;
  document_ref: string;
};

const today = new Date();
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10);
}
const T = today.toISOString().slice(0, 10);

export const HABILITATIONS: Habilitation[] = [
  { id:"hab-001", nom:"KOUAME",    prenom:"Eric",      matricule:"ACM-001", poste:"Chef de chantier",         site:"Abidjan",      type:"Habilitation", titre:"Travail en hauteur",             organisme:"SOCOTEC CI",      date_formation:"2024-03-15", date_expiration: addDays(today, 45),   statut:"A renouveler", document_ref:"HAB-2024-001" },
  { id:"hab-002", nom:"BAMBA",     prenom:"Seydou",    matricule:"ACM-002", poste:"Chef d'equipe",            site:"Bouake",       type:"Habilitation", titre:"Habilitation electrique B2V",    organisme:"Bureau Veritas",  date_formation:"2025-01-10", date_expiration: addDays(today, 210),  statut:"Valide",       document_ref:"HAB-2025-002" },
  { id:"hab-003", nom:"SORO",      prenom:"Gnangui",   matricule:"ACM-003", poste:"Conducteur d'engins",      site:"Abidjan",      type:"Habilitation", titre:"CACES Engins de chantier R482",  organisme:"APAVE",           date_formation:"2023-06-20", date_expiration: addDays(today, -30),  statut:"Expire",       document_ref:"HAB-2023-003" },
  { id:"hab-004", nom:"ASSI",      prenom:"Rodrigue",  matricule:"ACM-004", poste:"Responsable HSE",          site:"Yamoussoukro", type:"Formation",    titre:"ISO 45001 Lead Auditor",         organisme:"LRQA",            date_formation:"2025-02-05", date_expiration:null,                  statut:"Valide",       document_ref:"FORM-2025-004" },
  { id:"hab-005", nom:"KONAN",     prenom:"Brice",     matricule:"ACM-005", poste:"Technicien maintenance",   site:"San Pedro",    type:"Habilitation", titre:"Espace confine",                 organisme:"SOCOTEC CI",      date_formation:"2024-09-12", date_expiration: addDays(today, 15),   statut:"A renouveler", document_ref:"HAB-2024-005" },
  { id:"hab-006", nom:"COULIBALY", prenom:"Mariame",   matricule:"ACM-006", poste:"Infirmiere du travail",    site:"Abidjan",      type:"Attestation",  titre:"Secouriste SST",                 organisme:"Croix Rouge CI",  date_formation:"2025-03-01", date_expiration: addDays(today, 300),  statut:"Valide",       document_ref:"ATT-2025-006" },
  { id:"hab-007", nom:"YAO",       prenom:"Augustin",  matricule:"ACM-007", poste:"Electricien",              site:"Bouake",       type:"Habilitation", titre:"Habilitation electrique H0B0",   organisme:"Bureau Veritas",  date_formation:"2024-01-20", date_expiration: addDays(today, -90),  statut:"Expire",       document_ref:"HAB-2024-007" },
  { id:"hab-008", nom:"DIALLO",    prenom:"Moussa",    matricule:"ACM-008", poste:"Grutier",                  site:"Abidjan",      type:"Habilitation", titre:"CACES Grues mobiles R483",       organisme:"APAVE",           date_formation:"2025-04-10", date_expiration: addDays(today, 1650), statut:"Valide",       document_ref:"HAB-2025-008" },
  { id:"hab-009", nom:"TRAORE",    prenom:"Salimata",  matricule:"ACM-009", poste:"Responsable HSE site",     site:"Yamoussoukro", type:"Formation",    titre:"Formation incendie niveau 2",    organisme:"SDIS CI",         date_formation:"2025-01-15", date_expiration: addDays(today, 365),  statut:"Valide",       document_ref:"FORM-2025-009" },
  { id:"hab-010", nom:"KONE",      prenom:"Ibrahim",   matricule:"ACM-010", poste:"Chef d'equipe soudure",    site:"San Pedro",    type:"Habilitation", titre:"Soudure niveau 2 — Travail a chaud", organisme:"SOCOTEC CI",  date_formation:"2024-07-30", date_expiration: addDays(today, 60),   statut:"A renouveler", document_ref:"HAB-2024-010" },
  { id:"hab-011", nom:"OUATTARA",  prenom:"Mamadou",   matricule:"ACM-011", poste:"Conducteur PL",            site:"Abidjan",      type:"Attestation",  titre:"Formation conduite defensive",   organisme:"SECURITE ROUTE",  date_formation:"2025-05-20", date_expiration: addDays(today, 730),  statut:"Valide",       document_ref:"ATT-2025-011" },
  { id:"hab-012", nom:"GBAGBO",    prenom:"Paul",      matricule:"ACM-012", poste:"Echafaudeur",              site:"Bouake",       type:"Habilitation", titre:"Montage echafaudages",           organisme:"Bureau Veritas",  date_formation:"2024-11-05", date_expiration: addDays(today, 120),  statut:"Valide",       document_ref:"HAB-2024-012" },
  { id:"hab-013", nom:"DEMBELE",   prenom:"Fatou",     matricule:"ACM-013", poste:"Operatrice chimie",        site:"Abidjan",      type:"Formation",    titre:"Risques chimiques — CMR",        organisme:"INRS partenaire", date_formation:"2025-02-28", date_expiration: addDays(today, 395),  statut:"Valide",       document_ref:"FORM-2025-013" },
  { id:"hab-014", nom:"CISSE",     prenom:"Adama",     matricule:"ACM-014", poste:"Coordinateur HSE groupe",  site:"Yamoussoukro", type:"Formation",    titre:"ISO 14001 — Auditeur interne",   organisme:"LRQA",            date_formation:"2025-01-22", date_expiration:null,                  statut:"Valide",       document_ref:"FORM-2025-014" },
  { id:"hab-015", nom:"FOFANA",    prenom:"Cheick",    matricule:"ACM-015", poste:"Manoeuvre",                site:"San Pedro",    type:"Formation",    titre:"Accueil securite chantier",      organisme:"HSE Cockpit",     date_formation: T,           date_expiration: addDays(today, 365),  statut:"En cours",     document_ref:"FORM-2026-015" },
];

export function getTrainingSummary(ville?: string, dateDebut?: string, dateFin?: string) {
  let src = ville ? HABILITATIONS.filter((h) => h.site === ville) : HABILITATIONS;
  if (dateDebut || dateFin) {
    src = src.filter((h) => {
      if (dateDebut && h.date_formation < dateDebut) return false;
      if (dateFin   && h.date_formation > dateFin)   return false;
      return true;
    });
  }
  const total       = src.length || 1;
  const valide      = src.filter((h) => h.statut === "Valide").length;
  const expire      = src.filter((h) => h.statut === "Expire").length;
  const aRenouveler = src.filter((h) => h.statut === "A renouveler").length;
  const enCours     = src.filter((h) => h.statut === "En cours").length;
  const tauxAJour   = Math.round((valide / total) * 100);
  const sites       = new Set(src.map((h) => h.site)).size;
  const types       = new Set(src.map((h) => h.type)).size;
  return { total, valide, expire, aRenouveler, enCours, tauxAJour, sites, types };
}
