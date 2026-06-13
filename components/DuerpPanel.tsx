"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { RISQUES_DUERP, getNiveauRisque, type StatutDuerp } from "@/lib/duerp-data";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, TrendingDown } from "lucide-react";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";

const NIVEAU_COLOR: Record<string, string> = {
  Critique:   "#dc2626",
  Eleve:      "#ea580c",
  Modere:     "#d97706",
  Acceptable: "#16a34a",
};

const STATUT_COLOR: Record<StatutDuerp, string> = {
  "Maitrise":               "#16a34a",
  "En cours de traitement": "#d97706",
  "Non traite":             "#dc2626",
};

const NIVEAUX = ["Tous", "Critique", "Eleve", "Modere", "Acceptable"];

const COL_DEFS_DUERP = [
  { key: "site",   label: "Site",        get: (r: typeof RISQUES_DUERP[0]) => r.site },
  { key: "unite",  label: "Unité",       get: (r: typeof RISQUES_DUERP[0]) => r.unite_travail },
  { key: "resp",   label: "Responsable", get: (r: typeof RISQUES_DUERP[0]) => r.responsable },
  { key: "statut", label: "Statut",      get: (r: typeof RISQUES_DUERP[0]) => r.statut },
];

function matrixCellColor(f: number, g: number): string {
  const s = f * g;
  if (s >= 15) return "#dc2626";
  if (s >= 9)  return "#ea580c";
  if (s >= 5)  return "#d97706";
  return "#16a34a";
}

