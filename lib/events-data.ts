import type { ModuleRecord } from "./module-records-data";

export type EventRow = {
  type:    "Accident" | "Incident" | "Presqu'accident";
  gravite: "Critique" | "Elevee" | "Moyenne" | "Faible";
  site:    string;
  cause:   string;
  mois:    string;
};

export const MOIS_ORDER = ["Jan","Fev","Mar","Avr","Mai","Juin","Juil","Aout","Sep","Oct","Nov","Dec"];

export const EVENTS: EventRow[] = [
  { type:"Accident",        gravite:"Critique", site:"Bouake",       cause:"Levage",      mois:"Jan" },
  { type:"Accident",        gravite:"Elevee",   site:"Abidjan",      cause:"Circulation", mois:"Fev" },
  { type:"Accident",        gravite:"Elevee",   site:"San Pedro",    cause:"Chimique",    mois:"Mar" },
  { type:"Incident",        gravite:"Elevee",   site:"Bouake",       cause:"Levage",      mois:"Jan" },
  { type:"Incident",        gravite:"Moyenne",  site:"Yamoussoukro", cause:"Manutention", mois:"Fev" },
  { type:"Incident",        gravite:"Moyenne",  site:"Abidjan",      cause:"Circulation", mois:"Avr" },
  { type:"Incident",        gravite:"Faible",   site:"San Pedro",    cause:"Electrique",  mois:"Mai" },
  { type:"Incident",        gravite:"Faible",   site:"Bouake",       cause:"Chute",       mois:"Juin" },
  { type:"Presqu'accident", gravite:"Elevee",   site:"Abidjan",      cause:"Levage",      mois:"Jan" },
  { type:"Presqu'accident", gravite:"Elevee",   site:"Bouake",       cause:"Circulation", mois:"Mar" },
  { type:"Presqu'accident", gravite:"Moyenne",  site:"San Pedro",    cause:"Manutention", mois:"Avr" },
  { type:"Presqu'accident", gravite:"Moyenne",  site:"Yamoussoukro", cause:"Electrique",  mois:"Mai" },
  { type:"Presqu'accident", gravite:"Faible",   site:"Abidjan",      cause:"Chute",       mois:"Juin" },
  { type:"Presqu'accident", gravite:"Faible",   site:"Bouake",       cause:"Manutention", mois:"Juin" },
];

export const MONTH_ISO: Record<string, string> = {
  "Jan":"2026-01","Fev":"2026-02","Mar":"2026-03",
  "Avr":"2026-04","Mai":"2026-05","Juin":"2026-06",
  "Juil":"2026-07","Aout":"2026-08","Sep":"2026-09",
  "Oct":"2026-10","Nov":"2026-11","Dec":"2026-12",
};

// ─── Mapping ModuleRecord → EventRow ────────────────────────────────────────

const PRIORITY_TO_GRAVITE: Record<string, EventRow["gravite"]> = {
  Critique: "Critique",
  Haute:    "Elevee",
  Normale:  "Moyenne",
  Basse:    "Faible",
};

const MONTH_FROM_NUM: Record<string, string> = {
  "01":"Jan","02":"Fev","03":"Mar","04":"Avr",
  "05":"Mai","06":"Juin","07":"Juil","08":"Aout",
  "09":"Sep","10":"Oct","11":"Nov","12":"Dec",
};

function extractCause(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("levage"))                                           return "Levage";
  if (l.includes("circulation") || l.includes("engin") || l.includes("véhicule")) return "Circulation";
  if (l.includes("chute") || l.includes("glissade") || l.includes("objet")) return "Chute";
  if (l.includes("chimique") || l.includes("produit") || l.includes("gaz")) return "Chimique";
  if (l.includes("électrique") || l.includes("electrique"))           return "Electrique";
  if (l.includes("manutention") || l.includes("outillage") || l.includes("main")) return "Manutention";
  if (l.includes("mine") || l.includes("tir") || l.includes("éclat")) return "Explosion";
  if (l.includes("feu") || l.includes("incendie") || l.includes("brûlure")) return "Incendie";
  if (l.includes("antidérapant") || l.includes("quai"))               return "Chute";
  return "Autre";
}

export function recordsToEvents(records: ModuleRecord[]): EventRow[] {
  return records
    .filter((r) => (["Accident", "Incident", "Presqu'accident"] as string[]).includes(r.category))
    .map((r) => {
      const parts = r.date.split("/"); // DD/MM/YYYY
      const mois  = MONTH_FROM_NUM[parts[1]] ?? "Jan";
      return {
        type:    r.category as EventRow["type"],
        gravite: PRIORITY_TO_GRAVITE[r.priority] ?? "Moyenne",
        site:    r.site,
        cause:   extractCause(r.label),
        mois,
      };
    });
}

export function getMonthlyEventsTrend(rows: EventRow[] = EVENTS) {
  return MOIS_ORDER.map((mois) => ({
    mois,
    accidents:       rows.filter((e) => e.mois === mois && e.type === "Accident").length,
    incidents:       rows.filter((e) => e.mois === mois && e.type === "Incident").length,
    presquAccidents: rows.filter((e) => e.mois === mois && e.type === "Presqu'accident").length,
  }));
}
