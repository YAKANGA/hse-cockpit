export type ModuleRecord = {
  id: string;
  moduleId: string;
  date: string;
  tenantId: string;   // entreprise propriétaire — dérivé de projects-data via projectId
  site: string;       // ville (= HSESite.name) — clé legacy pour filtres
  projectId: string;  // projet rattaché au site
  projectName: string;
  entity: string;
  label: string;
  category: string;
  owner: string;
  status: "Ouvert" | "En cours" | "Clos" | "A corriger" | "Valide";
  priority: "Basse" | "Normale" | "Haute" | "Critique";
  dueDate: string;
};

import { tenantIdForProjectId } from "@/lib/projects-data";
export { tenantIdForProjectId };

type SeedRecord = Omit<ModuleRecord, "tenantId">;

const seedRecords: SeedRecord[] = [
  {
    id: "evt-001",
    moduleId: "events",
    date: "02/06/2026",
    site: "Bouake",
    projectId: "PRJ-BKE-001",
    projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake",
    label: "Incident levage sans dommage",
    category: "Incident",
    owner: "S. Traore",
    status: "En cours",
    priority: "Haute",
    dueDate: "08/06/2026",
  },
  {
    id: "evt-002",
    moduleId: "events",
    date: "30/05/2026",
    site: "Abidjan",
    projectId: "PRJ-ABJ-001",
    projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan",
    label: "Presqu'accident circulation engin",
    category: "Presqu'accident",
    owner: "A. Kouadio",
    status: "Ouvert",
    priority: "Critique",
    dueDate: "05/06/2026",
  },
  {
    id: "ins-001",
    moduleId: "inspections",
    date: "31/05/2026",
    site: "San Pedro",
    projectId: "PRJ-SPD-001",
    projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro",
    label: "Audit stockage produits chimiques",
    category: "Audit",
    owner: "N. Kone",
    status: "A corriger",
    priority: "Haute",
    dueDate: "10/06/2026",
  },
  {
    id: "ins-002",
    moduleId: "inspections",
    date: "28/05/2026",
    site: "Yamoussoukro",
    projectId: "PRJ-YMK-001",
    projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro",
    label: "Inspection port EPI zone coffrage",
    category: "Inspection",
    owner: "M. Diallo",
    status: "Clos",
    priority: "Normale",
    dueDate: "02/06/2026",
  },
  {
    id: "per-001",
    moduleId: "permits",
    date: "01/06/2026",
    site: "Abidjan",
    projectId: "PRJ-ABJ-002",
    projectName: "Tour Plateau Finance",
    entity: "Site Abidjan",
    label: "Travail a chaud atelier maintenance",
    category: "Travail a chaud",
    owner: "A. Kouadio",
    status: "Valide",
    priority: "Haute",
    dueDate: "01/06/2026",
  },
  {
    id: "per-002",
    moduleId: "permits",
    date: "29/05/2026",
    site: "Bouake",
    projectId: "PRJ-BKE-002",
    projectName: "Carriere Granite BKE Nord",
    entity: "Site Bouake",
    label: "Intervention espace confine cuve",
    category: "Espace confine",
    owner: "S. Traore",
    status: "A corriger",
    priority: "Critique",
    dueDate: "04/06/2026",
  },
  {
    id: "act-001",
    moduleId: "actions",
    date: "27/05/2026",
    site: "Bouake",
    projectId: "PRJ-BKE-001",
    projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake",
    label: "Installer garde-corps provisoires",
    category: "Action corrective",
    owner: "M. Diallo",
    status: "En cours",
    priority: "Critique",
    dueDate: "06/06/2026",
  },
  {
    id: "act-002",
    moduleId: "actions",
    date: "25/05/2026",
    site: "San Pedro",
    projectId: "PRJ-SPD-001",
    projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro",
    label: "Former equipe levage aux signaux",
    category: "Action preventive",
    owner: "N. Kone",
    status: "Ouvert",
    priority: "Haute",
    dueDate: "12/06/2026",
  },
  {
    id: "ind-001",
    moduleId: "indicators",
    date: "31/05/2026",
    site: "Abidjan",
    projectId: "PRJ-ABJ-001",
    projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan",
    label: "Reporting mensuel mai",
    category: "Indicateurs mensuels",
    owner: "S. Traore",
    status: "Valide",
    priority: "Normale",
    dueDate: "03/06/2026",
  },
  {
    id: "ind-002",
    moduleId: "indicators",
    date: "31/05/2026",
    site: "Bouake",
    projectId: "PRJ-BKE-001",
    projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake",
    label: "Heures travaillees a completer",
    category: "Donnees manquantes",
    owner: "M. Diallo",
    status: "A corriger",
    priority: "Haute",
    dueDate: "04/06/2026",
  },
  {
    id: "ppe-001",
    moduleId: "ppe",
    date: "02/06/2026",
    site: "San Pedro",
    projectId: "PRJ-SPD-001",
    projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro",
    label: "Masques FFP3 a commander",
    category: "Voies respiratoires",
    owner: "K. Yao",
    status: "Ouvert",
    priority: "Critique",
    dueDate: "05/06/2026",
  },
  {
    id: "ppe-002",
    moduleId: "ppe",
    date: "01/06/2026",
    site: "Abidjan",
    projectId: "PRJ-ABJ-002",
    projectName: "Tour Plateau Finance",
    entity: "Site Abidjan",
    label: "Controle detecteurs gaz",
    category: "Detection gaz",
    owner: "A. Kouadio",
    status: "En cours",
    priority: "Haute",
    dueDate: "07/06/2026",
  },

  // ── PRJ-ABJ-001 (Autoroute Abidjan) — records supplémentaires ──
  {
    id: "ins-abj-001", moduleId: "inspections", date: "29/05/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Inspection signalisation temporaire chantier", category: "Inspection",
    owner: "A. Kouadio", status: "Clos", priority: "Haute", dueDate: "01/06/2026",
  },
  {
    id: "act-abj-001", moduleId: "actions", date: "28/05/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Réviser plan de circulation engins", category: "Action corrective",
    owner: "A. Kouadio", status: "En cours", priority: "Critique", dueDate: "07/06/2026",
  },
  {
    id: "per-abj-001", moduleId: "permits", date: "03/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Travaux bitumage voie rapide N1", category: "Travaux a chaud",
    owner: "S. Traore", status: "Valide", priority: "Haute", dueDate: "03/06/2026",
  },
  {
    id: "ppe-abj-001", moduleId: "ppe", date: "01/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Gilets haute visibilité — stock critique", category: "Visibilite",
    owner: "A. Kouadio", status: "Ouvert", priority: "Haute", dueDate: "08/06/2026",
  },
  {
    id: "ins-abj-002", moduleId: "inspections", date: "27/05/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Audit équipements levage — conformité", category: "Audit",
    owner: "A. Kouadio", status: "A corriger", priority: "Critique", dueDate: "05/06/2026",
  },

  // ── PRJ-ABJ-002 (Tour Plateau Finance) — records supplémentaires ──
  {
    id: "evt-abj-002", moduleId: "events", date: "04/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance",
    entity: "Site Abidjan", label: "Chute objet hauteur — zone coffrage", category: "Accident",
    owner: "A. Kouadio", status: "En cours", priority: "Critique", dueDate: "09/06/2026",
  },
  {
    id: "ins-abj-003", moduleId: "inspections", date: "02/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance",
    entity: "Site Abidjan", label: "Inspection échafaudages façade Nord", category: "Inspection",
    owner: "A. Kouadio", status: "Clos", priority: "Haute", dueDate: "03/06/2026",
  },
  {
    id: "act-abj-002", moduleId: "actions", date: "01/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance",
    entity: "Site Abidjan", label: "Installer filets anti-chute niveaux 10-14", category: "Action corrective",
    owner: "A. Kouadio", status: "Ouvert", priority: "Critique", dueDate: "10/06/2026",
  },
  {
    id: "act-abj-003", moduleId: "actions", date: "30/05/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance",
    entity: "Site Abidjan", label: "Formation travail en hauteur — 15 ouvriers", category: "Action preventive",
    owner: "A. Kouadio", status: "Clos", priority: "Haute", dueDate: "02/06/2026",
  },

  // ── PRJ-BKE-001 (RN3 Bouake) — records supplémentaires ──
  {
    id: "per-bke-001", moduleId: "permits", date: "04/06/2026",
    site: "Bouake", projectId: "PRJ-BKE-001", projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake", label: "Dynamitage talus km 34", category: "Travaux a chaud",
    owner: "M. Diallo", status: "Valide", priority: "Critique", dueDate: "04/06/2026",
  },
  {
    id: "ins-bke-001", moduleId: "inspections", date: "01/06/2026",
    site: "Bouake", projectId: "PRJ-BKE-001", projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake", label: "Audit protections routiers km 18-34", category: "Audit",
    owner: "S. Traore", status: "A corriger", priority: "Haute", dueDate: "07/06/2026",
  },
  {
    id: "ppe-bke-001", moduleId: "ppe", date: "02/06/2026",
    site: "Bouake", projectId: "PRJ-BKE-001", projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake", label: "Casques et chaussures sécurité — renouvellement", category: "Protection tete",
    owner: "M. Diallo", status: "Clos", priority: "Normale", dueDate: "04/06/2026",
  },
  {
    id: "act-bke-001", moduleId: "actions", date: "03/06/2026",
    site: "Bouake", projectId: "PRJ-BKE-001", projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake", label: "Mettre à jour plan de gestion trafic", category: "Action corrective",
    owner: "S. Traore", status: "En cours", priority: "Haute", dueDate: "10/06/2026",
  },

  // ── PRJ-BKE-002 (Carrière Granite) — records supplémentaires ──
  {
    id: "evt-bke-002", moduleId: "events", date: "01/06/2026",
    site: "Bouake", projectId: "PRJ-BKE-002", projectName: "Carriere Granite BKE Nord",
    entity: "Site Bouake", label: "Projection éclats lors tir de mine", category: "Presqu'accident",
    owner: "S. Traore", status: "En cours", priority: "Critique", dueDate: "06/06/2026",
  },
  {
    id: "ins-bke-002", moduleId: "inspections", date: "30/05/2026",
    site: "Bouake", projectId: "PRJ-BKE-002", projectName: "Carriere Granite BKE Nord",
    entity: "Site Bouake", label: "Inspection poussières et bruit carrière", category: "Inspection",
    owner: "M. Diallo", status: "Clos", priority: "Haute", dueDate: "02/06/2026",
  },
  {
    id: "act-bke-002", moduleId: "actions", date: "31/05/2026",
    site: "Bouake", projectId: "PRJ-BKE-002", projectName: "Carriere Granite BKE Nord",
    entity: "Site Bouake", label: "Réduire périmètre de sécurité tirs de mine", category: "Action corrective",
    owner: "S. Traore", status: "Ouvert", priority: "Critique", dueDate: "08/06/2026",
  },
  {
    id: "ind-bke-002", moduleId: "indicators", date: "31/05/2026",
    site: "Bouake", projectId: "PRJ-BKE-002", projectName: "Carriere Granite BKE Nord",
    entity: "Site Bouake", label: "Reporting mai — données complètes", category: "Indicateurs mensuels",
    owner: "M. Diallo", status: "Valide", priority: "Normale", dueDate: "03/06/2026",
  },

  // ── PRJ-SPD-001 (Terminal Vraquiers) — records supplémentaires ──
  {
    id: "evt-spd-001", moduleId: "events", date: "03/06/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Glissade quai — absence antidérapant", category: "Incident",
    owner: "N. Kone", status: "Ouvert", priority: "Haute", dueDate: "07/06/2026",
  },
  {
    id: "ind-spd-001", moduleId: "indicators", date: "31/05/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Reporting mensuel mai", category: "Indicateurs mensuels",
    owner: "N. Kone", status: "Valide", priority: "Normale", dueDate: "03/06/2026",
  },
  {
    id: "per-spd-001", moduleId: "permits", date: "02/06/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Intervention soudure sous-structure quai", category: "Travaux a chaud",
    owner: "N. Kone", status: "A corriger", priority: "Critique", dueDate: "05/06/2026",
  },
  {
    id: "act-spd-001", moduleId: "actions", date: "04/06/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Installer revêtement antidérapant quais 2-4", category: "Action corrective",
    owner: "N. Kone", status: "En cours", priority: "Haute", dueDate: "12/06/2026",
  },

  // ── PRJ-YMK-001 (Rehab Yamoussoukro) — records supplémentaires ──
  {
    id: "evt-ymk-001", moduleId: "events", date: "02/06/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Blessure légère outillage — main", category: "Accident",
    owner: "M. Diallo", status: "Clos", priority: "Normale", dueDate: "04/06/2026",
  },
  {
    id: "act-ymk-001", moduleId: "actions", date: "31/05/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Afficher consignes sécurité zones réhab.", category: "Action preventive",
    owner: "M. Diallo", status: "Clos", priority: "Normale", dueDate: "03/06/2026",
  },
  {
    id: "ppe-ymk-001", moduleId: "ppe", date: "03/06/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Lunettes protection poussière — commande", category: "Protection yeux",
    owner: "M. Diallo", status: "En cours", priority: "Haute", dueDate: "09/06/2026",
  },
  {
    id: "ind-ymk-001", moduleId: "indicators", date: "31/05/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Reporting mai — données complètes", category: "Indicateurs mensuels",
    owner: "M. Diallo", status: "Valide", priority: "Normale", dueDate: "03/06/2026",
  },
  {
    id: "per-ymk-001", moduleId: "permits", date: "04/06/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Intervention réseau électrique voirie", category: "Electrique",
    owner: "M. Diallo", status: "Valide", priority: "Haute", dueDate: "04/06/2026",
  },

  // ── Environnement ──────────────────────────────────────────────────
  {
    id: "env-001", moduleId: "environment", date: "03/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Pollution sol zone bitumage — mesures correctives", category: "Sol",
    owner: "A. Kouadio", status: "En cours", priority: "Haute", dueDate: "07/06/2026",
  },
  {
    id: "env-002", moduleId: "environment", date: "31/05/2026",
    site: "Bouake", projectId: "PRJ-BKE-002", projectName: "Carriere Granite BKE Nord",
    entity: "Site Bouake", label: "Gestion déchets solides carrière — non-conforme", category: "Dechets",
    owner: "S. Traore", status: "A corriger", priority: "Haute", dueDate: "04/06/2026",
  },
  {
    id: "env-003", moduleId: "environment", date: "04/06/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Risque déversement hydrocarbures quai 3", category: "Eau",
    owner: "N. Kone", status: "Ouvert", priority: "Critique", dueDate: "06/06/2026",
  },
  {
    id: "env-004", moduleId: "environment", date: "28/05/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Revue trimestrielle ISO 14001 — validée", category: "Systeme",
    owner: "M. Diallo", status: "Valide", priority: "Normale", dueDate: "02/06/2026",
  },

  // ── Formations & Habilitations ─────────────────────────────────────
  {
    id: "trn-001", moduleId: "training", date: "01/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance",
    entity: "Site Abidjan", label: "Habilitation électrique H1B1 — expiration imminente", category: "Electrique",
    owner: "A. Kouadio", status: "Ouvert", priority: "Haute", dueDate: "08/06/2026",
  },
  {
    id: "trn-002", moduleId: "training", date: "28/05/2026",
    site: "Bouake", projectId: "PRJ-BKE-001", projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake", label: "CACES R482 — recyclage obligatoire en retard", category: "Conduite engins",
    owner: "M. Diallo", status: "En cours", priority: "Critique", dueDate: "05/06/2026",
  },
  {
    id: "trn-003", moduleId: "training", date: "02/06/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Formation gestes urgence — 8 secouristes planifiés", category: "Secourisme",
    owner: "N. Kone", status: "Ouvert", priority: "Normale", dueDate: "12/06/2026",
  },
  {
    id: "trn-004", moduleId: "training", date: "30/05/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Formation travail en hauteur — recyclage validé", category: "Travail en hauteur",
    owner: "M. Diallo", status: "Valide", priority: "Haute", dueDate: "03/06/2026",
  },

  // ── Causeries ──────────────────────────────────────────────────────
  {
    id: "cau-001", moduleId: "causeries", date: "02/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Causerie risques levage — mai 2026", category: "Levage",
    owner: "A. Kouadio", status: "Valide", priority: "Normale", dueDate: "02/06/2026",
  },
  {
    id: "cau-002", moduleId: "causeries", date: "04/06/2026",
    site: "Bouake", projectId: "PRJ-BKE-001", projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake", label: "Toolbox talk circulation engins — km 18-34", category: "Circulation",
    owner: "S. Traore", status: "Valide", priority: "Normale", dueDate: "04/06/2026",
  },
  {
    id: "cau-003", moduleId: "causeries", date: "03/06/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Causerie noyade et travaux maritimes", category: "Travaux maritimes",
    owner: "N. Kone", status: "En cours", priority: "Normale", dueDate: "07/06/2026",
  },
  {
    id: "cau-004", moduleId: "causeries", date: "01/06/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Briefing sécurité réhabilitation voirie", category: "Securite generale",
    owner: "M. Diallo", status: "Valide", priority: "Normale", dueDate: "03/06/2026",
  },

  // ── DUERP ──────────────────────────────────────────────────────────
  {
    id: "duerp-001", moduleId: "duerp", date: "01/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Risque chute hauteur échafaudages — criticité 60", category: "Travail en hauteur",
    owner: "A. Kouadio", status: "Ouvert", priority: "Critique", dueDate: "06/06/2026",
  },
  {
    id: "duerp-002", moduleId: "duerp", date: "02/06/2026",
    site: "Bouake", projectId: "PRJ-BKE-002", projectName: "Carriere Granite BKE Nord",
    entity: "Site Bouake", label: "Risque électrique tableaux HT — criticité 54", category: "Electrique",
    owner: "S. Traore", status: "En cours", priority: "Critique", dueDate: "07/06/2026",
  },
  {
    id: "duerp-003", moduleId: "duerp", date: "30/05/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Risque chimique stockage produits — mesures requises", category: "Chimique",
    owner: "N. Kone", status: "A corriger", priority: "Haute", dueDate: "09/06/2026",
  },
  {
    id: "duerp-004", moduleId: "duerp", date: "28/05/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Risque stress thermique — protocole canicule validé", category: "Thermique",
    owner: "M. Diallo", status: "Valide", priority: "Haute", dueDate: "02/06/2026",
  },

  // ── Médical ────────────────────────────────────────────────────────
  {
    id: "med-001", moduleId: "medical", date: "01/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance",
    entity: "Site Abidjan", label: "Visite médicale périodique — A. Bamba en retard", category: "Visite periodique",
    owner: "A. Kouadio", status: "Ouvert", priority: "Haute", dueDate: "07/06/2026",
  },
  {
    id: "med-002", moduleId: "medical", date: "28/05/2026",
    site: "Bouake", projectId: "PRJ-BKE-002", projectName: "Carriere Granite BKE Nord",
    entity: "Site Bouake", label: "Aptitude conducteur engin — renouvellement dépassé", category: "Aptitude",
    owner: "S. Traore", status: "En cours", priority: "Haute", dueDate: "04/06/2026",
  },
  {
    id: "med-003", moduleId: "medical", date: "03/06/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Bilan médical annuel — groupe exposé chimique", category: "Bilan annuel",
    owner: "N. Kone", status: "Ouvert", priority: "Normale", dueDate: "14/06/2026",
  },
  {
    id: "med-004", moduleId: "medical", date: "30/05/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Visite médicale validée — M. Diallo apte", category: "Visite periodique",
    owner: "M. Diallo", status: "Valide", priority: "Normale", dueDate: "02/06/2026",
  },

  // ── ACR ────────────────────────────────────────────────────────────
  {
    id: "acr-001", moduleId: "acr", date: "01/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "ACR-003 incident levage — 5 pourquoi en cours", category: "5 pourquoi",
    owner: "A. Kouadio", status: "En cours", priority: "Haute", dueDate: "08/06/2026",
  },
  {
    id: "acr-002", moduleId: "acr", date: "28/05/2026",
    site: "Bouake", projectId: "PRJ-BKE-001", projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake", label: "ACR-004 malaise thermique — arbre des causes", category: "Arbre des causes",
    owner: "M. Diallo", status: "Ouvert", priority: "Critique", dueDate: "07/06/2026",
  },
  {
    id: "acr-003", moduleId: "acr", date: "25/05/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "ACR-001 glissade quai — RETEX diffusé", category: "RETEX",
    owner: "N. Kone", status: "Valide", priority: "Normale", dueDate: "02/06/2026",
  },

  // ── Consommations ──────────────────────────────────────────────────
  {
    id: "cso-001", moduleId: "consumption", date: "04/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Dépassement consommation eau — 3 mois consécutifs", category: "Eau",
    owner: "A. Kouadio", status: "Ouvert", priority: "Haute", dueDate: "08/06/2026",
  },
  {
    id: "cso-002", moduleId: "consumption", date: "31/05/2026",
    site: "Bouake", projectId: "PRJ-BKE-002", projectName: "Carriere Granite BKE Nord",
    entity: "Site Bouake", label: "Dépassement carburant engins — mai 2026", category: "Carburant",
    owner: "S. Traore", status: "A corriger", priority: "Haute", dueDate: "04/06/2026",
  },
  {
    id: "cso-003", moduleId: "consumption", date: "02/06/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Suivi mensuel déchets mai — conforme", category: "Dechets",
    owner: "N. Kone", status: "Valide", priority: "Normale", dueDate: "03/06/2026",
  },
  {
    id: "cso-004", moduleId: "consumption", date: "01/06/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Bilan CO2 mensuel mai — dans objectif", category: "CO2",
    owner: "M. Diallo", status: "Valide", priority: "Normale", dueDate: "03/06/2026",
  },

  // ── Planification HSE ──────────────────────────────────────────────
  {
    id: "pln-001", moduleId: "planification", date: "20/05/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-001", projectName: "Autoroute Abidjan-Bassam",
    entity: "Site Abidjan", label: "Audit sous-traitants Q2 — en retard de 15 jours", category: "Audit",
    owner: "A. Kouadio", status: "Ouvert", priority: "Haute", dueDate: "03/06/2026",
  },
  {
    id: "pln-002", moduleId: "planification", date: "01/06/2026",
    site: "Bouake", projectId: "PRJ-BKE-001", projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake", label: "Exercice incendie planifié Q2 — en cours", category: "Exercice",
    owner: "S. Traore", status: "En cours", priority: "Normale", dueDate: "09/06/2026",
  },
  {
    id: "pln-003", moduleId: "planification", date: "28/05/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Formation grue portuaire — réalisée", category: "Formation",
    owner: "N. Kone", status: "Valide", priority: "Haute", dueDate: "03/06/2026",
  },
  {
    id: "pln-004", moduleId: "planification", date: "02/06/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Revue direction HSE trimestrielle — à compléter", category: "Revue direction",
    owner: "M. Diallo", status: "A corriger", priority: "Critique", dueDate: "06/06/2026",
  },

  // ── VBG ────────────────────────────────────────────────────────────
  {
    id: "vbg-001", moduleId: "vbg", date: "03/06/2026",
    site: "Abidjan", projectId: "PRJ-ABJ-002", projectName: "Tour Plateau Finance",
    entity: "Site Abidjan", label: "Signature code de conduite — 3 nouveaux arrivants", category: "Code de conduite",
    owner: "A. Kouadio", status: "En cours", priority: "Haute", dueDate: "07/06/2026",
  },
  {
    id: "vbg-002", moduleId: "vbg", date: "01/06/2026",
    site: "Yamoussoukro", projectId: "PRJ-YMK-001", projectName: "Rehab. Infrastructures YMK",
    entity: "Site Yamoussoukro", label: "Investigation cas VBG-YMK-003 — délai WB approche", category: "Investigation",
    owner: "M. Diallo", status: "Ouvert", priority: "Critique", dueDate: "08/06/2026",
  },
  {
    id: "vbg-003", moduleId: "vbg", date: "04/06/2026",
    site: "Bouake", projectId: "PRJ-BKE-001", projectName: "RN3 Bouake-Katiola",
    entity: "Site Bouake", label: "Formation sensibilisation VBG — 24 ouvriers", category: "Formation",
    owner: "S. Traore", status: "Valide", priority: "Normale", dueDate: "04/06/2026",
  },
  {
    id: "vbg-004", moduleId: "vbg", date: "02/06/2026",
    site: "San Pedro", projectId: "PRJ-SPD-001", projectName: "Terminal Vraquiers SP",
    entity: "Projet San Pedro", label: "Rapport mensuel mécanisme signalement — conforme", category: "Reporting",
    owner: "N. Kone", status: "Valide", priority: "Haute", dueDate: "03/06/2026",
  },
];

// Enrich seed records with tenantId derived from their projectId
export const moduleRecords: ModuleRecord[] = seedRecords.map((r) => ({
  ...r,
  tenantId: tenantIdForProjectId(r.projectId) ?? "acme-btp",
}));

export function getModuleRecords(moduleId: string): ModuleRecord[] {
  return moduleRecords.filter((r) => r.moduleId === moduleId);
}

export function getRecordsByProject(projectId: string): ModuleRecord[] {
  return moduleRecords.filter((r) => r.projectId === projectId);
}

export function getRecordsByCity(city: string): ModuleRecord[] {
  return moduleRecords.filter((r) => r.site === city);
}
