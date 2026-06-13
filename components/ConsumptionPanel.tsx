"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { CONSOMMATIONS } from "@/lib/consumption-data";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";
import { Droplets, Zap, Fuel, Trash2, Wind, TrendingUp, TrendingDown, Minus } from "lucide-react";

type MetricKey = "eau_m3" | "electricite_kwh" | "carburant_litres" | "co2_tonnes";
type ConsumptionRow = (typeof CONSOMMATIONS)[number];

const METRICS: { key: MetricKey; label: string; unit: string; icon: React.ElementType; color: string; objKey: string }[] = [
  { key:"eau_m3",           label:"Eau",         unit:"m³",    icon:Droplets, color:"#2563eb", objKey:"objectif_eau" },
  { key:"electricite_kwh",  label:"Électricité", unit:"kWh",   icon:Zap,      color:"#d97706", objKey:"objectif_electricite" },
  { key:"carburant_litres", label:"Carburant",   unit:"L",     icon:Fuel,     color:"#c2410c", objKey:"objectif_carburant" },
  { key:"co2_tonnes",       label:"CO₂",         unit:"t",     icon:Wind,     color:"#7c3aed", objKey:"" },
];

const COL_DEFS_CONS: { key: string; label: string; get: (c: ConsumptionRow) => string }[] = [
  { key:"site", label:"Site", get:(c) => c.site },
  { key:"mois", label:"Mois", get:(c) => c.mois },
];

function PerfIcon({ perf }: { perf: number }) {
  if (perf >= 5)  return <TrendingDown size={14} style={{ color:"#16a34a" }} />;
  if (perf <= -5) return <TrendingUp   size={14} style={{ color:"#dc2626" }} />;
  return <Minus size={14} style={{ color:"#94a3b8" }} />;
}

