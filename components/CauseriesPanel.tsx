"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine } from "recharts";
import { CAUSERIES, getCauserieSummary } from "@/lib/causeries-data";
import { Users, Target, Clock, TrendingUp } from "lucide-react";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";

const TYPE_COLORS: Record<string, string> = {
  "Causerie":               "#0f766e",
  "Toolbox Talk":           "#2563eb",
  "Briefing securite":      "#d97706",
  "Quart d'heure securite": "#7c3aed",
};

export function CauseriesPanel() {
  const summary = useMemo(() => getCauserieSummary(), []);
  const [typeFilter, setTypeFilter] = useState("Tous");

  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  const baseData = useMemo(() =>
    CAUSERIES.filter((c) =>
      (!activeSites || activeSites.includes(c.site)) &&
      isoDateInRange(c.date, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const filtered = useMemo(() =>
    typeFilter === "Tous" ? baseData : baseData.filter((c) => c.type === typeFilter),
  [baseData, typeFilter]);

  const participation = Math.round(
    filtered.reduce((s, c) => s + c.nb_participants, 0) /
    Math.max(filtered.reduce((s, c) => s + c.nb_prevus, 0), 1) * 100
  );

  // Timeline sorted chronologically (last 10 sessions)
  const timeline = useMemo(() =>
    [...filtered]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)
      .map((c) => ({
        date:     c.date.slice(5),   // MM-DD
        site:     c.site,
        prevus:   c.nb_prevus,
        presents: c.nb_participants,
        taux:     Math.round((c.nb_participants / c.nb_prevus) * 100),
        label:    c.theme.slice(0, 22),
      })),
  [filtered]);

  // Per-site participation rate (from filtered baseData)
  const bySiteRate = useMemo(() => {
    const m: Record<string, { prevus: number; presents: number; count: number }> = {};
    baseData.forEach((c) => {
      if (!m[c.site]) m[c.site] = { prevus: 0, presents: 0, count: 0 };
      m[c.site].prevus   += c.nb_prevus;
      m[c.site].presents += c.nb_participants;
      m[c.site].count++;
    });
    return Object.entries(m).map(([s, v]) => ({
      site:  s,
      taux:  Math.round((v.presents / Math.max(v.prevus, 1)) * 100),
      count: v.count,
      duree: Math.round(baseData.filter((c) => c.site === s).reduce((sum, c) => sum + c.duree_minutes, 0) / v.count),
    }));
  }, [baseData]);

  // Per-type stats
  const byType = useMemo(() => {
    const m: Record<string, { count: number; presents: number; prevus: number; duree: number }> = {};
    filtered.forEach((c) => {
      if (!m[c.type]) m[c.type] = { count: 0, presents: 0, prevus: 0, duree: 0 };
      m[c.type].count++;
      m[c.type].presents += c.nb_participants;
      m[c.type].prevus   += c.nb_prevus;
      m[c.type].duree    += c.duree_minutes;
    });
    return Object.entries(m).map(([name, v]) => ({
      name,
      count: v.count,
      taux:  Math.round((v.presents / Math.max(v.prevus, 1)) * 100),
      duree: Math.round(v.duree / v.count),
    }));
  }, [filtered]);

  const TYPES = ["Tous", ...Array.from(new Set(CAUSERIES.map((c) => c.type)))];

  const kpis = [
    { label:"Causeries réalisées",   value: filtered.length,                   color:"#0f766e", sub:`période filtrée`,                           icon: Target },
    { label:"Participants totaux",   value: filtered.reduce((s,c) => s + c.nb_participants, 0), color:"#2563eb", sub:"sur la période",            icon: Users },
    { label:"Taux de participation", value: `${participation}%`,             color: participation >= 90 ? "#16a34a" : participation >= 75 ? "#d97706" : "#dc2626",
      sub:"objectif ≥ 90%", icon: TrendingUp },
    { label:"Taux de réalisation",   value: `${summary.tauxRealisation}%`,   color: summary.tauxRealisation >= 100 ? "#16a34a" : "#d97706",
      sub:`${summary.realisesMois}/${summary.objectifMensuel} obj. mensuel`, icon: Clock },
  ];

  const filterLabel = activeSites
    ? activeSites.length === 1 ? activeSites[0] : `${activeSites.length} sites`
    : "Tous les sites";

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Causeries &amp; Toolbox Talks HSE</h2>
          <p>{filtered.length}/{summary.total} causeries — {filtered.reduce((s,c)=>s+c.nb_participants,0)} participants — taux participation {participation}% — <strong>{filterLabel}</strong>.</p>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {TYPES.map((t) => (
            <button key={t} type="button"
              className={typeFilter === t ? "periodBtn active" : "periodBtn"}
              style={{ fontSize:11 }}
              onClick={() => setTypeFilter(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="causerieKpis">
        {kpis.map(({ label, value, color, sub, icon: Icon }) => (
          <div key={label} className="causerieKpiCard" style={{ "--caus-color": color } as React.CSSProperties}>
            <div style={{ display:"flex", justifyContent:"space-between", width:"100%" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <strong style={{ color, fontSize:26, fontWeight:700, lineHeight:1 }}>{value}</strong>
            <small style={{ color:"var(--muted)", fontSize:11 }}>{sub}</small>
          </div>
        ))}
      </div>

      {/* Objectif mensuel progress */}
      <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--line)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
          <span style={{ color:"var(--muted)", fontWeight:500 }}>Objectif mensuel — {summary.realisesMois} / {summary.objectifMensuel} causeries réalisées</span>
          <span style={{ fontWeight:700, color: summary.tauxRealisation >= 100 ? "#16a34a" : "#d97706" }}>{Math.min(summary.tauxRealisation, 100)}%</span>
        </div>
        <div style={{ height:8, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ width:`${Math.min(summary.tauxRealisation, 100)}%`, height:"100%", borderRadius:99, transition:"width .5s",
            background: summary.tauxRealisation >= 100 ? "linear-gradient(90deg,#16a34a,#0f766e)" : "linear-gradient(90deg,#2563eb,#0f766e)" }} />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Participation timeline */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Taux de participation — sessions récentes</h2><p>Présents vs prévus, avec seuil objectif 90%.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top:4, right:16, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 110]} tickLine={false} axisLine={false} tick={{ fontSize:11 }} unit="%" />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12, border:"1px solid var(--line)" }}
                  formatter={(v, n) => [`${v}%`, n === "taux" ? "Participation" : n]} />
                <ReferenceLine y={90} stroke="#dc2626" strokeDasharray="5 3" label={{ value:"Obj. 90%", position:"insideTopRight", fill:"#dc2626", fontSize:10 }} />
                <Line type="monotone" dataKey="taux" name="Taux %" stroke="#0f766e" strokeWidth={2.5}
                  dot={{ r:4, fill:"#0f766e", strokeWidth:2, stroke:"#fff" }}
                  activeDot={{ r:6, strokeWidth:0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Participants vs prévus timeline */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Présents vs prévus par session</h2><p>Dernières {timeline.length} sessions (chronologique).</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline} barSize={14} margin={{ top:4, right:8, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="prevus"   name="Prévus"   fill="#94a3b8" radius={[4,4,0,0]} />
                <Bar dataKey="presents" name="Présents" fill="#0f766e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* Charts row 2 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Taux par site */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Performance par site</h2><p>Taux de participation et durée moyenne par localisation.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySiteRate} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis type="number" domain={[0, 110]} tickLine={false} axisLine={false} unit="%" tick={{ fontSize:10 }} />
                <YAxis type="category" dataKey="site" width={100} tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v, n) => n === "taux" ? [`${v}%`, "Taux participation"] : [`${v} min`, "Durée moy."]} contentStyle={{ borderRadius:8, fontSize:12 }} />
                <ReferenceLine x={90} stroke="#dc2626" strokeDasharray="5 3" />
                <Bar dataKey="taux" name="Taux %" radius={[0,4,4,0]}>
                  {bySiteRate.map((e) => <Cell key={e.site} fill={e.taux >= 90 ? "#16a34a" : e.taux >= 75 ? "#d97706" : "#dc2626"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Par type */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Analyse par type de session</h2><p>Nombre, taux de participation et durée moyenne.</p></div></div>
          <div style={{ padding:"8px 0" }}>
            {byType.map((t) => {
              const color = TYPE_COLORS[t.name] ?? "#94a3b8";
              return (
                <div key={t.name} style={{ padding:"10px 16px", borderBottom:"1px solid var(--line)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ width:10, height:10, background:color, borderRadius:2, display:"inline-block", flexShrink:0 }} />
                      <span style={{ fontSize:12, fontWeight:600 }}>{t.name}</span>
                    </div>
                    <div style={{ display:"flex", gap:12, fontSize:11 }}>
                      <span style={{ color:"var(--muted)" }}>{t.count} session{t.count > 1 ? "s" : ""}</span>
                      <span style={{ color, fontWeight:700 }}>{t.taux}%</span>
                      <span style={{ color:"var(--muted)" }}>~{t.duree} min</span>
                    </div>
                  </div>
                  <div style={{ height:4, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${t.taux}%`, height:"100%", background:color, borderRadius:99, transition:"width .5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {/* Table */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader"><div><h2>Journal des causeries</h2><p>{filtered.length} session{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}.</p></div></div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Site</th><th>Animateur</th><th>Thème</th><th>Type</th><th style={{ textAlign:"center" }}>Durée (min)</th><th style={{ textAlign:"center" }}>Participants</th><th style={{ textAlign:"center" }}>Taux</th><th>Observations</th></tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((c) => {
                const taux  = Math.round((c.nb_participants / c.nb_prevus) * 100);
                const color = TYPE_COLORS[c.type] ?? "#94a3b8";
                return (
                  <tr key={c.id}>
                    <td style={{ fontSize:12, whiteSpace:"nowrap" }}>{c.date}</td>
                    <td>{c.site}</td>
                    <td style={{ fontSize:12, whiteSpace:"nowrap" }}>{c.animateur}</td>
                    <td style={{ fontSize:12, maxWidth:220 }}>{c.theme}</td>
                    <td><span className="status" style={{ background:`${color}22`, color, fontSize:11 }}>{c.type}</span></td>
                    <td style={{ textAlign:"center" }}>{c.duree_minutes}</td>
                    <td style={{ textAlign:"center" }}>{c.nb_participants}/{c.nb_prevus}</td>
                    <td style={{ textAlign:"center" }}>
                      <span className="status" style={{ background: taux >= 90 ? "#16a34a22" : "#d9770622", color: taux >= 90 ? "#16a34a" : "#d97706" }}>{taux}%</span>
                    </td>
                    <td style={{ fontSize:11, color:"var(--muted)", maxWidth:200 }}>{c.observations}</td>
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
