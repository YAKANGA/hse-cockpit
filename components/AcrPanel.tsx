"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { ANALYSES_ACR, type StatutACR } from "@/lib/acr-data";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";
import { CheckCircle2, AlertCircle, Share2, Wrench, Target, TrendingUp } from "lucide-react";

const STATUT_COLOR: Record<StatutACR, string> = {
  "En cours":        "#2563eb",
  "Finalise":        "#0f766e",
  "Actions lancees": "#d97706",
  "Cloture":         "#64748b",
};

const CAUSE_TYPE_COLOR: Record<string, string> = {
  "Organisationnelle": "#7c3aed",
  "Technique":         "#c2410c",
  "Humaine":           "#d97706",
  "Environnementale":  "#0f766e",
};

const METHODE_COLOR = ["#0f766e","#2563eb","#d97706","#7c3aed","#c2410c"];

const COL_DEFS = [
  { key:"site",    label:"Site",        get:(a: typeof ANALYSES_ACR[0]) => a.site },
  { key:"type",    label:"Type",        get:(a: typeof ANALYSES_ACR[0]) => a.type_evenement },
  { key:"methode", label:"Méthode",     get:(a: typeof ANALYSES_ACR[0]) => a.methode },
  { key:"resp",    label:"Responsable", get:(a: typeof ANALYSES_ACR[0]) => a.responsable_analyse },
  { key:"statut",  label:"Statut",      get:(a: typeof ANALYSES_ACR[0]) => a.statut },
];

