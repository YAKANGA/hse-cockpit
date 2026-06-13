"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bar, BarChart, CartesianGrid, Cell,
  Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, TrendingDown, Activity, Target } from "lucide-react";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { EVENTS, MOIS_ORDER, MONTH_ISO, recordsToEvents, type EventRow } from "@/lib/events-data";
import type { ModuleRecord } from "@/lib/module-records-data";

const GRAVITY_ORDER = ["Critique","Elevee","Moyenne","Faible"];
const GRAVITY_COLOR: Record<string, string> = {
  Critique:"#9f1239", Elevee:"#dc2626", Moyenne:"#f59e0b", Faible:"#10b981",
};
const TYPE_COLOR: Record<string, string> = {
  "Accident":        "#dc2626",
  "Incident":        "#f59e0b",
  "Presqu'accident": "#10b981",
};

export function EventsSeverityPanel({ records }: { records?: ModuleRecord[] }) {
  const [mounted, setMounted] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openCol,    setOpenCol]    = useState<string | null>(null);
  const [dropPos,    setDropPos]    = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const globalFilter = useCockpitFilter();
  const { dateDebut, dateFin } = globalFilter;
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);
  useEffect(() => { setMounted(true); }, []);

  // Source unique : records importés en priorité, sinon données seed
  const SOURCE = useMemo<EventRow[]>(() => {
    if (records && records.length > 0) {
      const evtRecords = records.filter((r) => r.moduleId === "events");
      if (evtRecords.length > 0) return recordsToEvents(evtRecords);
    }
    return EVENTS;
  }, [records]);

  const filtered = useMemo(() => {
    const debutMois = dateDebut ? dateDebut.slice(0, 7) : undefined;
    const finMois   = dateFin   ? dateFin.slice(0, 7)   : undefined;
    return SOURCE.filter((e) => {
      if (activeSites && !activeSites.includes(e.site)) return false;
      if (debutMois || finMois) {
        const miso = MONTH_ISO[e.mois] ?? "2026-01";
        if (debutMois && miso < debutMois) return false;
        if (finMois   && miso > finMois)   return false;
      }
      return true;
    });
  }, [SOURCE, activeSites, dateDebut, dateFin]);

  const pyramidData = useMemo(() => [
    { name:"Accidents",       value:filtered.filter((e) => e.type === "Accident").length,        fill:"#dc2626" },
    { name:"Incidents",       value:filtered.filter((e) => e.type === "Incident").length,        fill:"#f59e0b" },
    { name:"Presqu'accidents",value:filtered.filter((e) => e.type === "Presqu'accident").length, fill:"#10b981" },
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
    filtered.forEach((e) => {
      if (!m[e.site]) m[e.site] = { Accident:0, Incident:0, "Presqu'accident":0 };
      m[e.site][e.type]++;
    });
    return Object.entries(m).map(([site, counts]) => ({ site, ...counts }));
  }, [filtered]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    return MOIS_ORDER.map((mois) => {
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

  const COL_KEYS = ["mois", "site", "type", "gravite", "cause"] as const;
  type ColKey = typeof COL_KEYS[number];
  const COL_LABELS: Record<ColKey, string> = { mois:"Mois", site:"Site", type:"Type", gravite:"Gravité", cause:"Cause principale" };

  function getVal(e: EventRow, k: string): string { return (e as unknown as Record<string, string>)[k] ?? ""; }

  const colOptions = useMemo(() =>
    Object.fromEntries(COL_KEYS.map((k) => [
      k,
      Array.from(new Set(filtered.map((e) => getVal(e, k)))).sort((a, b) => {
        if (k === "mois") return MOIS_ORDER.indexOf(a) - MOIS_ORDER.indexOf(b);
        if (k === "gravite") return ["Critique","Elevee","Moyenne","Faible"].indexOf(a) - ["Critique","Elevee","Moyenne","Faible"].indexOf(b);
        return a.localeCompare(b);
      }),
    ])),
  [filtered]);

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

  const hasAnyFilter = Object.keys(colFilters).length > 0;

  const tableFiltered = useMemo(() =>
    [...filtered]
      .sort((a, b) => MOIS_ORDER.indexOf(a.mois) - MOIS_ORDER.indexOf(b.mois))
      .filter((e) =>
        COL_KEYS.every((col) => {
          if (!(col in colFilters)) return true;
          const vals = colFilters[col] ?? [];
          return vals.length === 0 ? false : vals.includes(getVal(e, col));
        })
      ),
  [filtered, colFilters]);

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
      {/* Charts row 1 — full width */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader"><div><h2>Tendance mensuelle</h2><p>Évolution du nombre d'événements par type et par mois — 12 mois.</p></div></div>
        <div style={{ height:220 }}>
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} barSize={10} barCategoryGap="25%" barGap={3} margin={{ top:4, right:16, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="accidents"        name="Accidents"        fill="#dc2626" radius={[4,4,0,0]} />
                <Bar dataKey="incidents"        name="Incidents"        fill="#f59e0b" radius={[4,4,0,0]} />
                <Bar dataKey="presquAccidents"  name="Presqu'accidents" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chartSkeleton" />}
        </div>
      </article>

      {/* Charts row 2 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* By site */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Événements par site</h2><p>Accidents, incidents et presqu'accidents par localisation.</p></div></div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySiteType} barSize={10} barCategoryGap="30%" barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="Accident"        name="Accidents"        fill="#dc2626" radius={[4,4,0,0]} />
                  <Bar dataKey="Incident"        name="Incidents"        fill="#f59e0b" radius={[4,4,0,0]} />
                  <Bar dataKey="Presqu'accident" name="Presqu'accidents" fill="#10b981" radius={[4,4,0,0]} />
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
              const color = idx === 0 ? "#dc2626" : idx === 1 ? "#f59e0b" : idx === 2 ? "#10b981" : "#6366f1";
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
        <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h2 style={{ fontSize:14, fontWeight:700, margin:0 }}>Registre détaillé des événements</h2>
            <p style={{ fontSize:11, color:"var(--muted)", margin:"2px 0 0" }}>
              {tableFiltered.length}/{filtered.length} événements
              {hasAnyFilter && <span style={{ color:"#2563eb", marginLeft:6 }}>— filtres actifs</span>}
            </p>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {(["Accident","Incident","Presqu'accident"] as const).map((t) => (
              <span key={t} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--muted)" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:TYPE_COLOR[t], display:"inline-block" }} />
                {filtered.filter((e) => e.type === t).length}
              </span>
            ))}
            {hasAnyFilter && (
              <button type="button" onClick={() => setColFilters({})}
                style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #dc2626", background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontWeight:700 }}>
                ✕ Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Portal dropdown filtre Excel */}
        {mounted && openCol && createPortal(
          <>
            <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setOpenCol(null)} />
            <div style={{ position:"absolute", top:dropPos.top+2, left:dropPos.left, zIndex:9999, background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, boxShadow:"0 8px 28px rgba(0,0,0,0.14)", minWidth:190, maxHeight:310, display:"flex", flexDirection:"column" }}>
              {/* Liste des options */}
              <div style={{ overflowY:"auto", flex:1 }}>
                {(colOptions[openCol] ?? []).map((opt) => {
                  const isFiltering = openCol in colFilters;
                  const cur         = isFiltering ? (colFilters[openCol] ?? []) : null;
                  const checked     = cur === null || cur.includes(opt);
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
              {/* Footer checkbox — tout sélectionner / désélectionner */}
              <label style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", borderTop:"1px solid #e5e7eb", cursor:"pointer", fontSize:12, background:"#f9fafb", borderRadius:"0 0 8px 8px" }}>
                <input
                  type="checkbox"
                  checked={!(openCol in colFilters)}
                  ref={(el) => { if (el) el.indeterminate = (openCol in colFilters) && (colFilters[openCol]?.length ?? 0) > 0; }}
                  onChange={() => {
                    const isAll = !(openCol in colFilters);
                    if (isAll) {
                      setColFilters((p) => ({ ...p, [openCol]: [] }));
                    } else {
                      setColFilters((p) => { const c = { ...p }; delete c[openCol]; return c; });
                    }
                  }}
                  style={{ accentColor:"#2563eb", width:14, height:14, cursor:"pointer" }}
                />
                <span style={{ fontWeight:600, color:"#374151" }}>Tout sélectionner</span>
              </label>
            </div>
          </>,
          document.body
        )}

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"var(--hover)" }}>
                {/* Colonne # sans filtre */}
                <th style={{ padding:"8px 14px", fontSize:11, fontWeight:800, color:"var(--fg)", textTransform:"uppercase", letterSpacing:"0.05em", textAlign:"left", width:36 }}>#</th>
                {/* Colonnes filtrables */}
                {COL_KEYS.map((col) => {
                  const isActive = col in colFilters;
                  const isOpen   = openCol === col;
                  return (
                    <th key={col} style={{ padding:"4px 8px", textAlign:"left", whiteSpace:"nowrap" }}>
                      <button
                        ref={(el) => { btnRefs.current[col] = el; }}
                        type="button"
                        onClick={() => openDropdown(col)}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: isOpen ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: isOpen ? "#eff6ff" : isActive ? "#f0f9ff" : "transparent", color: isActive ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}>
                        {COL_LABELS[col]}
                        {isActive
                          ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters[col] ?? []).length}</span>
                          : <span style={{ fontSize:10, opacity:0.5, marginLeft:1 }}>▾</span>}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {tableFiltered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding:"24px", textAlign:"center", fontSize:12, color:"var(--muted)" }}>Aucun événement pour cette sélection.</td></tr>
              ) : tableFiltered.map((e, i) => {
                const typeColor    = TYPE_COLOR[e.type];
                const gravColor    = GRAVITY_COLOR[e.gravite];
                const isAccident   = e.type === "Accident";
                return (
                  <tr key={i} style={{ borderBottom:"1px solid var(--line)", transition:"background 0.12s", background: isAccident ? "#fff5f5" : "transparent" }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--hover)")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = isAccident ? "#fff5f5" : "transparent")}>
                    {/* # */}
                    <td style={{ padding:"10px 14px", fontSize:11, color:"var(--muted)", fontWeight:500, width:36 }}>{i + 1}</td>
                    {/* Mois */}
                    <td style={{ padding:"10px 14px" }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--fg)", background:"var(--hover)", padding:"2px 8px", borderRadius:6 }}>{e.mois}</span>
                    </td>
                    {/* Site */}
                    <td style={{ padding:"10px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ width:7, height:7, borderRadius:"50%", background:"#2563eb", display:"inline-block", flexShrink:0 }} />
                        <span style={{ fontSize:12, fontWeight:600 }}>{e.site}</span>
                      </div>
                    </td>
                    {/* Type */}
                    <td style={{ padding:"10px 14px" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:"0.04em", background:`${typeColor}18`, color:typeColor, border:`1px solid ${typeColor}44` }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:typeColor, display:"inline-block" }} />
                        {e.type.toUpperCase()}
                      </span>
                    </td>
                    {/* Gravité */}
                    <td style={{ padding:"10px 14px" }}>
                      <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700, background:`${gravColor}18`, color:gravColor, border:`1px solid ${gravColor}44` }}>
                        {e.gravite.toUpperCase()}
                      </span>
                    </td>
                    {/* Cause */}
                    <td style={{ padding:"10px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:12, fontWeight:500 }}>{e.cause}</span>
                        </div>
                        {isAccident && (
                          <span style={{ fontSize:10, fontWeight:700, color:"#dc2626", background:"#fee2e2", padding:"2px 6px", borderRadius:4, whiteSpace:"nowrap" }}>ACR requis</span>
                        )}
                      </div>
                    </td>
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
