export type ConsommationMensuelle = {
  mois: string;
  site: string;
  eau_m3: number;
  electricite_kwh: number;
  carburant_litres: number;
  dechets_tonnes: number;
  dechets_dangereux_kg: number;
  co2_tonnes: number;
  objectif_eau: number;
  objectif_electricite: number;
  objectif_carburant: number;
};

export const CONSOMMATIONS: ConsommationMensuelle[] = [
  { mois:"2026-01", site:"Abidjan",      eau_m3:1240, electricite_kwh:18500, carburant_litres:4200, dechets_tonnes:8.2,  dechets_dangereux_kg:120, co2_tonnes:11.4, objectif_eau:1200, objectif_electricite:18000, objectif_carburant:4000 },
  { mois:"2026-02", site:"Abidjan",      eau_m3:1180, electricite_kwh:17200, carburant_litres:3980, dechets_tonnes:7.8,  dechets_dangereux_kg:95,  co2_tonnes:10.8, objectif_eau:1200, objectif_electricite:18000, objectif_carburant:4000 },
  { mois:"2026-03", site:"Abidjan",      eau_m3:1320, electricite_kwh:19100, carburant_litres:4350, dechets_tonnes:9.1,  dechets_dangereux_kg:140, co2_tonnes:11.9, objectif_eau:1200, objectif_electricite:18000, objectif_carburant:4000 },
  { mois:"2026-04", site:"Abidjan",      eau_m3:1150, electricite_kwh:17800, carburant_litres:4100, dechets_tonnes:7.5,  dechets_dangereux_kg:88,  co2_tonnes:11.2, objectif_eau:1200, objectif_electricite:18000, objectif_carburant:4000 },
  { mois:"2026-05", site:"Abidjan",      eau_m3:1210, electricite_kwh:18300, carburant_litres:4050, dechets_tonnes:8.0,  dechets_dangereux_kg:110, co2_tonnes:11.1, objectif_eau:1200, objectif_electricite:18000, objectif_carburant:4000 },
  { mois:"2026-01", site:"Bouake",       eau_m3:620,  electricite_kwh:9400,  carburant_litres:2100, dechets_tonnes:4.1,  dechets_dangereux_kg:55,  co2_tonnes:5.7,  objectif_eau:600,  objectif_electricite:9000,  objectif_carburant:2000 },
  { mois:"2026-02", site:"Bouake",       eau_m3:580,  electricite_kwh:8800,  carburant_litres:1950, dechets_tonnes:3.8,  dechets_dangereux_kg:42,  co2_tonnes:5.3,  objectif_eau:600,  objectif_electricite:9000,  objectif_carburant:2000 },
  { mois:"2026-03", site:"Bouake",       eau_m3:640,  electricite_kwh:9600,  carburant_litres:2200, dechets_tonnes:4.5,  dechets_dangereux_kg:60,  co2_tonnes:5.9,  objectif_eau:600,  objectif_electricite:9000,  objectif_carburant:2000 },
  { mois:"2026-04", site:"Bouake",       eau_m3:595,  electricite_kwh:9100,  carburant_litres:2050, dechets_tonnes:4.0,  dechets_dangereux_kg:48,  co2_tonnes:5.6,  objectif_eau:600,  objectif_electricite:9000,  objectif_carburant:2000 },
  { mois:"2026-05", site:"Bouake",       eau_m3:605,  electricite_kwh:9200,  carburant_litres:2000, dechets_tonnes:4.2,  dechets_dangereux_kg:50,  co2_tonnes:5.5,  objectif_eau:600,  objectif_electricite:9000,  objectif_carburant:2000 },
  { mois:"2026-01", site:"Yamoussoukro", eau_m3:410,  electricite_kwh:6200,  carburant_litres:1400, dechets_tonnes:2.8,  dechets_dangereux_kg:30,  co2_tonnes:3.8,  objectif_eau:400,  objectif_electricite:6000,  objectif_carburant:1350 },
  { mois:"2026-02", site:"Yamoussoukro", eau_m3:385,  electricite_kwh:5900,  carburant_litres:1320, dechets_tonnes:2.5,  dechets_dangereux_kg:25,  co2_tonnes:3.6,  objectif_eau:400,  objectif_electricite:6000,  objectif_carburant:1350 },
  { mois:"2026-03", site:"Yamoussoukro", eau_m3:430,  electricite_kwh:6500,  carburant_litres:1480, dechets_tonnes:3.0,  dechets_dangereux_kg:35,  co2_tonnes:4.0,  objectif_eau:400,  objectif_electricite:6000,  objectif_carburant:1350 },
  { mois:"2026-04", site:"Yamoussoukro", eau_m3:400,  electricite_kwh:6100,  carburant_litres:1400, dechets_tonnes:2.7,  dechets_dangereux_kg:28,  co2_tonnes:3.8,  objectif_eau:400,  objectif_electricite:6000,  objectif_carburant:1350 },
  { mois:"2026-05", site:"Yamoussoukro", eau_m3:415,  electricite_kwh:6300,  carburant_litres:1430, dechets_tonnes:2.9,  dechets_dangereux_kg:32,  co2_tonnes:3.9,  objectif_eau:400,  objectif_electricite:6000,  objectif_carburant:1350 },
  { mois:"2026-01", site:"San Pedro",    eau_m3:520,  electricite_kwh:7800,  carburant_litres:1800, dechets_tonnes:3.5,  dechets_dangereux_kg:80,  co2_tonnes:4.9,  objectif_eau:500,  objectif_electricite:7500,  objectif_carburant:1700 },
  { mois:"2026-02", site:"San Pedro",    eau_m3:490,  electricite_kwh:7400,  carburant_litres:1720, dechets_tonnes:3.2,  dechets_dangereux_kg:70,  co2_tonnes:4.7,  objectif_eau:500,  objectif_electricite:7500,  objectif_carburant:1700 },
  { mois:"2026-03", site:"San Pedro",    eau_m3:550,  electricite_kwh:8100,  carburant_litres:1850, dechets_tonnes:3.8,  dechets_dangereux_kg:90,  co2_tonnes:5.0,  objectif_eau:500,  objectif_electricite:7500,  objectif_carburant:1700 },
  { mois:"2026-04", site:"San Pedro",    eau_m3:505,  electricite_kwh:7600,  carburant_litres:1780, dechets_tonnes:3.3,  dechets_dangereux_kg:75,  co2_tonnes:4.8,  objectif_eau:500,  objectif_electricite:7500,  objectif_carburant:1700 },
  { mois:"2026-05", site:"San Pedro",    eau_m3:510,  electricite_kwh:7700,  carburant_litres:1800, dechets_tonnes:3.4,  dechets_dangereux_kg:78,  co2_tonnes:4.9,  objectif_eau:500,  objectif_electricite:7500,  objectif_carburant:1700 },
];

