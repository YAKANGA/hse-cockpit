"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart,
  Legend, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";
import { AlertTriangle, TrendingDown, Activity, Target } from "lucide-react";

type EventRow = {
  type:    "Accident" | "Incident" | "Presqu'accident";
  gravite: "Critique" | "Elevee" | "Moyenne" | "Faible";
  site:    string;
  cause:   string;
  mois:    string;
};

const EVENTS: EventRow[] = [
  { type:"Accident",       gravite:"Critique", site:"Bouake",       cause:"Levage",       mois:"Jan" },
  { type:"Accident",       gravite:"Elevee",   site:"Abidjan",      cause:"Circulation",  mois:"Fev" },
  { type:"Accident",       gravite:"Elevee",   site:"San Pedro",    cause:"Chimique",     mois:"Mar" },
  { type:"Incident",       gravite:"Elevee",   site:"Bouake",       cause:"Levage",       mois:"Jan" },
  { type:"Incident",       gravite:"Moyenne",  site:"Yamoussoukro", cause:"Manutention",  mois:"Fev" },
  { type:"Incident",       gravite:"Moyenne",  site:"Abidjan",      cause:"Circulation",  mois:"Avr" },
  { type:"Incident",       gravite:"Faible",   site:"San Pedro",    cause:"Electrique",   mois:"Mai" },
  { type:"Incident",       gravite:"Faible",   site:"Bouake",       cause:"Chute",        mois:"Juin" },
  { type:"Presqu'accident",gravite:"Elevee",   site:"Abidjan",      cause:"Levage",       mois:"Jan" },
  { type:"Presqu'accident",gravite:"Elevee",   site:"Bouake",       cause:"Circulation",  mois:"Mar" },
  { type:"Presqu'accident",gravite:"Moyenne",  site:"San Pedro",    cause:"Manutention",  mois:"Avr" },
  { type:"Presqu'accident",gravite:"Moyenne",  site:"Yamoussoukro", cause:"Electrique",   mois:"Mai" },
  { type:"Presqu'accident",gravite:"Faible",   site:"Abidjan",      cause:"Chute",        mois:"Juin" },
  { type:"Presqu'accident",gravite:"Faible",   site:"Bouake",       cause:"Manutention",  mois:"Juin" },
];

const MOIS_ORDER = ["Jan","Fev","Mar","Avr","Mai","Juin","Juil","Aout","Sep","Oct","Nov","Dec"];

const GRAVITY_ORDER = ["Critique","Elevee","Moyenne","Faible"];
const GRAVITY_COLOR: Record<string, string> = {
  Critique:"#9f1239", Elevee:"#c2410c", Moyenne:"#b45309", Faible:"#047857",
};
const TYPE_COLOR: Record<string, string> = {
  "Accident":        "#c2410c",
  "Incident":        "#b45309",
  "Presqu'accident": "#2563eb",
};

const SITES = ["Tous", ...Array.from(new Set(EVENTS.map((e) => e.site)))];

