export type MonthlyRow = {
  mois: string;
  heures: number;
  accidents: number;
  jours: number;
  causeries: number;
  formations: number;
};

export type MonthlyRowSite = MonthlyRow & { site: string };

export const MONTHLY_DATA: MonthlyRow[] = [
  { mois: "Jan",  heures: 158000, accidents: 4, jours: 31, causeries: 22, formations: 5 },
  { mois: "Fev",  heures: 149000, accidents: 3, jours: 28, causeries: 19, formations: 4 },
  { mois: "Mar",  heures: 162000, accidents: 4, jours: 34, causeries: 25, formations: 6 },
  { mois: "Avr",  heures: 155000, accidents: 3, jours: 27, causeries: 21, formations: 4 },
  { mois: "Mai",  heures: 171000, accidents: 4, jours: 29, causeries: 28, formations: 7 },
  { mois: "Juin", heures: 143000, accidents: 2, jours: 21, causeries: 16, formations: 3 },
];

export const MONTH_ISO: Record<string, string> = {
  "Jan":"2026-01","Fev":"2026-02","Mar":"2026-03",
  "Avr":"2026-04","Mai":"2026-05","Juin":"2026-06",
  "Juil":"2026-07","Aout":"2026-08","Sep":"2026-09",
  "Oct":"2026-10","Nov":"2026-11","Dec":"2026-12",
};

export const MONTHLY_DATA_BY_SITE: MonthlyRowSite[] = [
  { mois:"Jan",  site:"Abidjan",      heures:63200,  accidents:2, jours:12, causeries:9,  formations:2 },
  { mois:"Fev",  site:"Abidjan",      heures:59600,  accidents:1, jours:11, causeries:8,  formations:2 },
  { mois:"Mar",  site:"Abidjan",      heures:64800,  accidents:2, jours:14, causeries:10, formations:2 },
  { mois:"Avr",  site:"Abidjan",      heures:62000,  accidents:1, jours:11, causeries:8,  formations:2 },
  { mois:"Mai",  site:"Abidjan",      heures:68400,  accidents:2, jours:12, causeries:11, formations:3 },
  { mois:"Juin", site:"Abidjan",      heures:57200,  accidents:1, jours:8,  causeries:6,  formations:1 },
  { mois:"Jan",  site:"Bouake",       heures:39500,  accidents:1, jours:10, causeries:6,  formations:1 },
  { mois:"Fev",  site:"Bouake",       heures:37250,  accidents:1, jours:9,  causeries:5,  formations:1 },
  { mois:"Mar",  site:"Bouake",       heures:40500,  accidents:1, jours:11, causeries:6,  formations:2 },
  { mois:"Avr",  site:"Bouake",       heures:38750,  accidents:1, jours:8,  causeries:5,  formations:1 },
  { mois:"Mai",  site:"Bouake",       heures:42750,  accidents:1, jours:9,  causeries:7,  formations:2 },
  { mois:"Juin", site:"Bouake",       heures:35750,  accidents:1, jours:7,  causeries:5,  formations:1 },
  { mois:"Jan",  site:"San Pedro",    heures:31600,  accidents:1, jours:6,  causeries:4,  formations:1 },
  { mois:"Fev",  site:"San Pedro",    heures:29800,  accidents:1, jours:6,  causeries:4,  formations:1 },
  { mois:"Mar",  site:"San Pedro",    heures:32400,  accidents:1, jours:6,  causeries:5,  formations:1 },
  { mois:"Avr",  site:"San Pedro",    heures:31000,  accidents:1, jours:5,  causeries:5,  formations:1 },
  { mois:"Mai",  site:"San Pedro",    heures:34200,  accidents:1, jours:5,  causeries:6,  formations:1 },
  { mois:"Juin", site:"San Pedro",    heures:28600,  accidents:0, jours:4,  causeries:3,  formations:1 },
  { mois:"Jan",  site:"Yamoussoukro", heures:23700,  accidents:0, jours:3,  causeries:3,  formations:1 },
  { mois:"Fev",  site:"Yamoussoukro", heures:22350,  accidents:0, jours:2,  causeries:2,  formations:0 },
  { mois:"Mar",  site:"Yamoussoukro", heures:24300,  accidents:0, jours:3,  causeries:4,  formations:1 },
  { mois:"Avr",  site:"Yamoussoukro", heures:23250,  accidents:0, jours:3,  causeries:3,  formations:0 },
  { mois:"Mai",  site:"Yamoussoukro", heures:25650,  accidents:0, jours:3,  causeries:4,  formations:1 },
  { mois:"Juin", site:"Yamoussoukro", heures:21450,  accidents:0, jours:2,  causeries:2,  formations:0 },
];

export function calcTF(accidents: number, heures: number): number {
  if (!heures) return 0;
  return Math.round((accidents * 1_000_000) / heures * 10) / 10;
}

export function calcTG(jours: number, heures: number): number {
  if (!heures) return 0;
  return Math.round((jours * 1_000) / heures * 100) / 100;
}

// TF/TG mensuels consolidés — cohérents avec module-dashboard-data indicators.trend
export const TFTG_BY_MONTH: { mois: string; tf: number; tg: number }[] = [
  { mois: "Jan",  tf: 2.9, tg: 0.21 },
  { mois: "Fev",  tf: 2.7, tg: 0.20 },
  { mois: "Mar",  tf: 2.8, tg: 0.23 },
  { mois: "Avr",  tf: 2.5, tg: 0.19 },
  { mois: "Mai",  tf: 2.4, tg: 0.18 },
  { mois: "Juin", tf: 2.2, tg: 0.16 },
];
