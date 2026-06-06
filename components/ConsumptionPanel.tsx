"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { CONSOMMATIONS, getConsommationSummary, getConsommationParMois } from "@/lib/consumption-data";
import { Droplets, Zap, Fuel, Trash2, Wind, TrendingUp, TrendingDown, Minus } from "lucide-react";

const SITES = ["Tous", ...Array.from(new Set(CONSOMMATIONS.map((c) => c.site)))];

type MetricKey = "eau_m3" | "electricite_kwh" | "carburant_litres" | "co2_tonnes";

const METRICS: { key: MetricKey; label: string; unit: string; icon: React.ElementType; color: string; objKey: string }[] = [
  { key:"eau_m3",           label:"Eau",         unit:"m³",    icon:Droplets, color:"#2563eb", objKey:"objectif_eau" },
  { key:"electricite_kwh",  label:"Électricité", unit:"kWh",   icon:Zap,      color:"#d97706", objKey:"objectif_electricite" },
  { key:"carburant_litres", label:"Carburant",   unit:"L",     icon:Fuel,     color:"#c2410c", objKey:"objectif_carburant" },
  { key:"co2_tonnes",       label:"CO₂",         unit:"t",     icon:Wind,     color:"#7c3aed", objKey:"" },
];

function PerfIcon({ perf }: { perf: number }) {
  if (perf >= 5)  return <TrendingDown size={14} style={{ color:"#16a34a" }} />;
  if (perf <= -5) return <TrendingUp   size={14} style={{ color:"#dc2626" }} />;
  return <Minus size={14} style={{ color:"#94a3b8" }} />;
}

export function ConsumptionPanel() {
  const summary = useMemo(() => getConsommationSummary(), []);
  const parMois = useMemo(() => getConsommationParMois(), []);
  const [site,   setSite]   = useState("Tous");
  const [metric, setMetric] = useState<MetricKey>("eau_m3");

  const srcData = useMemo(() =>
    site === "Tous" ? CONSOMMATIONS : CONSOMMATIONS.filter((c) => c.site === site),
  [site]);

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
    ["Eau",         `${summary.eau.toLocaleString("fr-FR")} m³`,  "m³ cumulés",    summary.perfEau,          Droplets, "#2563eb"],
    ["Électricité", `${summary.electricite.toLocaleString("fr-FR")} kWh`, "kWh cumul.",summary.perfElectricite, Zap,      "#d97706"],
    ["Carburant",   `${summary.carburant.toLocaleString("fr-FR")} L`, "litres cumul.", summary.perfCarburant, Fuel,     "#c2410c"],
    ["Déchets",     `${totalDechets.toFixed(1)} t`,                "tonnes tot.",   null, Trash2, "#64748b"],
    ["CO₂ émis",    `${summary.co2.toFixed(1)} t`,                 "tonnes CO₂",    null, Wind,   "#7c3aed"],
  ];

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Consommations Environnementales &amp; Émissions CO₂</h2>
          <p>{summary.sites} sites — {summary.mois} mois — {summary.co2.toFixed(1)} t CO₂ cumulées — suivi vs objectifs.</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label style={{ fontSize:12, color:"var(--muted)" }}>Site :</label>
          <select value={site} onChange={(e) => setSite(e.target.value)} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--line)", fontSize:12 }}>
            {SITES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="consumptionKpis">
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

      {/* Metric selector */}
      <div style={{ display:"flex", gap:6, margin:"14px 0 0", flexWrap:"wrap" }}>
        {METRICS.map(({ key, label, color }) => (
          <button key={key} type="button" className={metric === key ? "periodBtn active" : "periodBtn"}
            style={{ fontSize:11, ...(metric === key ? { borderColor:color, color } : {}) }}
            onClick={() => setMetric(key)}>{label}</button>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Actual vs objective area chart */}
        <article className="panel" style={{ gridColumn:"span 2" }}>
          <div className="panelHeader">
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
      </div>

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
        <div className="panelHeader"><div><h2>Détail des consommations mensuelles</h2><p>Données brutes — rouge = dépassement d'objectif.</p></div></div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Mois</th><th>Site</th><th>Eau (m³)</th><th>Obj. eau</th><th>Élec (kWh)</th><th>Obj. élec.</th><th>Carb. (L)</th><th>Obj. carb.</th><th>Déch. (t)</th><th>Déch. dang. (kg)</th><th>CO₂ (t)</th></tr>
            </thead>
            <tbody>
              {srcData.map((c, i) => {
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
