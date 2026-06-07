export type TypeCauserie = "Causerie" | "Toolbox Talk" | "Briefing securite" | "Quart d'heure securite";

export type Causerie = {
  id: string;
  date: string;
  site: string;
  animateur: string;
  theme: string;
  type: TypeCauserie;
  duree_minutes: number;
  nb_participants: number;
  nb_prevus: number;
  observations: string;
};

export const CAUSERIES: Causerie[] = [
  { id:"cau-001", date:"2026-06-02", site:"Abidjan",      animateur:"ASSI Rodrigue",    theme:"Travail en hauteur — port obligatoire du harnais",     type:"Causerie",              duree_minutes:15, nb_participants:24, nb_prevus:25, observations:"Bonne participation, questions pertinentes sur les points d'ancrage" },
  { id:"cau-002", date:"2026-06-02", site:"Bouake",       animateur:"BAMBA Seydou",     theme:"Gestion des dechets sur chantier — tri selectif",       type:"Toolbox Talk",          duree_minutes:20, nb_participants:18, nb_prevus:20, observations:"Support visuel utilise, equipe engagee" },
  { id:"cau-003", date:"2026-06-01", site:"Abidjan",      animateur:"KOUAME Eric",      theme:"Analyse de l'accident du 28/05 — lecons apprises",      type:"Briefing securite",     duree_minutes:30, nb_participants:32, nb_prevus:32, observations:"Analyse presentee, actions correctives partagees avec l'equipe" },
  { id:"cau-004", date:"2026-06-01", site:"Yamoussoukro", animateur:"TRAORE Salimata",  theme:"Conduite preventive et risques de la route",            type:"Quart d'heure securite",duree_minutes:15, nb_participants:12, nb_prevus:15, observations:"3 absents — formation reportee pour les absents" },
  { id:"cau-005", date:"2026-05-30", site:"San Pedro",    animateur:"KONAN Brice",      theme:"Permis de travail — remplissage correct et verification",type:"Causerie",              duree_minutes:20, nb_participants:21, nb_prevus:21, observations:"Simulation permis realisee en groupe" },
  { id:"cau-006", date:"2026-05-29", site:"Abidjan",      animateur:"ASSI Rodrigue",    theme:"Risques chimiques — manipulation et stockage produits",  type:"Toolbox Talk",          duree_minutes:25, nb_participants:16, nb_prevus:18, observations:"Fiches MSDS distribuees" },
  { id:"cau-007", date:"2026-05-28", site:"Bouake",       animateur:"BAMBA Seydou",     theme:"EPI — usage correct et entretien",                      type:"Causerie",              duree_minutes:15, nb_participants:22, nb_prevus:22, observations:"Demo port equipements realisee" },
  { id:"cau-008", date:"2026-05-27", site:"Abidjan",      animateur:"COULIBALY M.",     theme:"Gestes premiers secours et alerte",                     type:"Briefing securite",     duree_minutes:30, nb_participants:28, nb_prevus:30, observations:"Exercice pratique RCP sur mannequin" },
  { id:"cau-009", date:"2026-05-26", site:"Yamoussoukro", animateur:"CISSE Adama",      theme:"Environnement — impacts chantier et mesures",           type:"Quart d'heure securite",duree_minutes:15, nb_participants:14, nb_prevus:14, observations:"Carte des impacts presentee" },
  { id:"cau-010", date:"2026-05-23", site:"San Pedro",    animateur:"KONAN Brice",      theme:"Travaux en espace confine — procedures et risques",     type:"Toolbox Talk",          duree_minutes:20, nb_participants:8,  nb_prevus:10, observations:"2 operateurs absents pour travail de nuit" },
  { id:"cau-011", date:"2026-05-22", site:"Abidjan",      animateur:"KOUAME Eric",      theme:"Securite incendie et utilisation extincteurs",          type:"Causerie",              duree_minutes:20, nb_participants:30, nb_prevus:30, observations:"Exercice pratique avec extincteurs reels" },
  { id:"cau-012", date:"2026-05-20", site:"Bouake",       animateur:"BAMBA Seydou",     theme:"Chute d'objets — protection zones de travail en hauteur",type:"Toolbox Talk",         duree_minutes:15, nb_participants:19, nb_prevus:20, observations:"Filets de protection inspectes apres causerie" },
  { id:"cau-013", date:"2026-05-19", site:"Abidjan",      animateur:"DIALLO Moussa",    theme:"Levage et elingage — regles de securite",               type:"Causerie",              duree_minutes:20, nb_participants:12, nb_prevus:12, observations:"Demonstration avec grues reelle" },
  { id:"cau-014", date:"2026-05-16", site:"Yamoussoukro", animateur:"TRAORE Salimata",  theme:"Stress thermique — hydratation et signes d'alerte",     type:"Quart d'heure securite",duree_minutes:15, nb_participants:16, nb_prevus:16, observations:"Distribution eau fraiche organisee" },
  { id:"cau-015", date:"2026-05-15", site:"San Pedro",    animateur:"KONAN Brice",      theme:"Circulation chantier — pietons vs engins",              type:"Causerie",              duree_minutes:15, nb_participants:25, nb_prevus:25, observations:"Plan de circulation mis a jour apres session" },
  { id:"cau-016", date:"2026-05-14", site:"Abidjan",      animateur:"ASSI Rodrigue",    theme:"Analyse presqu'accidents — remontee terrain",           type:"Briefing securite",     duree_minutes:25, nb_participants:20, nb_prevus:22, observations:"5 presqu'accidents discutes, 3 actions lancees" },
  { id:"cau-017", date:"2026-05-12", site:"Bouake",       animateur:"YAO Augustin",     theme:"Electricite — risques et consignes de securite",        type:"Toolbox Talk",          duree_minutes:20, nb_participants:15, nb_prevus:15, observations:"Simulation coupure urgence realisee" },
  { id:"cau-018", date:"2026-05-09", site:"Abidjan",      animateur:"COULIBALY M.",     theme:"Bruit et vibrations — seuils et protections",           type:"Causerie",              duree_minutes:15, nb_participants:18, nb_prevus:20, observations:"Sonometres utilises pour demo en temps reel" },
  { id:"cau-019", date:"2026-05-07", site:"Yamoussoukro", animateur:"CISSE Adama",      theme:"HSE pour les sous-traitants — obligations et controles", type:"Briefing securite",    duree_minutes:30, nb_participants:22, nb_prevus:25, observations:"Checklist sous-traitants distribuee" },
  { id:"cau-020", date:"2026-05-05", site:"San Pedro",    animateur:"KONAN Brice",      theme:"Prevention TMS — gestes et postures",                   type:"Quart d'heure securite",duree_minutes:15, nb_participants:20, nb_prevus:20, observations:"Exercices d'etirement realises en groupe" },
];

export function getCauserieSummary(ville?: string, dateDebut?: string, dateFin?: string) {
  let src = ville ? CAUSERIES.filter((c) => c.site === ville) : CAUSERIES;
  if (dateDebut || dateFin) {
    src = src.filter((c) => {
      if (dateDebut && c.date < dateDebut) return false;
      if (dateFin   && c.date > dateFin)   return false;
      return true;
    });
  }
  const total             = src.length;
  const totalParticipants = src.reduce((s, c) => s + c.nb_participants, 0);
  const totalPrevus       = src.reduce((s, c) => s + c.nb_prevus, 0);
  const tauxParticipation = totalPrevus === 0 ? 0 : Math.round((totalParticipants / totalPrevus) * 100);
  const sites             = new Set(src.map((c) => c.site)).size;
  const themes            = new Set(src.map((c) => c.theme)).size;
  const objectifMensuel   = 20;
  const realisesMois      = (dateDebut || dateFin) ? src.length : src.filter((c) => c.date >= "2026-05-01").length;
  const tauxRealisation   = Math.round((realisesMois / objectifMensuel) * 100);
  return { total, totalParticipants, tauxParticipation, sites, themes, objectifMensuel, realisesMois, tauxRealisation };
}