export function EventsSeverityPanel() {
  const [mounted, setMounted] = useState(false);
  const [siteFilter, setSiteFilter] = useState("Tous");
  useEffect(() => { setMounted(true); }, []);

  const filtered = useMemo(() =>
    siteFilter === "Tous" ? EVENTS : EVENTS.filter((e) => e.site === siteFilter),
  [siteFilter]);

  const pyramidData = useMemo(() => [
    { name:"Accidents",       value:filtered.filter((e) => e.type === "Accident").length,        fill:"#c2410c" },
    { name:"Incidents",       value:filtered.filter((e) => e.type === "Incident").length,        fill:"#b45309" },
    { name:"Presqu'accidents",value:filtered.filter((e) => e.type === "Presqu'accident").length, fill:"#2563eb" },
  ], [filtered]);

  const byGravity = useMemo(() =>
    GRAVITY_ORDER.map((g) => ({ gravite:g, count:filtered.filter((e) => e.gravite === g).length })),
  [filtered]);

  const byCause = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((e) => { m[e.cause] = (m[e.cause] ?? 0) + 1; });
    return Object.entries(m).map(([cause, count]) => ({ cause, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const bySiteType = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    EVENTS.forEach((e) => {
      if (!m[e.site]) m[e.site] = { Accident:0, Incident:0, "Presqu'accident":0 };
      m[e.site][e.type]++;
    });
    return Object.entries(m).map(([site, counts]) => ({ site, ...counts }));
  }, []);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const presentMonths = Array.from(new Set(EVENTS.map((e) => e.mois)))
      .sort((a, b) => MOIS_ORDER.indexOf(a) - MOIS_ORDER.indexOf(b));
    return presentMonths.map((mois) => {
      const evts = filtered.filter((e) => e.mois === mois);
      return {
        mois,
        accidents:       evts.filter((e) => e.type === "Accident").length,
        incidents:       evts.filter((e) => e.type === "Incident").length,
        presquAccidents: evts.filter((e) => e.type === "Presqu'accident").length,
        total:           evts.length,
        critiques:       evts.filter((e) => e.gravite === "Critique" || e.gravite === "Elevee").length,
      };
    });
  }, [filtered]);

  const criticalCount = filtered.filter((e) => e.gravite === "Critique" || e.gravite === "Elevee").length;
  const accidentCount = filtered.filter((e) => e.type === "Accident").length;

  // Heinrich ratio: presqu'accidents per accident (safety indicator)
  const heinrichRatio = accidentCount > 0 ? (filtered.filter((e) => e.type === "Presqu'accident").length / accidentCount).toFixed(1) : "—";

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Pyramide des Événements HSE</h2>
          <p>{filtered.length} événements déclarés — {criticalCount} de gravité élevée/critique — ratio Heinrich : {heinrichRatio} presqu'accidents/accident.</p>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <label style={{ fontSize:12, color:"var(--muted)" }}>Site :</label>
          <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--line)", fontSize:12 }}>
            {SITES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="severityKpis">
        {pyramidData.map((row) => (
          <div key={row.name} className="severityKpiCard" style={{ "--type-color": row.fill } as React.CSSProperties}>
            <AlertTriangle size={14} style={{ color:row.fill }} />
            <strong style={{ color:row.fill, fontSize:26 }}>{row.value}</strong>
            <span style={{ fontSize:12 }}>{row.name}</span>
            <small>{Math.round((row.value / Math.max(filtered.length, 1)) * 100)}% du total</small>
          </div>
        ))}
        {([
          { label:"Critiques + Élevés", val:criticalCount,  color:"#dc2626", icon:AlertTriangle, sub:"priorité max" },
          { label:"Ratio Heinrich",     val:heinrichRatio,  color:"#0f766e", icon:Target,        sub:"presqu'/accident" },
          { label:"Sites touchés",      val:Array.from(new Set(filtered.map((e) => e.site))).length, color:"#2563eb", icon:Activity, sub:"localisations" },
          { label:"Mois analysés",      val:Array.from(new Set(filtered.map((e) => e.mois))).length, color:"#7c3aed", icon:TrendingDown, sub:"période suivi" },
        ] as { label:string; val:number|string; color:string; icon:React.ElementType; sub:string }[]).map(({ label, val, color, icon:Icon, sub }) => (
          <div key={label} className="severityKpiCard" style={{ "--type-color": color } as React.CSSProperties}>
            <Icon size={14} style={{ color }} />
            <strong style={{ color, fontSize:26 }}>{val}</strong>
            <span style={{ fontSize:12 }}>{label}</span>
            <small>{sub}</small>
          </div>
        ))}
      </div>

      {/* Global progress bar */}
      <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--line)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
          <span style={{ color:"var(--muted)", fontWeight:500 }}>Répartition par gravité sur {filtered.length} événements</span>
          <span style={{ fontWeight:700, color:"#9f1239" }}>{criticalCount} critiques / élevés</span>
        </div>
        <div style={{ height:10, display:"flex", borderRadius:99, overflow:"hidden" }}>
          {byGravity.filter((g) => g.count > 0).map(({ gravite, count }) => (
            <div key={gravite} title={`${gravite}: ${count}`} style={{ flex:count, background:GRAVITY_COLOR[gravite], transition:"flex .5s" }} />
          ))}
        </div>
        <div style={{ display:"flex", gap:12, marginTop:6, fontSize:11, flexWrap:"wrap" }}>
          {byGravity.map(({ gravite, count }) => (
            <span key={gravite} style={{ color:GRAVITY_COLOR[gravite] }}>● {gravite} : {count}</span>
          ))}
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Heinrich funnel */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Pyramide de Heinrich</h2><p>Accidents → Incidents → Presqu'accidents. Un faible ratio indique une bonne culture de remontée.</p></div></div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Funnel dataKey="value" data={pyramidData} isAnimationActive>
                    {pyramidData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        {/* Monthly trend */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Tendance mensuelle</h2><p>Évolution du nombre d'événements par type et par mois.</p></div></div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="accidents"        name="Accidents"        fill="#c2410c" stackId="a" />
                  <Bar dataKey="incidents"        name="Incidents"        fill="#b45309" stackId="a" />
                  <Bar dataKey="presquAccidents"  name="Presqu'accidents" fill="#2563eb" stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>

      {/* Charts row 2 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* By site */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Événements par site</h2><p>Accidents, incidents et presqu'accidents par localisation.</p></div></div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySiteType} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="Accident"        name="Accidents"        fill="#c2410c" stackId="a" />
                  <Bar dataKey="Incident"        name="Incidents"        fill="#b45309" stackId="a" />
                  <Bar dataKey="Presqu'accident" name="Presqu'accidents" fill="#2563eb" stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        {/* Top causes */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Top causes d'événements</h2><p>Classement des causes racines les plus récurrentes. Priorités d'action préventive.</p></div></div>
          <div style={{ padding:"8px 0" }}>
            {byCause.map(({ cause, count }, idx) => {
              const pct = Math.round((count / Math.max(filtered.length, 1)) * 100);
              const color = idx === 0 ? "#c2410c" : idx === 1 ? "#b45309" : idx === 2 ? "#d97706" : "#2563eb";
              return (
                <div key={cause} style={{ padding:"8px 16px", borderBottom:"1px solid var(--line)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ width:20, height:20, background:color, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:700, flexShrink:0 }}>{idx+1}</span>
                      <span style={{ fontWeight:600 }}>{cause}</span>
                    </div>
                    <span style={{ color, fontWeight:700 }}>{count} evt ({pct}%)</span>
                  </div>
                  <div style={{ height:4, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width .5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {/* Events table */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader"><div><h2>Registre détaillé des événements</h2><p>{filtered.length} événements — cliquer sur une ligne pour voir les détails ACR.</p></div></div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Mois</th><th>Site</th><th>Type</th><th>Gravité</th><th>Cause principale</th></tr></thead>
            <tbody>
              {[...filtered].sort((a, b) => MOIS_ORDER.indexOf(a.mois) - MOIS_ORDER.indexOf(b.mois)).map((e, i) => (
                <tr key={i}>
                  <td style={{ fontSize:12, fontWeight:600 }}>{e.mois}</td>
                  <td style={{ fontSize:12 }}>{e.site}</td>
                  <td><span className="status" style={{ background:`${TYPE_COLOR[e.type]}22`, color:TYPE_COLOR[e.type], fontSize:11 }}>{e.type}</span></td>
                  <td><span className="status" style={{ background:`${GRAVITY_COLOR[e.gravite]}22`, color:GRAVITY_COLOR[e.gravite], fontSize:11, fontWeight:600 }}>{e.gravite}</span></td>
                  <td style={{ fontSize:12 }}>{e.cause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div style={{ marginTop:14, display:"flex", justifyContent:"flex-end" }}>
        <a className="primaryButton" href="/modules/events">
          Ouvrir le module Événements — détails et imports →
        </a>
      </div>
    </section>
  );
}