export function DuerpPanel() {
  const [niveau, setNiveau] = useState("Tous");
  const [statut, setStatut] = useState<StatutDuerp | "Tous">("Tous");

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
    activeSites ? RISQUES_DUERP.filter((r) => activeSites.includes(r.site)) : RISQUES_DUERP,
  [activeSites]);

  // site + date filtered (no UI niveau/statut filters) — base for all KPIs and charts
  const dateFiltered = useMemo(() =>
    baseData.filter((r) => isoDateInRange(r.date_evaluation, globalFilter.dateDebut, globalFilter.dateFin)),
  [baseData, globalFilter.dateDebut, globalFilter.dateFin]);

  // further filtered by UI niveau/statut toggles — for the table
  const filtered = useMemo(() => dateFiltered.filter((r) =>
    (niveau === "Tous" || getNiveauRisque(r.criticite) === niveau) &&
    (statut === "Tous" || r.statut === statut)
  ), [dateFiltered, niveau, statut]);

  // Options for each column filter (derived from filtered rows)
  const colOptions = useMemo(() =>
    Object.fromEntries(COL_DEFS_DUERP.map(({ key, get }) => [
      key, Array.from(new Set(filtered.map(get))).sort(),
    ])),
  [filtered]);

  // Rows shown in the table (after column filters applied on top of filtered)
  const tableData = useMemo(() =>
    filtered.filter((r) =>
      COL_DEFS_DUERP.every(({ key, get }) => {
        if (!(key in colFilters)) return true;
        const vals = colFilters[key] ?? [];
        return vals.length === 0 ? false : vals.includes(get(r));
      })
    ),
  [filtered, colFilters]);

  const summary = useMemo(() => {
    const src        = dateFiltered;
    const total      = src.length;
    const critique   = src.filter((r) => r.criticite >= 50).length;
    const eleve      = src.filter((r) => r.criticite >= 25 && r.criticite < 50).length;
    const modere     = src.filter((r) => r.criticite >= 10 && r.criticite < 25).length;
    const acceptable = src.filter((r) => r.criticite < 10).length;
    const maitrise   = src.filter((r) => r.statut === "Maitrise").length;
    const nonTraite  = src.filter((r) => r.statut === "Non traite").length;
    const criticiteMax = src.length > 0 ? Math.max(...src.map((r) => r.criticite)) : 0;
    const tauxMaitrise = total === 0 ? 0 : Math.round((maitrise / total) * 100);
    return { total, critique, eleve, modere, acceptable, maitrise, nonTraite, criticiteMax, tauxMaitrise };
  }, [dateFiltered]);

  // Risk matrix: rows = Gravité (5→1), cols = Fréquence (1→5)
  const riskMatrix = useMemo(() => {
    const grid: Record<string, typeof RISQUES_DUERP[0][]> = {};
    for (let f = 1; f <= 5; f++)
      for (let g = 1; g <= 5; g++)
        grid[`${f}-${g}`] = [];
    dateFiltered.forEach((r) => { grid[`${r.frequence}-${r.gravite}`]?.push(r); });
    return grid;
  }, [dateFiltered]);

  const bySiteStatut = useMemo(() => {
    const m: Record<string, Record<StatutDuerp, number>> = {};
    dateFiltered.forEach((r) => {
      if (!m[r.site]) m[r.site] = { "Maitrise": 0, "En cours de traitement": 0, "Non traite": 0 };
      m[r.site][r.statut]++;
    });
    return Object.entries(m).map(([s, v]) => ({ site: s, ...v }));
  }, [dateFiltered]);

  const byNiveau = useMemo(() => {
    const m: Record<string, number> = { Critique: 0, Eleve: 0, Modere: 0, Acceptable: 0 };
    dateFiltered.forEach((r) => { m[getNiveauRisque(r.criticite)]++; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [dateFiltered]);

  const maitrisePct = summary.total > 0 ? Math.round((summary.maitrise / summary.total) * 100) : 0;
  const enCoursPct  = summary.total > 0 ? Math.round(((summary.total - summary.maitrise - summary.nonTraite) / summary.total) * 100) : 0;

  const kpiDefs: [string, number, string, string, React.ElementType][] = [
    ["Critique",    summary.critique,   "Criticité ≥ 50",  "#dc2626", ShieldAlert],
    ["Élevé",       summary.eleve,      "Criticité 25–49", "#ea580c", AlertTriangle],
    ["Modéré",      summary.modere,     "Criticité 10–24", "#d97706", Clock],
    ["Acceptable",  summary.acceptable, "Criticité < 10",  "#16a34a", CheckCircle2],
    ["Maîtrisés",   summary.maitrise,   `${maitrisePct}% du total`,  "#0f766e", CheckCircle2],
    ["Non traités", summary.nonTraite,  "À planifier",     "#7c3aed", TrendingDown],
  ];

  const filterLabel = activeSites
    ? activeSites.length === 1 ? activeSites[0] : `${activeSites.length} sites`
    : "Tous les sites";

  const hasAnyColFilter = Object.keys(colFilters).length > 0;

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

  // Reusable header cell with filter button
  function filterTh(col: string, label: string) {
    const isActive = col in colFilters;
    return (
      <th>
        <div style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
          {label}
          <button
            ref={(el) => { btnRefs.current[col] = el; }}
            type="button"
            onClick={() => openDropdown(col)}
            title={`Filtrer par ${label}`}
            style={{
              border: "none",
              background: isActive ? "#2563eb" : "transparent",
              borderRadius: 4,
              padding: "1px 4px",
              cursor: "pointer",
              color: isActive ? "#fff" : "#9ca3af",
              fontSize: 10,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              transition: "background .15s",
            }}
          >
            ▼
          </button>
        </div>
      </th>
    );
  }

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Document Unique d'Évaluation des Risques (DUERP)</h2>
          <p>Ref : Code du travail CI — {tableData.length}/{filtered.length} risques affichés — {summary.critique} critiques — {summary.tauxMaitrise}% maîtrisés — <strong>{filterLabel}</strong>.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="duerpKpis">
        {kpiDefs.map(([label, val, sub, color, Icon]) => (
          <div key={label} className="duerpKpiCard" style={{ "--duerp-color": color } as React.CSSProperties}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", width:"100%" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <strong style={{ color, fontSize:26, fontWeight:700, lineHeight:1 }}>{val}</strong>
            <div style={{ width:"100%", height:3, background:"var(--line)", borderRadius:99, marginTop:4 }}>
              <div style={{ width:`${summary.total > 0 ? Math.round((val / summary.total) * 100) : 0}%`, height:"100%", background:color, borderRadius:99, transition:"width .5s ease" }} />
            </div>
            <small style={{ color:"var(--muted)", fontSize:11 }}>{sub}</small>
          </div>
        ))}
      </div>

      {/* Global maîtrise progress */}
      <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--line)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
          <span style={{ color:"var(--muted)", fontWeight:500 }}>Progression globale de maîtrise des risques</span>
          <span style={{ fontWeight:700, color: maitrisePct >= 50 ? "#16a34a" : "#d97706" }}>{maitrisePct}%</span>
        </div>
        <div style={{ height:10, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
          {summary.total > 0 && (
            <div style={{ display:"flex", height:"100%", borderRadius:99, overflow:"hidden" }}>
              <div style={{ width:`${maitrisePct}%`, background:"linear-gradient(90deg,#16a34a,#0f766e)", transition:"width .5s" }} />
              <div style={{ width:`${enCoursPct}%`, background:"#d97706" }} />
              <div style={{ flex:1, background:"#dc2626" }} />
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:16, marginTop:6, fontSize:11, flexWrap:"wrap" }}>
          <span style={{ color:"#16a34a" }}>● Maîtrisés : {summary.maitrise}</span>
          <span style={{ color:"#d97706" }}>● En cours : {summary.total - summary.maitrise - summary.nonTraite}</span>
          <span style={{ color:"#dc2626" }}>● Non traités : {summary.nonTraite}</span>
          <span style={{ color:"var(--muted)", marginLeft:"auto" }}>Criticité max : <strong style={{ color:"#dc2626" }}>{summary.criticiteMax}</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:6, margin:"14px 0 0", flexWrap:"wrap" }}>
        {NIVEAUX.map((n) => (
          <button key={n} type="button" className={niveau === n ? "periodBtn active" : "periodBtn"} onClick={() => setNiveau(n)}>{n}</button>
        ))}
        <span style={{ width:16 }} />
        {(["Tous","Maitrise","En cours de traitement","Non traite"] as (StatutDuerp | "Tous")[]).map((s) => (
          <button key={s} type="button" className={statut === s ? "periodBtn active" : "periodBtn"} onClick={() => setStatut(s)} style={{ fontSize:11 }}>{s}</button>
        ))}
      </div>

      {/* Charts row */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Risk Matrix F × G */}
        <article className="panel">
          <div className="panelHeader">
            <div><h2>Matrice des risques (F × G)</h2><p>Positionnement des {dateFiltered.length} risques. Survoler une cellule pour voir les dangers.</p></div>
          </div>
          <div style={{ padding:"0 16px 16px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"28px repeat(5, 1fr)", gap:3 }}>
              <div />
              {[1,2,3,4,5].map((f) => (
                <div key={f} style={{ fontSize:10, color:"var(--muted)", textAlign:"center", paddingBottom:3, fontWeight:600 }}>F={f}</div>
              ))}
              {[5,4,3,2,1].map((g) => (
                <div key={g} style={{ display:"contents" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"var(--muted)", fontWeight:600 }}>G={g}</div>
                  {[1,2,3,4,5].map((f) => {
                    const risks = riskMatrix[`${f}-${g}`] ?? [];
                    const clr   = matrixCellColor(f, g);
                    return (
                      <div key={`${f}-${g}`} title={risks.map((r) => r.danger).join(" / ")} style={{
                        background: risks.length ? `${clr}30` : `${clr}0a`,
                        border: `1.5px solid ${clr}${risks.length ? "55" : "1a"}`,
                        borderRadius:6, minHeight:48,
                        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1,
                        cursor: risks.length ? "help" : "default",
                        transition:"background .15s",
                      }}>
                        {risks.length > 0 && (
                          <>
                            <span style={{ fontSize:20, fontWeight:800, color:clr, lineHeight:1 }}>{risks.length}</span>
                            <span style={{ fontSize:9, color:"var(--muted)", textAlign:"center", lineHeight:1.2, padding:"0 3px", overflow:"hidden", maxWidth:"100%" }}>
                              {risks[0].danger.slice(0, 12)}{risks[0].danger.length > 12 ? "…" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:12, marginTop:10, fontSize:11, flexWrap:"wrap" }}>
              {([["≥15 Critique","#dc2626"],["9–14 Élevé","#ea580c"],["5–8 Modéré","#d97706"],["<5 Acceptable","#16a34a"]] as [string,string][]).map(([l,c]) => (
                <span key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ width:10, height:10, background:c, borderRadius:2, display:"inline-block" }} />
                  <span style={{ color:"var(--muted)" }}>{l}</span>
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* Stacked bar by site */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Maîtrise par site</h2><p>Avancement du traitement des risques par localisation.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySiteStatut} barSize={12} barCategoryGap="30%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12, border:"1px solid var(--line)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="Maitrise"               name="Maîtrisé"   fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="En cours de traitement" name="En cours"    fill="#d97706" radius={[4,4,0,0]} />
                <Bar dataKey="Non traite"             name="Non traité"  fill="#dc2626" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* Criticité distribution */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        <article className="panel">
          <div className="panelHeader"><div><h2>Distribution des niveaux de criticité</h2><p>Nombre de risques par niveau F×G×P.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byNiveau} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Bar dataKey="value" name="Risques" radius={[6,6,0,0]}>
                  {byNiveau.map((e) => <Cell key={e.name} fill={NIVEAU_COLOR[e.name]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Top risques critiques */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Top risques — criticité décroissante</h2><p>Priorités d'action immédiates.</p></div></div>
          <div style={{ padding:"8px 0" }}>
            {[...dateFiltered].sort((a, b) => b.criticite - a.criticite).slice(0, 6).map((r) => {
              const niv   = getNiveauRisque(r.criticite);
              const color = NIVEAU_COLOR[niv];
              const pct   = Math.round((r.criticite / 125) * 100);
              return (
                <div key={r.id} style={{ padding:"8px 16px", borderBottom:"1px solid var(--line)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:600, flex:1 }}>{r.danger}</span>
                    <span style={{ fontSize:11, fontWeight:700, color, marginLeft:8, whiteSpace:"nowrap" }}>{r.criticite} — {niv}</span>
                  </div>
                  <div style={{ height:4, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:3, fontSize:10, color:"var(--muted)" }}>
                    <span>{r.unite_travail} — {r.site}</span>
                    <span style={{ color: STATUT_COLOR[r.statut] }}>{r.statut}</span>
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
            <h2>Registre complet — {tableData.length}/{filtered.length} risque{filtered.length > 1 ? "s" : ""}</h2>
            <p>Score criticité = F × G × P. Utiliser les filtres colonnes ▼ pour affiner par site, unité, responsable ou statut.</p>
          </div>
          {hasAnyColFilter && (
            <button
              type="button"
              onClick={() => setColFilters({})}
              style={{
                border: "1px solid #e5e7eb",
                background: "#fff",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 11,
                color: "#2563eb",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Réinitialiser filtres
            </button>
          )}
        </div>

        {/* Portal dropdown */}
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
                {filterTh("unite", "Unité de travail")}
                {filterTh("site", "Site")}
                <th>Activité</th>
                <th>Danger</th>
                <th>Risque</th>
                <th style={{ textAlign:"center" }}>F</th>
                <th style={{ textAlign:"center" }}>G</th>
                <th style={{ textAlign:"center" }}>P</th>
                <th>Criticité</th>
                <th>Mesures existantes</th>
                <th>Mesures prévues</th>
                {filterTh("resp", "Responsable")}
                <th>Échéance</th>
                {filterTh("statut", "Statut")}
              </tr>
            </thead>
            <tbody>
              {tableData.map((r) => {
                const niv   = getNiveauRisque(r.criticite);
                const color = NIVEAU_COLOR[niv];
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight:600, fontSize:12 }}>{r.unite_travail}</td>
                    <td style={{ fontSize:12 }}>{r.site}</td>
                    <td style={{ fontSize:12 }}>{r.activite}</td>
                    <td style={{ fontSize:12 }}>{r.danger}</td>
                    <td style={{ fontSize:11, color:"var(--muted)", maxWidth:140 }}>{r.risque}</td>
                    <td style={{ textAlign:"center", fontWeight:700, color: r.frequence >= 4 ? "#dc2626" : "inherit" }}>{r.frequence}</td>
                    <td style={{ textAlign:"center", fontWeight:700, color: r.gravite    >= 4 ? "#dc2626" : "inherit" }}>{r.gravite}</td>
                    <td style={{ textAlign:"center", fontWeight:700, color: r.probabilite >= 4 ? "#dc2626" : "inherit" }}>{r.probabilite}</td>
                    <td><span className="envImportanceBadge" style={{ background:`${color}22`, color, borderColor:`${color}44`, fontSize:12, fontWeight:700 }}>{r.criticite} — {niv}</span></td>
                    <td style={{ fontSize:11, maxWidth:160 }}>{r.mesures_existantes}</td>
                    <td style={{ fontSize:11, maxWidth:160, color:"var(--muted)" }}>{r.mesures_prevues}</td>
                    <td style={{ fontSize:12, whiteSpace:"nowrap" }}>{r.responsable}</td>
                    <td style={{ fontSize:12 }}>{r.echeance}</td>
                    <td><span className="status" style={{ background:`${STATUT_COLOR[r.statut]}22`, color:STATUT_COLOR[r.statut], fontSize:11 }}>{r.statut}</span></td>
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