export function AcrPanel() {
  const [selected, setSelected] = useState<string | null>(null);
  const [methodeFilter, setMethodeFilter] = useState("Tous");
  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  // Column filter state
  const [mounted, setMounted] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => { setMounted(true); }, []);

  const methodes = ["Tous", ...Array.from(new Set(ANALYSES_ACR.map((a) => a.methode)))];

  const baseData = useMemo(() =>
    ANALYSES_ACR.filter((a) =>
      (!activeSites || activeSites.includes(a.site)) &&
      isoDateInRange(a.date_evenement, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const filtered = useMemo(() =>
    methodeFilter === "Tous" ? baseData : baseData.filter((a) => a.methode === methodeFilter),
  [baseData, methodeFilter]);

  // Column options derived from the methode-filtered data
  const colOptions = useMemo(() =>
    Object.fromEntries(COL_DEFS.map(({ key, get }) => [
      key, Array.from(new Set(filtered.map(get))).sort(),
    ])),
  [filtered]);

  // Table data further filtered by active column filters
  const tableData = useMemo(() =>
    filtered.filter((a) =>
      COL_DEFS.every(({ key, get }) => {
        if (!(key in colFilters)) return true;
        const vals = colFilters[key] ?? [];
        return vals.length === 0 ? false : vals.includes(get(a));
      })
    ),
  [filtered, colFilters]);

  const summary = useMemo(() => ({
    total:        baseData.length,
    finalises:    baseData.filter((a) => a.statut === "Finalise" || a.statut === "Cloture" || a.statut === "Actions lancees").length,
    enCours:      baseData.filter((a) => a.statut === "En cours").length,
    retexDiffuse: baseData.filter((a) => a.retex_diffuse).length,
  }), [baseData]);

  const selectedAnalyse = useMemo(() =>
    selected ? ANALYSES_ACR.find((a) => a.id === selected) : null,
  [selected]);

  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    baseData.forEach((a) => { m[a.type_evenement] = (m[a.type_evenement] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [baseData]);

  const actionStats = useMemo(() => {
    const all = baseData.flatMap((a) => a.actions_correctives);
    return {
      total:   all.length,
      realise: all.filter((ac) => ac.statut === "Realise").length,
      enCours: all.filter((ac) => ac.statut === "En cours").length,
      taux:    all.length ? Math.round((all.filter((ac) => ac.statut === "Realise").length / all.length) * 100) : 0,
    };
  }, [baseData]);

  // Cause type breakdown across all analyses
  const byCauseType = useMemo(() => {
    const m: Record<string, number> = {};
    baseData.forEach((a) => {
      a.causes.forEach((c) => { m[c.type] = (m[c.type] ?? 0) + 1; });
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [baseData]);

  // Per-analyse action completion
  const analyseProgress = useMemo(() =>
    baseData.map((a) => {
      const tot = a.actions_correctives.length;
      const ok  = a.actions_correctives.filter((ac) => ac.statut === "Realise").length;
      return { acrId:a.id, label:a.evenement_ref, taux:tot ? Math.round((ok/tot)*100) : 0, ok, tot };
    }),
  [baseData]);

  // By statut pie
  const byStatut = useMemo(() => {
    const m: Record<string, number> = {};
    baseData.forEach((a) => { m[a.statut] = (m[a.statut] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [baseData]);

  const tauxActions = actionStats.taux;

  // --- Column filter logic ---
  function toggleColValue(col: string, val: string) {
    setColFilters((prev) => {
      const all = colOptions[col] ?? [];
      const inPrev = col in prev;
      const cur = inPrev ? (prev[col] ?? []) : all;
      let next: string[];
      if (!inPrev)               { next = all.filter((v) => v !== val); }
      else if (cur.includes(val)) { next = cur.filter((v) => v !== val); }
      else                        { next = [...cur, val]; }
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

  function filterTh(key: string, label: string) {
    const isActive = key in colFilters;
    const isOpen = openCol === key;
    return (
      <th key={key} style={{ padding:"4px 8px", textAlign:"left" }}>
        <button
          ref={(el) => { btnRefs.current[key] = el; }}
          type="button"
          onClick={() => openDropdown(key)}
          style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: isOpen ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: isOpen ? "#eff6ff" : isActive ? "#f0f9ff" : "transparent", color: isActive ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}>
          {label}
          {isActive
            ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters[key] ?? []).length}</span>
            : <span style={{ fontSize:10, opacity:0.5 }}>▾</span>}
        </button>
      </th>
    );
  }

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>
            Analyses des Causes Racines (ACR / RETEX)
            {hasAnyColFilter && (
              <button type="button" onClick={() => setColFilters({})}
                style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #dc2626", background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontWeight:700, marginLeft:8 }}>
                ✕ Réinitialiser colonnes
              </button>
            )}
          </h2>
          <p>{summary.total} analyses — {summary.finalises} finalisées — {summary.retexDiffuse} RETEX diffusés — {tauxActions}% des actions réalisées.</p>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {methodes.map((m) => (
            <button key={m} type="button" className={methodeFilter === m ? "periodBtn active" : "periodBtn"} onClick={() => setMethodeFilter(m)} style={{ fontSize:11 }}>{m}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="acrKpis">
        {([
          { label:"Analyses réalisées",  val:summary.total,       icon:Target,       color:"#0f766e" },
          { label:"En cours d'analyse",  val:summary.enCours,     icon:AlertCircle,  color:"#d97706" },
          { label:"RETEX diffusés",      val:summary.retexDiffuse,icon:Share2,       color:"#2563eb" },
          { label:"Actions réalisées",   val:`${actionStats.realise}/${actionStats.total}`, icon:Wrench, color: tauxActions >= 80 ? "#16a34a" : "#d97706" },
          { label:"Taux completion",     val:`${tauxActions}%`,   icon:TrendingUp,   color: tauxActions >= 80 ? "#16a34a" : "#dc2626" },
          { label:"Analyses clôturées",  val:summary.finalises,   icon:CheckCircle2, color:"#64748b" },
        ] as { label:string; val:string|number; icon:React.ElementType; color:string }[]).map(({ label, val, icon:Icon, color }) => (
          <div key={label} className="acrKpiCard" style={{ "--acr-color": color } as React.CSSProperties}>
            <div style={{ display:"flex", justifyContent:"space-between", width:"100%" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <strong style={{ color, fontSize:22, fontWeight:700, lineHeight:1 }}>{val}</strong>
          </div>
        ))}
      </div>

      {/* Global action progress */}
      <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--line)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
          <span style={{ color:"var(--muted)", fontWeight:500 }}>Avancement global des actions correctives</span>
          <span style={{ fontWeight:700, color: tauxActions >= 80 ? "#16a34a" : "#d97706" }}>{tauxActions}%</span>
        </div>
        <div style={{ height:8, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ display:"flex", height:"100%", overflow:"hidden", borderRadius:99 }}>
            <div style={{ width:`${tauxActions}%`, background:"linear-gradient(90deg,#16a34a,#0f766e)", transition:"width .5s" }} />
            <div style={{ width:`${actionStats.total > 0 ? Math.round((actionStats.enCours / actionStats.total) * 100) : 0}%`, background:"#d97706" }} />
            <div style={{ flex:1, background:"var(--line)" }} />
          </div>
        </div>
        <div style={{ display:"flex", gap:16, marginTop:6, fontSize:11, flexWrap:"wrap" }}>
          <span style={{ color:"#16a34a" }}>● Réalisées : {actionStats.realise}</span>
          <span style={{ color:"#d97706" }}>● En cours : {actionStats.enCours}</span>
          <span style={{ color:"var(--muted)" }}>● Total : {actionStats.total}</span>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Type d'événement */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Analyses par type d'événement</h2><p>Distribution par catégorie d'accident analysé.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Bar dataKey="value" name="Analyses" radius={[0,4,4,0]}>
                  {byType.map((_, i) => <Cell key={i} fill={METHODE_COLOR[i % METHODE_COLOR.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Cause type distribution */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Répartition des types de causes</h2><p>Organisationnelle / Technique / Humaine / Environnementale.</p></div></div>
          <div className="chart compact" style={{ position:"relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCauseType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48}>
                  {byCauseType.map((e) => <Cell key={e.name} fill={CAUSE_TYPE_COLOR[e.name] ?? "#94a3b8"} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-65%)", textAlign:"center", pointerEvents:"none" }}>
              <div style={{ fontSize:18, fontWeight:800, color:"var(--text)" }}>{byCauseType.reduce((s, e) => s + e.value, 0)}</div>
              <div style={{ fontSize:10, color:"var(--muted)" }}>causes</div>
            </div>
          </div>
        </article>
      </div>

      {/* Charts row 2 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Per-analyse action completion */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Taux de completion par analyse</h2><p>Actions réalisées (%) pour chaque événement analysé.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyseProgress} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis type="number" domain={[0,100]} tickLine={false} axisLine={false} unit="%" tick={{ fontSize:10 }} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v, n) => [`${v}%`, "Completion"]} contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Bar dataKey="taux" name="Completion" radius={[0,4,4,0]}>
                  {analyseProgress.map((e) => <Cell key={e.acrId} fill={e.taux >= 80 ? "#16a34a" : e.taux >= 50 ? "#d97706" : "#dc2626"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Statut des analyses */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Statut des analyses</h2><p>Avancement du processus ACR par statut.</p></div></div>
          <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
            {byStatut.map(({ name, value }) => {
              const color = STATUT_COLOR[name as StatutACR] ?? "#94a3b8";
              const pct   = summary.total > 0 ? Math.round((value / summary.total) * 100) : 0;
              return (
                <div key={name}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:10, height:10, background:color, borderRadius:2, display:"inline-block" }} />
                      <span style={{ fontWeight:500 }}>{name}</span>
                    </div>
                    <span style={{ color, fontWeight:700 }}>{value} ({pct}%)</span>
                  </div>
                  <div style={{ height:6, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width .5s" }} />
                  </div>
                </div>
              );
            })}

            {/* RETEX diffusion */}
            <div style={{ marginTop:8, padding:"10px 12px", background:"var(--bg)", borderRadius:8, border:"1px solid var(--line)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                <span style={{ fontWeight:500 }}>RETEX diffusés</span>
                <span style={{ color:"#2563eb", fontWeight:700 }}>{summary.retexDiffuse}/{summary.total}</span>
              </div>
              <div style={{ height:6, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
                <div style={{ width:`${summary.total > 0 ? Math.round((summary.retexDiffuse / summary.total) * 100) : 0}%`, height:"100%", background:"#2563eb", borderRadius:99 }} />
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Table */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader">
          <div>
            <h2>Registre des analyses ACR — {tableData.length}/{filtered.length} analyse{filtered.length > 1 ? "s" : ""}</h2>
            <p>Cliquer sur une ligne pour afficher causes et actions correctives.</p>
          </div>
        </div>

        {/* Portal column-filter dropdown */}
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
                <th>Réf. événement</th>
                <th>Date</th>
                {filterTh("site", "Site")}
                {filterTh("type", "Type")}
                {filterTh("methode", "Méthode")}
                {filterTh("resp", "Responsable")}
                <th>Date analyse</th>
                <th>RETEX</th>
                {filterTh("statut", "Statut")}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((a, idx) => {
                const ok  = a.actions_correctives.filter((ac) => ac.statut === "Realise").length;
                const tot = a.actions_correctives.length;
                return (
                  <React.Fragment key={`${a.id}-${idx}`}>
                    <tr style={{ cursor:"pointer", background:selected === a.id ? "var(--primary-light)" : undefined }}
                      onClick={() => setSelected(selected === a.id ? null : a.id)}>
                      <td><code style={{ fontSize:11 }}>{a.evenement_ref}</code></td>
                      <td style={{ fontSize:12 }}>{a.date_evenement}</td>
                      <td>{a.site}</td>
                      <td style={{ fontSize:12 }}>{a.type_evenement}</td>
                      <td><span className="status" style={{ background:"var(--bg)", color:"var(--muted)", fontSize:11 }}>{a.methode}</span></td>
                      <td style={{ fontSize:12 }}>{a.responsable_analyse}</td>
                      <td style={{ fontSize:12 }}>{a.date_analyse}</td>
                      <td style={{ textAlign:"center" }}>
                        <span style={{ color:a.retex_diffuse ? "#16a34a" : "#dc2626", fontSize:16 }}>{a.retex_diffuse ? "✓" : "✗"}</span>
                      </td>
                      <td><span className="status" style={{ background:`${STATUT_COLOR[a.statut]}22`, color:STATUT_COLOR[a.statut], fontSize:11 }}>{a.statut}</span></td>
                      <td>
                        <span style={{ fontSize:12, fontWeight:600, color:ok === tot ? "#16a34a" : ok > 0 ? "#d97706" : "#dc2626" }}>{ok}/{tot}</span>
                      </td>
                    </tr>
                    {selected === a.id && selectedAnalyse && (
                      <tr key={`${a.id}-detail`}>
                        <td colSpan={10} style={{ background:"var(--bg)", padding:"16px 20px" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                            <div>
                              <p style={{ fontWeight:600, marginBottom:8, fontSize:13 }}>Événement : {a.description_evenement}</p>
                              <p style={{ fontWeight:600, margin:"12px 0 8px", fontSize:12 }}>Causes identifiées ({a.causes.length})</p>
                              {a.causes.map((c, i) => (
                                <div key={i} style={{ marginBottom:6, display:"flex", gap:8, alignItems:"flex-start", fontSize:12 }}>
                                  <span className="status" style={{ background:`${CAUSE_TYPE_COLOR[c.type] ?? "#94a3b8"}22`, color:CAUSE_TYPE_COLOR[c.type] ?? "#64748b", fontSize:10, flexShrink:0 }}>{c.type}</span>
                                  <span>{c.description}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p style={{ fontWeight:600, marginBottom:8, fontSize:12 }}>Actions correctives ({a.actions_correctives.filter((ac) => ac.statut === "Realise").length}/{a.actions_correctives.length} réalisées)</p>
                              {a.actions_correctives.map((ac, i) => (
                                <div key={i} style={{ marginBottom:8, fontSize:12, display:"flex", gap:8, alignItems:"flex-start" }}>
                                  <span style={{ color:ac.statut === "Realise" ? "#16a34a" : "#d97706", flexShrink:0, fontSize:16 }}>{ac.statut === "Realise" ? "✓" : "○"}</span>
                                  <div>
                                    <div style={{ fontWeight:500 }}>{ac.action}</div>
                                    <div style={{ color:"var(--muted)", fontSize:11 }}>{ac.responsable} — Éch. {ac.echeance}</div>
                                  </div>
                                </div>
                              ))}
                              <div style={{ marginTop:12, padding:"8px 12px", background:"#f0fdf4", borderRadius:6, border:"1px solid #bbf7d0" }}>
                                <p style={{ fontWeight:600, fontSize:11, color:"#0f766e", marginBottom:4 }}>Leçon apprise</p>
                                <p style={{ fontSize:12, color:"#166534", fontStyle:"italic" }}>{a.lecons_apprises}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
