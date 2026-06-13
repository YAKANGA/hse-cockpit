"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine } from "recharts";
import { CAUSERIES } from "@/lib/causeries-data";
import { Users, Target, Clock, TrendingUp } from "lucide-react";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";

const TYPE_COLORS: Record<string, string> = {
  "Causerie":               "#0f766e",
  "Toolbox Talk":           "#2563eb",
  "Briefing securite":      "#d97706",
  "Quart d'heure securite": "#7c3aed",
};

const COL_DEFS_CAUS = [
  { key: "site",      label: "Site",      get: (c: typeof CAUSERIES[0]) => c.site },
  { key: "animateur", label: "Animateur", get: (c: typeof CAUSERIES[0]) => c.animateur },
  { key: "type",      label: "Type",      get: (c: typeof CAUSERIES[0]) => c.type },
];

export function CauseriesPanel() {
  const [typeFilter, setTypeFilter] = useState("Tous");

  // Column filter state
  const [mounted, setMounted]       = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openCol, setOpenCol]       = useState<string | null>(null);
  const [dropPos, setDropPos]       = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => { setMounted(true); }, []);

  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  const baseData = useMemo(() =>
    CAUSERIES.filter((c) =>
      (!activeSites || activeSites.includes(c.site)) &&
      isoDateInRange(c.date, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const summary = useMemo(() => {
    const objectifMensuel   = 20;
    const realisesMois      = baseData.length;
    const tauxRealisation   = objectifMensuel > 0 ? Math.round((realisesMois / objectifMensuel) * 100) : 0;
    return { total: baseData.length, objectifMensuel, realisesMois, tauxRealisation };
  }, [baseData]);

  const filtered = useMemo(() =>
    typeFilter === "Tous" ? baseData : baseData.filter((c) => c.type === typeFilter),
  [baseData, typeFilter]);

  const participation = Math.round(
    filtered.reduce((s, c) => s + c.nb_participants, 0) /
    Math.max(filtered.reduce((s, c) => s + c.nb_prevus, 0), 1) * 100
  );

  // Column filter options (derived from filtered)
  const colOptions = useMemo(() =>
    Object.fromEntries(COL_DEFS_CAUS.map(({ key, get }) => [
      key, Array.from(new Set(filtered.map(get))).sort(),
    ])),
  [filtered]);

  // Table data — column-filtered and sorted desc by date
  const tableData = useMemo(() =>
    [...filtered]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((c) =>
        COL_DEFS_CAUS.every(({ key, get }) => {
          if (!(key in colFilters)) return true;
          const vals = colFilters[key] ?? [];
          return vals.length === 0 ? false : vals.includes(get(c));
        })
      ),
  [filtered, colFilters]);

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

  const hasAnyColFilter = Object.keys(colFilters).length > 0;

  // Column filter logic
  function toggleColValue(col: string, val: string) {
    setColFilters((prev) => {
      const all    = colOptions[col] ?? [];
      const inPrev = col in prev;
      const cur    = inPrev ? (prev[col] ?? []) : all;
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

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Causeries &amp; Toolbox Talks HSE</h2>
          <p>
            {tableData.length}/{filtered.length} causeries — {filtered.reduce((s,c)=>s+c.nb_participants,0)} participants — taux participation {participation}% — <strong>{filterLabel}</strong>.
            {hasAnyColFilter && (
              <button
                type="button"
                onClick={() => setColFilters({})}
                style={{ marginLeft:10, fontSize:11, padding:"2px 8px", borderRadius:6, border:"1px solid #2563eb", background:"#eff6ff", color:"#2563eb", cursor:"pointer", fontWeight:600 }}
              >
                Réinitialiser filtres colonnes
              </button>
            )}
          </p>
        </div>
        <div style={{ display:"flex", gap:3, background:"var(--hover)", borderRadius:8, padding:"3px" }}>
          {TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setTypeFilter(t)}
              style={{ fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:6, border:"none", cursor:"pointer", transition:"all 0.15s",
                background: typeFilter === t ? "var(--primary)" : "transparent",
                color: typeFilter === t ? "#fff" : "var(--muted)" }}>{t}</button>
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
        <div className="panelHeader">
          <div>
            <h2>Journal des causeries</h2>
            <p>
              {tableData.length}/{filtered.length} session{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}.
              {hasAnyColFilter && (
                <button
                  type="button"
                  onClick={() => setColFilters({})}
                  style={{ marginLeft:10, fontSize:11, padding:"2px 8px", borderRadius:6, border:"1px solid #2563eb", background:"#eff6ff", color:"#2563eb", cursor:"pointer", fontWeight:600 }}
                >
                  Réinitialiser
                </button>
              )}
            </p>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                {/* Static: Date */}
                <th style={{ padding:"4px 8px", textAlign:"left" }}>Date</th>

                {/* Filterable: Site */}
                <th style={{ padding:"4px 8px", textAlign:"left" }}>
                  <button
                    ref={(el) => { btnRefs.current["site"] = el; }}
                    type="button"
                    onClick={() => openDropdown("site")}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: openCol === "site" ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: openCol === "site" ? "#eff6ff" : "site" in colFilters ? "#f0f9ff" : "transparent", color: "site" in colFilters ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}
                  >
                    Site
                    {"site" in colFilters
                      ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters["site"] ?? []).length}</span>
                      : <span style={{ fontSize:10, opacity:0.5 }}>▾</span>}
                  </button>
                </th>

                {/* Filterable: Animateur */}
                <th style={{ padding:"4px 8px", textAlign:"left" }}>
                  <button
                    ref={(el) => { btnRefs.current["animateur"] = el; }}
                    type="button"
                    onClick={() => openDropdown("animateur")}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: openCol === "animateur" ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: openCol === "animateur" ? "#eff6ff" : "animateur" in colFilters ? "#f0f9ff" : "transparent", color: "animateur" in colFilters ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}
                  >
                    Animateur
                    {"animateur" in colFilters
                      ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters["animateur"] ?? []).length}</span>
                      : <span style={{ fontSize:10, opacity:0.5 }}>▾</span>}
                  </button>
                </th>

                {/* Static: Thème */}
                <th style={{ padding:"4px 8px", textAlign:"left" }}>Thème</th>

                {/* Filterable: Type */}
                <th style={{ padding:"4px 8px", textAlign:"left" }}>
                  <button
                    ref={(el) => { btnRefs.current["type"] = el; }}
                    type="button"
                    onClick={() => openDropdown("type")}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: openCol === "type" ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: openCol === "type" ? "#eff6ff" : "type" in colFilters ? "#f0f9ff" : "transparent", color: "type" in colFilters ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}
                  >
                    Type
                    {"type" in colFilters
                      ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters["type"] ?? []).length}</span>
                      : <span style={{ fontSize:10, opacity:0.5 }}>▾</span>}
                  </button>
                </th>

                {/* Static: Durée, Participants, Taux, Observations */}
                <th style={{ padding:"4px 8px", textAlign:"center" }}>Durée (min)</th>
                <th style={{ padding:"4px 8px", textAlign:"center" }}>Participants</th>
                <th style={{ padding:"4px 8px", textAlign:"center" }}>Taux</th>
                <th style={{ padding:"4px 8px", textAlign:"left" }}>Observations</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((c) => {
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

      {/* Portal dropdown for column filters */}
      {mounted && openCol && createPortal(
        <>
          <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setOpenCol(null)} />
          <div style={{ position:"absolute", top:dropPos.top+2, left:dropPos.left, zIndex:9999, background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, boxShadow:"0 8px 28px rgba(0,0,0,0.14)", minWidth:190, maxHeight:310, display:"flex", flexDirection:"column" }}>
            <div style={{ overflowY:"auto", flex:1 }}>
              {(colOptions[openCol] ?? []).map((opt) => {
                const isFiltering = openCol in colFilters;
                const cur         = isFiltering ? (colFilters[openCol] ?? []) : null;
                const checked     = cur === null || cur.includes(opt);
                return (
                  <label
                    key={opt}
                    style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 12px", cursor:"pointer", fontSize:12, borderBottom:"1px solid #f1f5f9", background:"#fff" }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.background = "#f3f4f6"; }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.background = "#fff"; }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColValue(openCol, opt)}
                      style={{ accentColor:"#2563eb", width:14, height:14, cursor:"pointer" }}
                    />
                    <span style={{ fontWeight: checked ? 600 : 400, color: checked ? "#111827" : "#9ca3af" }}>{opt}</span>
                  </label>
                );
              })}
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", borderTop:"1px solid #e5e7eb", cursor:"pointer", fontSize:12, background:"#f9fafb", borderRadius:"0 0 8px 8px" }}>
              <input
                type="checkbox"
                checked={!(openCol in colFilters)}
                ref={(el) => {
                  if (el) el.indeterminate = (openCol in colFilters) && (colFilters[openCol]?.length ?? 0) > 0;
                }}
                onChange={() => {
                  const isAll = !(openCol in colFilters);
                  if (isAll) { setColFilters((p) => ({ ...p, [openCol]: [] })); }
                  else { setColFilters((p) => { const c = {...p}; delete c[openCol]; return c; }); }
                }}
                style={{ accentColor:"#2563eb", width:14, height:14, cursor:"pointer" }}
              />
              <span style={{ fontWeight:600, color:"#374151" }}>Tout sélectionner</span>
            </label>
          </div>
        </>,
        document.body
      )}
    </section>
  );
}
