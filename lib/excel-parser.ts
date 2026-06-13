import * as XLSX from "xlsx";

export type ParsedRow = Record<string, string | number | boolean | null>;

export type ParseResult = {
  rows: ParsedRow[];
  errors: { row: number; field: string; message: string }[];
  acceptedRows: number;
  rejectedRows: number;
};

const MODULE_SCHEMAS: Record<string, { key: string; label: string; required: boolean; type: "string" | "number" | "date" }[]> = {
  events: [
    { key: "date",            label: "Date",                required: true,  type: "date"   },
    { key: "site",            label: "Site",                required: true,  type: "string" },
    { key: "type_evenement",  label: "Type evenement",      required: true,  type: "string" },
    { key: "description",     label: "Description",         required: true,  type: "string" },
    { key: "gravite",         label: "Gravite",             required: false, type: "string" },
    { key: "statut",          label: "Statut",              required: false, type: "string" },
    { key: "responsable",     label: "Responsable",         required: false, type: "string" },
  ],
  inspections: [
    { key: "date",            label: "Date",                required: true,  type: "date"   },
    { key: "site",            label: "Site",                required: true,  type: "string" },
    { key: "type_controle",   label: "Type controle",       required: true,  type: "string" },
    { key: "theme",           label: "Theme",               required: false, type: "string" },
    { key: "conformite",      label: "Conformite",          required: true,  type: "string" },
    { key: "ecart",           label: "Ecart",               required: false, type: "string" },
    { key: "responsable",     label: "Responsable",         required: false, type: "string" },
  ],
  permits: [
    { key: "date",            label: "Date",                required: true,  type: "date"   },
    { key: "site",            label: "Site",                required: true,  type: "string" },
    { key: "type_permis",     label: "Type permis",         required: true,  type: "string" },
    { key: "zone",            label: "Zone",                required: true,  type: "string" },
    { key: "responsable",     label: "Responsable",         required: true,  type: "string" },
    { key: "validation_hse",  label: "Validation HSE",      required: true,  type: "string" },
    { key: "statut",          label: "Statut",              required: false, type: "string" },
  ],
  actions: [
    { key: "date",            label: "Date",                required: true,  type: "date"   },
    { key: "site",            label: "Site",                required: true,  type: "string" },
    { key: "action",          label: "Action",              required: true,  type: "string" },
    { key: "origine",         label: "Origine",             required: false, type: "string" },
    { key: "responsable",     label: "Responsable",         required: true,  type: "string" },
    { key: "echeance",        label: "Echeance",            required: true,  type: "date"   },
    { key: "statut",          label: "Statut",              required: false, type: "string" },
    { key: "priorite",        label: "Priorite",            required: false, type: "string" },
  ],
  indicators: [
    { key: "mois",                   label: "Mois",                    required: true,  type: "string" },
    { key: "site",                   label: "Site",                    required: true,  type: "string" },
    { key: "heures_travaillees",     label: "Heures travaillees",      required: true,  type: "number" },
    { key: "accidents_avec_arret",   label: "Accidents avec arret",    required: true,  type: "number" },
    { key: "jours_perdus",           label: "Jours perdus",            required: true,  type: "number" },
    { key: "causeries",              label: "Causeries",               required: false, type: "number" },
    { key: "formations",             label: "Formations",              required: false, type: "number" },
  ],
  ppe: [
    { key: "reference",           label: "Reference",            required: true,  type: "string" },
    { key: "designation",         label: "Designation",          required: true,  type: "string" },
    { key: "categorie",           label: "Categorie",            required: true,  type: "string" },
    { key: "quantite_stock",      label: "Quantite stock",       required: true,  type: "number" },
    { key: "quantite_attribuee",  label: "Quantite attribuee",   required: false, type: "number" },
    { key: "quantite_disponible", label: "Quantite disponible",  required: false, type: "number" },
    { key: "date_expiration",     label: "Date expiration",      required: false, type: "date"   },
    { key: "fournisseur",         label: "Fournisseur",          required: false, type: "string" },
    { key: "date_achat",          label: "Date achat",           required: false, type: "date"   },
  ],
  environment: [
    { key: "code_projet",            label: "Code projet",          required: true,  type: "string" },
    { key: "projet",                label: "Projet",               required: true,  type: "string" },
    { key: "type_travaux",          label: "Type travaux",         required: false, type: "string" },
    { key: "phase",                 label: "Phase",                required: true,  type: "string" },
    { key: "impact",                label: "Impact",               required: true,  type: "string" },
    { key: "milieu_affecte",        label: "Milieu affecte",       required: true,  type: "string" },
    { key: "intensite",             label: "Intensite (1-3)",      required: true,  type: "number" },
    { key: "portee",                label: "Portee (1-3)",         required: true,  type: "number" },
    { key: "duree",                 label: "Duree (1-3)",          required: true,  type: "number" },
    { key: "mesures_attenuation",   label: "Mesures attenuation",  required: false, type: "string" },
    { key: "responsable",           label: "Responsable",          required: false, type: "string" },
    { key: "statut",                label: "Statut",               required: false, type: "string" },
  ],
  training: [
    { key: "nom",             label: "Nom",                          required: true,  type: "string" },
    { key: "prenom",          label: "Prenom",                       required: true,  type: "string" },
    { key: "matricule",       label: "Matricule",                    required: true,  type: "string" },
    { key: "poste",           label: "Poste",                        required: true,  type: "string" },
    { key: "site",            label: "Site",                         required: true,  type: "string" },
    { key: "type",            label: "Type",                         required: true,  type: "string" },
    { key: "titre",           label: "Titre formation/habilitation", required: true,  type: "string" },
    { key: "organisme",       label: "Organisme formateur",          required: true,  type: "string" },
    { key: "date_formation",  label: "Date de formation",            required: true,  type: "date"   },
    { key: "date_expiration", label: "Date d'expiration",            required: false, type: "date"   },
    { key: "document_ref",    label: "Reference document",           required: false, type: "string" },
    { key: "statut",          label: "Statut",                       required: true,  type: "string" },
  ],
  causeries: [
    { key: "date",            label: "Date",            required: true,  type: "date"   },
    { key: "site",            label: "Site",            required: true,  type: "string" },
    { key: "animateur",       label: "Animateur",       required: true,  type: "string" },
    { key: "theme",           label: "Theme",           required: true,  type: "string" },
    { key: "type",            label: "Type",            required: true,  type: "string" },
    { key: "duree_minutes",   label: "Duree (minutes)", required: true,  type: "number" },
    { key: "nb_participants", label: "Nb participants", required: true,  type: "number" },
    { key: "nb_prevus",       label: "Nb prevus",       required: true,  type: "number" },
    { key: "observations",    label: "Observations",    required: false, type: "string" },
  ],
  duerp: [
    { key: "site",              label: "Site",                 required: true,  type: "string" },
    { key: "unite_travail",     label: "Unite de travail",     required: true,  type: "string" },
    { key: "activite",          label: "Activite",             required: true,  type: "string" },
    { key: "danger",            label: "Danger",               required: true,  type: "string" },
    { key: "risque",            label: "Risque",               required: true,  type: "string" },
    { key: "frequence",         label: "Frequence (1-5)",      required: true,  type: "number" },
    { key: "gravite",           label: "Gravite (1-5)",        required: true,  type: "number" },
    { key: "probabilite",       label: "Probabilite (1-5)",    required: true,  type: "number" },
    { key: "mesures_existantes",label: "Mesures existantes",   required: false, type: "string" },
    { key: "mesures_prevues",   label: "Mesures prevues",      required: false, type: "string" },
    { key: "responsable",       label: "Responsable",          required: true,  type: "string" },
    { key: "echeance",          label: "Echeance",             required: true,  type: "date"   },
    { key: "statut",            label: "Statut",               required: true,  type: "string" },
  ],
  medical: [
    { key: "nom",            label: "Nom",                    required: true,  type: "string" },
    { key: "prenom",         label: "Prenom",                 required: true,  type: "string" },
    { key: "matricule",      label: "Matricule",              required: true,  type: "string" },
    { key: "poste",          label: "Poste",                  required: true,  type: "string" },
    { key: "site",           label: "Site",                   required: true,  type: "string" },
    { key: "type_visite",    label: "Type visite",            required: true,  type: "string" },
    { key: "date_visite",    label: "Date de visite",         required: true,  type: "date"   },
    { key: "date_prochaine", label: "Date prochaine visite",  required: true,  type: "date"   },
    { key: "medecin",        label: "Medecin",                required: false, type: "string" },
    { key: "aptitude",       label: "Aptitude",               required: true,  type: "string" },
    { key: "restrictions",   label: "Restrictions medicales", required: false, type: "string" },
    { key: "observations",   label: "Observations",           required: false, type: "string" },
  ],
  acr: [
    { key: "evenement_ref",     label: "Reference evenement",  required: true,  type: "string" },
    { key: "date_evenement",    label: "Date evenement",       required: true,  type: "date"   },
    { key: "site",              label: "Site",                 required: true,  type: "string" },
    { key: "type_evenement",    label: "Type evenement",       required: true,  type: "string" },
    { key: "description",       label: "Description",          required: true,  type: "string" },
    { key: "methode",           label: "Methode ACR",          required: true,  type: "string" },
    { key: "causes_immediates", label: "Causes immediates",    required: true,  type: "string" },
    { key: "causes_profondes",  label: "Causes profondes",     required: false, type: "string" },
    { key: "responsable",       label: "Responsable analyse",  required: true,  type: "string" },
    { key: "date_analyse",      label: "Date analyse",         required: true,  type: "date"   },
    { key: "lecons_apprises",   label: "Lecons apprises",      required: false, type: "string" },
    { key: "statut",            label: "Statut",               required: true,  type: "string" },
  ],
  consumption: [
    { key: "mois",                 label: "Mois (AAAA-MM)",        required: true,  type: "string" },
    { key: "site",                 label: "Site",                  required: true,  type: "string" },
    { key: "eau_m3",               label: "Eau (m3)",              required: true,  type: "number" },
    { key: "electricite_kwh",      label: "Electricite (kWh)",     required: true,  type: "number" },
    { key: "carburant_litres",     label: "Carburant (litres)",    required: true,  type: "number" },
    { key: "dechets_tonnes",       label: "Dechets inertes (t)",   required: false, type: "number" },
    { key: "dechets_dangereux_kg", label: "Dechets dangereux (kg)",required: false, type: "number" },
    { key: "co2_tonnes",           label: "CO2 emis (tonnes)",     required: false, type: "number" },
    { key: "objectif_eau",         label: "Objectif eau (m3)",     required: false, type: "number" },
    { key: "objectif_electricite", label: "Objectif elec (kWh)",   required: false, type: "number" },
    { key: "objectif_carburant",   label: "Objectif carb (L)",     required: false, type: "number" },
  ],
  planification: [
    { key: "trimestre",   label: "Trimestre",       required: true,  type: "string" },
    { key: "mois",        label: "Mois",            required: true,  type: "string" },
    { key: "categorie",   label: "Categorie",       required: true,  type: "string" },
    { key: "activite",    label: "Activite",        required: true,  type: "string" },
    { key: "responsable", label: "Responsable",     required: true,  type: "string" },
    { key: "site",        label: "Site",            required: true,  type: "string" },
    { key: "budget_fcfa", label: "Budget (FCFA)",   required: true,  type: "number" },
    { key: "statut",      label: "Statut",          required: true,  type: "string" },
    { key: "commentaire", label: "Commentaire",     required: false, type: "string" },
  ],
  vbg: [
    { key: "reference",        label: "Reference (anonymisee)",       required: true,  type: "string" },
    { key: "date",             label: "Date de l'incident",           required: true,  type: "date"   },
    { key: "site",             label: "Site",                          required: true,  type: "string" },
    { key: "type_vbg",         label: "Type VBG",                     required: true,  type: "string" },
    { key: "auteur_allegue",   label: "Auteur allegue",               required: true,  type: "string" },
    { key: "gravite",          label: "Gravite",                      required: true,  type: "string" },
    { key: "statut",           label: "Statut",                       required: true,  type: "string" },
    { key: "signale_par",      label: "Signale par",                  required: true,  type: "string" },
    { key: "canal_signalement", label: "Canal de signalement",        required: false, type: "string" },
    { key: "delai_resolution", label: "Delai de resolution (jours)",  required: false, type: "number" },
    { key: "mesures_prises",   label: "Mesures prises",               required: false, type: "string" },
    { key: "norme_reference",  label: "Norme de reference",           required: false, type: "string" },
  ],
};

function normalizeKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseExcelDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  return String(value ?? "");
}

export function parseExcelBuffer(buffer: Buffer, moduleId: string): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  const schema = MODULE_SCHEMAS[moduleId];
  const errors: ParseResult["errors"] = [];
  const accepted: ParsedRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const normalized: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(raw)) {
      normalized[normalizeKey(k)] = v;
    }

    let rowValid = true;
    const mapped: ParsedRow = {};

    if (schema) {
      for (const field of schema) {
        const val = normalized[field.key] ?? normalized[normalizeKey(field.label)];

        if (field.required && (val === null || val === undefined || val === "")) {
          errors.push({ row: i + 2, field: field.label, message: `Champ obligatoire manquant` });
          rowValid = false;
          continue;
        }

        if (val === null || val === undefined || val === "") {
          mapped[field.key] = null;
          continue;
        }

        if (field.type === "number") {
          const n = Number(val);
          if (isNaN(n)) {
            errors.push({ row: i + 2, field: field.label, message: `Valeur numerique attendue, recu: ${val}` });
            rowValid = false;
          } else {
            mapped[field.key] = n;
          }
        } else if (field.type === "date") {
          mapped[field.key] = parseExcelDate(val);
        } else {
          mapped[field.key] = String(val);
        }
      }
    } else {
      for (const [k, v] of Object.entries(normalized)) {
        mapped[k] = v as string | number | null;
      }
    }

    if (rowValid) {
      accepted.push(mapped);
    }
  }

  return {
    rows: accepted,
    errors,
    acceptedRows: accepted.length,
    rejectedRows: rawRows.length - accepted.length,
  };
}