export function getConsommationSummary(ville?: string, dateDebut?: string, dateFin?: string) {
  const base = ville ? CONSOMMATIONS.filter((c) => c.site === ville) : CONSOMMATIONS;
  const debutMois = dateDebut ? dateDebut.slice(0, 7) : undefined;
  const finMois   = dateFin   ? dateFin.slice(0, 7)   : undefined;
  const last5 = (debutMois || finMois)
    ? base.filter((c) => {
        if (debutMois && c.mois < debutMois) return false;
        if (finMois   && c.mois > finMois)   return false;
        return true;
      })
    : base.filter((c) => c.mois >= "2026-01");
  const totals = last5.reduce((acc, c) => ({
    eau:          acc.eau          + c.eau_m3,
    electricite:  acc.electricite  + c.electricite_kwh,
    carburant:    acc.carburant    + c.carburant_litres,
    dechets:      acc.dechets      + c.dechets_tonnes,
    dechetsDang:  acc.dechetsDang  + c.dechets_dangereux_kg,
    co2:          acc.co2          + c.co2_tonnes,
    objEau:       acc.objEau       + c.objectif_eau,
    objElec:      acc.objElec      + c.objectif_electricite,
    objCarb:      acc.objCarb      + c.objectif_carburant,
  }), { eau:0, electricite:0, carburant:0, dechets:0, dechetsDang:0, co2:0, objEau:0, objElec:0, objCarb:0 });

  const perf = (val: number, obj: number) => Math.round(((obj - val) / obj) * 100);
  return {
    ...totals,
    perfEau:         perf(totals.eau,         totals.objEau),
    perfElectricite: perf(totals.electricite,  totals.objElec),
    perfCarburant:   perf(totals.carburant,    totals.objCarb),
    sites: new Set(CONSOMMATIONS.map((c) => c.site)).size,
    mois:  new Set(CONSOMMATIONS.map((c) => c.mois)).size,
  };
}

export function getConsommationParMois() {
  const byMois: Record<string, ConsommationMensuelle & { _count: number }> = {};
  for (const c of CONSOMMATIONS) {
    if (!byMois[c.mois]) {
      byMois[c.mois] = { ...c, eau_m3:0, electricite_kwh:0, carburant_litres:0, dechets_tonnes:0, dechets_dangereux_kg:0, co2_tonnes:0, objectif_eau:0, objectif_electricite:0, objectif_carburant:0, site:"Tous", _count:0 };
    }
    byMois[c.mois].eau_m3                += c.eau_m3;
    byMois[c.mois].electricite_kwh        += c.electricite_kwh;
    byMois[c.mois].carburant_litres       += c.carburant_litres;
    byMois[c.mois].dechets_tonnes         += c.dechets_tonnes;
    byMois[c.mois].dechets_dangereux_kg   += c.dechets_dangereux_kg;
    byMois[c.mois].co2_tonnes             += c.co2_tonnes;
    byMois[c.mois].objectif_eau           += c.objectif_eau;
    byMois[c.mois].objectif_electricite   += c.objectif_electricite;
    byMois[c.mois].objectif_carburant     += c.objectif_carburant;
    byMois[c.mois]._count++;
  }
  return Object.values(byMois).sort((a, b) => a.mois.localeCompare(b.mois));
}