export function ConsumptionPanel() {
  const [metric, setMetric] = useState<MetricKey>("eau_m3");
  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  const srcData = useMemo(() =>
    CONSOMMATIONS.filter((c) =>
      (!activeSites || activeSites.includes(c.site)) &&
      isoDateInRange(c.mois, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const bySite = useMemo(() => {
    const m: Record<string, { eau:number; elec:number; carb:number; co2:number; dechets:number }> = {};
    srcData.forEach((c) => {
      if (!m[c.site]) m[c.site] = { eau:0, elec:0, carb:0, co2:0, dechets:0 };
      m[c.site].eau    += c.eau_m3;
      m[c.site].elec   += c.electricite_kwh;
      m[c.site].carb   += c.carburant_litres;
      m[c.site].co2    += c.co2_tonnes;
      m[c.site].dechets += c.dechets_tonnes;
    });
    return Object.entries(m).map(([s, v]) => ({ site:s, ...v }));
  }, [srcData]);

  // Column filter state
  const [mounted, setMounted] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => { setMounted(true); }, []);

  const colOptions = useMemo(() =>
    Object.fromEntries(COL_DEFS_CONS.map(({ key, get }) => [
      key, Array.from(new Set(srcData.map(get))).sort(),
    ])),
  [srcData]);

  const tableData = useMemo(() =>
    srcData.filter((c) =>
      COL_DEFS_CONS.every(({ key, get }) => {
        if (!(key in colFilters)) return true;
        const vals = colFilters[key] ?? [];
        return vals.length === 0 ? false : vals.includes(get(c));
      })
    ),
  [srcData, colFilters]);

  function toggleColValue(col: string, val: string) {
    setColFilters((prev) => {
      const all = colOptions[col] ?? [];
      const inPrev = col in prev;
      const cur = inPrev ? (prev[col] ?? []) : all;
      let next: string[];
      if (!inPrev)               { next = all.filter((v) => v !== val); }
      else if (cur.includes(val)){ next = cur.filter((v) => v !== val); }
      else                       { next = [...cur, val]; }
      if (next.length === all.length) {
        const copy = { ...prev }; delete copy[col]; return copy;
      }
      return { ...prev, [col]: next };
    });
  }

  function openDropdown(col: string) {
    if (openCol === col) { setOpenCol(null); return; }
    const btn = btnRefs.current[col];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    setOpenCol(col);
  }

  const hasAnyColFilter = Object.keys(colFilters).length > 0;

  const summary = useMemo(() => {
    if (!srcData.length) return null;
    const t = srcData.reduce((acc, c) => ({
      eau:         acc.eau         + c.eau_m3,
      electricite: acc.electricite + c.electricite_kwh,
      carburant:   acc.carburant   + c.carburant_litres,
      dechets:     acc.dechets     + c.dechets_tonnes,
      dechetsDang: acc.dechetsDang + c.dechets_dangereux_kg,
      co2:         acc.co2         + c.co2_tonnes,
      objEau:      acc.objEau      + c.objectif_eau,
      objElec:     acc.objElec     + c.objectif_electricite,
      objCarb:     acc.objCarb     + c.objectif_carburant,
    }), { eau:0, electricite:0, carburant:0, dechets:0, dechetsDang:0, co2:0, objEau:0, objElec:0, objCarb:0 });
    const perf = (val: number, obj: number) => obj > 0 ? Math.round(((obj - val) / obj) * 100) : 0;
    return {
      ...t,
      perfEau:         perf(t.eau,        t.objEau),
      perfElectricite: perf(t.electricite, t.objElec),
      perfCarburant:   perf(t.carburant,   t.objCarb),
      sites: new Set(srcData.map((c) => c.site)).size,
      mois:  new Set(srcData.map((c) => c.mois)).size,
    };
  }, [srcData]);

  const parMois = useMemo(() => {
    const byMois: Record<string, {
      mois:string; eau_m3:number; electricite_kwh:number; carburant_litres:number;
      dechets_tonnes:number; dechets_dangereux_kg:number; co2_tonnes:number;
      objectif_eau:number; objectif_electricite:number; objectif_carburant:number;
    }> = {};
    srcData.forEach((c) => {
      if (!byMois[c.mois]) byMois[c.mois] = {
        mois:c.mois, eau_m3:0, electricite_kwh:0, carburant_litres:0,
        dechets_tonnes:0, dechets_dangereux_kg:0, co2_tonnes:0,
        objectif_eau:0, objectif_electricite:0, objectif_carburant:0,
      };
      byMois[c.mois].eau_m3              += c.eau_m3;
      byMois[c.mois].electricite_kwh      += c.electricite_kwh;
      byMois[c.mois].carburant_litres     += c.carburant_litres;
      byMois[c.mois].dechets_tonnes       += c.dechets_tonnes;
      byMois[c.mois].dechets_dangereux_kg += c.dechets_dangereux_kg;
      byMois[c.mois].co2_tonnes           += c.co2_tonnes;
      byMois[c.mois].objectif_eau         += c.objectif_eau;
      byMois[c.mois].objectif_electricite += c.objectif_electricite;
      byMois[c.mois].objectif_carburant   += c.objectif_carburant;
    });
    return Object.values(byMois).sort((a, b) => a.mois.localeCompare(b.mois));
  }, [srcData]);

  // Actual vs objective per month (normalized %)
  const vsObjectif = useMemo(() =>
    parMois.map((m) => {
      const eau  = m.objectif_eau         ? Math.round((m.eau_m3           / m.objectif_eau)          * 100) : 100;
      const elec = m.objectif_electricite ? Math.round((m.electricite_kwh  / m.objectif_electricite)  * 100) : 100;
      const carb = m.objectif_carburant   ? Math.round((m.carburant_litres / m.objectif_carburant)    * 100) : 100;
      return { mois:m.mois, eau, elec, carb };
    }),
  [parMois]);

  // Metric-specific actual vs objective
  const metricObj = useMemo(() => {
    const m = METRICS.find((x) => x.key === metric)!;
    return parMois.map((row) => ({
      mois:   row.mois,
      reel:   row[metric as keyof typeof row] as number,
      // @ts-ignore — dynamic key from objKey
      obj:    m.objKey ? (row[m.objKey] as number) : undefined,
      depasse: m.objKey ? (row[metric as keyof typeof row] as number) > (row[m.objKey as keyof typeof row] as number) : false,
    }));
  }, [parMois, metric]);

  const totalDechets = srcData.reduce((s, c) => s + c.dechets_tonnes, 0);
  const totalDangDechets = srcData.reduce((s, c) => s + c.dechets_dangereux_kg, 0);

  const kpiPerfs: [string, string, string, number | null, React.ElementType, string][] = [
    ["Eau",         `${(summary?.eau ?? 0).toLocaleString("fr-FR")} m³`,           "m³ cumulés",   summary?.perfEau         ?? null, Droplets, "#2563eb"],
    ["Électricité", `${(summary?.electricite ?? 0).toLocaleString("fr-FR")} kWh`,  "kWh cumul.",   summary?.perfElectricite  ?? null, Zap,      "#d97706"],
    ["Carburant",   `${(summary?.carburant ?? 0).toLocaleString("fr-FR")} L`,      "litres cumul.", summary?.perfCarburant   ?? null, Fuel,     "#c2410c"],
    ["Déchets",     `${totalDechets.toFixed(1)} t`,                                "tonnes tot.",   null, Trash2, "#64748b"],
    ["CO₂ émis",    `${(summary?.co2 ?? 0).toFixed(1)} t`,                         "tonnes CO₂",    null, Wind,   "#7c3aed"],
  ];

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Consommations Environnementales &amp; Émissions CO₂</h2>
          <p>{summary?.sites ?? 0} sites — {summary?.mois ?? 0} mois — {(summary?.co2 ?? 0).toFixed(1)} t CO₂ cumulées — suivi vs objectifs.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="panel" style={{ padding: "14px 16px", marginTop: 16 }}>
        <div className="consumptionKpis" style={{ marginTop: 0 }}>
          {kpiPerfs.map(([label, val, sub, perf, Icon, color]) => (
            <div key={label} className="consumptionKpiCard" style={{ "--cons-color": color } as React.CSSProperties}>
              <div style={{ display:"flex", justifyContent:"space-between", width:"100%" }}>
                <Icon size={16} style={{ color }} />
                {perf !== null && <PerfIcon perf={perf} />}
              </div>
              <strong style={{ color, fontSize:18, lineHeight:1.1 }}>{val}</strong>
              <span style={{ fontSize:11, color:"var(--muted)" }}>{label}</span>
              {perf !== null && (
                <span style={{ fontSize:11, color: perf >= 0 ? "#16a34a" : "#dc2626", fontWeight:600 }}>
                  {perf >= 0 ? `-${perf}%` : `+${Math.abs(perf)}%`} vs obj.
                </span>
              )}
              {perf === null && <span style={{ fontSize:11, color:"var(--muted)" }}>{sub}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Metric selector + chart row 1 */}
      <article className="panel" style={{ marginTop: 28 }}>
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          {METRICS.map(({ key, label, color }) => (
            <button key={key} type="button" className={metric === key ? "periodBtn active" : "periodBtn"}
              style={{ fontSize:11, ...(metric === key ? { borderColor:color, color } : {}) }}
              onClick={() => setMetric(key)}>{label}</button>
          ))}
        </div>
        <div className="panelHeader" style={{ marginBottom: 8 }}>
          <div>
            <h2>Évolution mensuelle — {METRICS.find((m) => m.key === metric)?.label} ({METRICS.find((m) => m.key === metric)?.unit})</h2>
            <p>Consommation réelle vs objectif mensuel. Zone rouge = dépassement.</p>
          </div>
        </div>
        <div className="chart" style={{ height:200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metricObj} margin={{ top:4, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize:11 }} />
              <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
              {metricObj[0]?.obj !== undefined && (
                <Area type="monotone" dataKey="obj" name="Objectif" stroke="#94a3b8" fill="#f1f5f9" strokeDasharray="5 3" strokeWidth={1.5} />
              )}
              <Area type="monotone" dataKey="reel" name="Consommation réelle"
                stroke={METRICS.find((m) => m.key === metric)?.color ?? "#2563eb"}
                fill={`${METRICS.find((m) => m.key === metric)?.color ?? "#2563eb"}22`} strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      {/* Charts row 2 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* % vs objectif multi-metric */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Écart vs objectif — tous indicateurs</h2><p>Consommation en % de l'objectif (100% = objectif atteint, &gt;100% = dépassement).</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vsObjectif} margin={{ top:4, right:8, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[50, 150]} tickLine={false} axisLine={false} tick={{ fontSize:10 }} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <ReferenceLine y={100} stroke="#dc2626" strokeDasharray="5 3" label={{ value:"Obj. 100%", position:"insideTopRight", fill:"#dc2626", fontSize:10 }} />
                <Line type="monotone" dataKey="eau"  name="Eau"  stroke="#2563eb" strokeWidth={2} dot={{ r:3 }} />
                <Line type="monotone" dataKey="elec" name="Élec" stroke="#d97706" strokeWidth={2} dot={{ r:3 }} />
                <Line type="monotone" dataKey="carb" name="Carb" stroke="#c2410c" strokeWidth={2} dot={{ r:3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* CO2 per site */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Empreinte CO₂ par site</h2><p>Tonnes de CO₂ cumulées sur la période.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySite} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit=" t" />
                <Tooltip formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} t` : String(v), "CO₂"]} contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Bar dataKey="co2" name="CO₂ (t)" radius={[6,6,0,0]}>
                  {bySite.map((s) => <Cell key={s.site} fill="#7c3aed" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* Charts row 3 — waste + water vs carb */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        <article className="panel">
          <div className="panelHeader"><div><h2>Eau vs Carburant par site</h2><p>Comparaison des deux principaux vecteurs de consommation.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySite} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="eau"  name="Eau (m³)"   fill="#2563eb" radius={[4,4,0,0]} />
                <Bar dataKey="carb" name="Carb. (L)"  fill="#c2410c" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Déchet breakdown */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Déchets totaux par site</h2><p>Déchets inertes (t) + déchets dangereux (kg) — indicateurs environnementaux.</p></div></div>
          <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:12 }}>
            {bySite.map(({ site, dechets }) => {
              const pct = Math.round((dechets / Math.max(totalDechets, 1)) * 100);
              return (
                <div key={site}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <span style={{ fontWeight:500 }}>{site}</span>
                    <span style={{ color:"#64748b", fontWeight:600 }}>{dechets.toFixed(1)} t ({pct}%)</span>
                  </div>
                  <div style={{ height:6, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:"#64748b", borderRadius:99, transition:"width .5s" }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop:8, padding:"10px 12px", background:"var(--bg)", borderRadius:8, border:"1px solid var(--line)" }}>
              <div style={{ fontSize:12, fontWeight:500, marginBottom:4 }}>Total déchets dangereux</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#c2410c" }}>{totalDangDechets.toLocaleString("fr-FR")} kg</div>
            </div>
          </div>
        </article>
      </div>

      {/* Detail table */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader">
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <h2>Détail des consommations mensuelles</h2>
              {hasAnyColFilter && (
                <button
                  type="button"
                  onClick={() => setColFilters({})}
                  style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", border:"1px solid #e5e7eb", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, background:"#fef3c7", color:"#92400e", transition:"all 0.12s" }}
                  title="Effacer tous les filtres colonne"
                >
                  <span>✕</span> Réinitialiser filtres
                </button>
              )}
            </div>
            <p>Données brutes — rouge = dépassement d'objectif. {tableData.length}/{srcData.length} lignes</p>
          </div>
        </div>

        {/* Portal dropdown for column filters */}
        {mounted && openCol && createPortal(
          <>
            <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setOpenCol(null)} />
            <div style={{ position:"absolute", top:dropPos.top+2, left:dropPos.left, zIndex:9999, background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, boxShadow:"0 8px 28px rgba(0,0,0,0.14)", minWidth:190, maxHeight:310, display:"flex", flexDirection:"column" }}>
              <div style={{ overflowY:"auto", flex:1 }}>
                {(colOptions[openCol] ?? []).map((opt) => {
                  const isFiltering = openCol in colFilters;
                  const cur = isFiltering ? (colFilters[openCol] ?? []) : null;
                  const checked = cur === null || cur.includes(opt);
                  return (
                    <label key={opt} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 12px", cursor:"pointer", fontSize:12, borderBottom:"1px solid #f1f5f9", background:"#fff" }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.background = "#f3f4f6"; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.background = "#fff"; }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleColValue(openCol, opt)}
                        style={{ accentColor:"#2563eb", width:14, height:14, cursor:"pointer" }} />
                      <span style={{ fontWeight: checked ? 600 : 400, color: checked ? "#111827" : "#9ca3af" }}>{opt}</span>
                    </label>
                  );
                })}
              </div>
              <label style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", borderTop:"1px solid #e5e7eb", cursor:"pointer", fontSize:12, background:"#f9fafb", borderRadius:"0 0 8px 8px" }}>
                <input type="checkbox" checked={!(openCol in colFilters)}
                  ref={(el) => { if (el) el.indeterminate = (openCol in colFilters) && (colFilters[openCol]?.length ?? 0) > 0; }}
                  onChange={() => {
                    const isAll = !(openCol in colFilters);
                    if (isAll) { setColFilters((p) => ({ ...p, [openCol]: [] })); }
                    else { setColFilters((p) => { const c = {...p}; delete c[openCol]; return c; }); }
                  }}
                  style={{ accentColor:"#2563eb", width:14, height:14, cursor:"pointer" }} />
                <span style={{ fontWeight:600, color:"#374151" }}>Tout sélectionner</span>
              </label>
            </div>
          </>,
          document.body
        )}

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th style={{ padding:"4px 8px", textAlign:"left" }}>
                  <button ref={(el) => { btnRefs.current["mois"] = el; }} type="button" onClick={() => openDropdown("mois")}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: openCol === "mois" ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: openCol === "mois" ? "#eff6ff" : "mois" in colFilters ? "#f0f9ff" : "transparent", color: "mois" in colFilters ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}>
                    Mois
                    {"mois" in colFilters
                      ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters["mois"] ?? []).length}</span>
                      : <span style={{ fontSize:10, opacity:0.5 }}>▾</span>}
                  </button>
                </th>
                <th style={{ padding:"4px 8px", textAlign:"left" }}>
                  <button ref={(el) => { btnRefs.current["site"] = el; }} type="button" onClick={() => openDropdown("site")}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: openCol === "site" ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: openCol === "site" ? "#eff6ff" : "site" in colFilters ? "#f0f9ff" : "transparent", color: "site" in colFilters ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}>
                    Site
                    {"site" in colFilters
                      ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters["site"] ?? []).length}</span>
                      : <span style={{ fontSize:10, opacity:0.5 }}>▾</span>}
                  </button>
                </th>
                <th>Eau (m³)</th>
                <th>Obj. eau</th>
                <th>Élec (kWh)</th>
                <th>Obj. élec.</th>
                <th>Carb. (L)</th>
                <th>Obj. carb.</th>
                <th>Déch. (t)</th>
                <th>Déch. dang. (kg)</th>
                <th>CO₂ (t)</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((c, i) => {
                const depEau  = c.eau_m3          > c.objectif_eau;
                const depElec = c.electricite_kwh > c.objectif_electricite;
                const depCarb = c.carburant_litres > c.objectif_carburant;
                return (
                  <tr key={i}>
                    <td style={{ fontSize:12, whiteSpace:"nowrap", fontWeight:500 }}>{c.mois}</td>
                    <td>{c.site}</td>
                    <td style={{ color:depEau ? "#dc2626" : "inherit", fontWeight:depEau ? 600 : 400 }}>{c.eau_m3.toLocaleString("fr-FR")}</td>
                    <td style={{ color:"var(--muted)", fontSize:12 }}>{c.objectif_eau.toLocaleString("fr-FR")}</td>
                    <td style={{ color:depElec ? "#dc2626" : "inherit", fontWeight:depElec ? 600 : 400 }}>{c.electricite_kwh.toLocaleString("fr-FR")}</td>
                    <td style={{ color:"var(--muted)", fontSize:12 }}>{c.objectif_electricite.toLocaleString("fr-FR")}</td>
                    <td style={{ color:depCarb ? "#dc2626" : "inherit", fontWeight:depCarb ? 600 : 400 }}>{c.carburant_litres.toLocaleString("fr-FR")}</td>
                    <td style={{ color:"var(--muted)", fontSize:12 }}>{c.objectif_carburant.toLocaleString("fr-FR")}</td>
                    <td>{c.dechets_tonnes.toFixed(1)}</td>
                    <td style={{ color: c.dechets_dangereux_kg > 0 ? "#c2410c" : "inherit" }}>{c.dechets_dangereux_kg}</td>
                    <td style={{ fontWeight:600, color:"#7c3aed" }}>{c.co2_tonnes.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
