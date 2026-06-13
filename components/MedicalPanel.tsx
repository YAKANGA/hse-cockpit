"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { VISITES_MEDICALES, getMedicalSummary, type Aptitude } from "@/lib/medical-data";
import { AlertTriangle, CheckCircle2, Clock, Activity } from "lucide-react";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";

const APTITUDE_COLOR: Record<Aptitude, string> = {
  "Apte":                   "#16a34a",
  "Apte avec restrictions": "#d97706",
  "Inapte temporaire":      "#dc2626",
  "Inapte definitif":       "#7f1d1d",
};

const TYPE_COLOR: Record<string, string> = {
  "Embauche":    "#2563eb",
  "Periodique":  "#0f766e",
  "Reprise":     "#d97706",
  "Spontanee":   "#7c3aed",
  "Pre-reprise": "#ea580c",
};

const today = new Date().toISOString().slice(0, 10);

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - new Date(today).getTime()) / 86400000);
}

const COL_DEFS_MED = [
  { key: "site",        label: "Site",        get: (v: typeof VISITES_MEDICALES[0]) => v.site },
  { key: "type_visite", label: "Type visite", get: (v: typeof VISITES_MEDICALES[0]) => v.type_visite },
  { key: "aptitude",    label: "Aptitude",    get: (v: typeof VISITES_MEDICALES[0]) => v.aptitude },
  { key: "poste",       label: "Poste",       get: (v: typeof VISITES_MEDICALES[0]) => v.poste },
];

export function MedicalPanel() {
  const summary = useMemo(() => getMedicalSummary(), []);
  const [visitFilter, setVisitFilter] = useState<"Tous" | "En retard" | "A venir">("Tous");

  const [mounted, setMounted]         = useState(false);
  const [colFilters, setColFilters]   = useState<Record<string, string[]>>({});
  const [openCol, setOpenCol]         = useState<string | null>(null);
  const [dropPos, setDropPos]         = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => { setMounted(true); }, []);

  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  const baseData = useMemo(() =>
    VISITES_MEDICALES.filter((v) =>
      (!activeSites || activeSites.includes(v.site)) &&
      isoDateInRange(v.date_visite, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const filtered = useMemo(() => {
    const d30 = new Date(); d30.setDate(d30.getDate() + 30);
    return baseData.filter((v) =>
      visitFilter === "Tous" ||
      (visitFilter === "En retard" && v.date_prochaine < today) ||
      (visitFilter === "A venir"   && v.date_prochaine >= today && v.date_prochaine <= d30.toISOString().slice(0, 10))
    );
  }, [baseData, visitFilter]);

  const colOptions = useMemo(() =>
    Object.fromEntries(COL_DEFS_MED.map(({ key, get }) => [
      key, Array.from(new Set(filtered.map(get))).sort(),
    ])),
  [filtered]);

  const tableData = useMemo(() =>
    filtered.filter((v) =>
      COL_DEFS_MED.every(({ key, get }) => {
        if (!(key in colFilters)) return true;
        const vals = colFilters[key] ?? [];
        return vals.length === 0 ? false : vals.includes(get(v));
      })
    ),
  [filtered, colFilters]);

  const byAptitude = useMemo(() => {
    const m: Record<string, number> = {};
    baseData.forEach((v) => { m[v.aptitude] = (m[v.aptitude] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [baseData]);

  const bySite = useMemo(() => {
    const m: Record<string, { aJour: number; enRetard: number }> = {};
    baseData.forEach((v) => {
      if (!m[v.site]) m[v.site] = { aJour: 0, enRetard: 0 };
      v.date_prochaine < today ? m[v.site].enRetard++ : m[v.site].aJour++;
    });
    return Object.entries(m).map(([s, v]) => ({ site: s, ...v }));
  }, [baseData]);

  // Upcoming visits timeline (sorted by date_prochaine)
  const upcomingTimeline = useMemo(() =>
    [...baseData]
      .map((v) => ({ ...v, jours: daysUntil(v.date_prochaine) }))
      .sort((a, b) => a.jours - b.jours)
      .slice(0, 8),
  [baseData]);

  // Type de visite distribution
  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    baseData.forEach((v) => { m[v.type_visite] = (m[v.type_visite] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [baseData]);

  const enRetard  = baseData.filter((v) => v.date_prochaine < today).length;
  const tauxAJour = baseData.length > 0 ? Math.round(((baseData.length - enRetard) / baseData.length) * 100) : 0;
  const aVenir30j = baseData.filter((v) => {
    const j = daysUntil(v.date_prochaine);
    return j >= 0 && j <= 30;
  }).length;

  const kpis = [
    { label:"Visites à jour",          val: baseData.filter((v) => v.aptitude === "Apte").length,             color:"#16a34a", icon: CheckCircle2, sub:`${tauxAJour}% de l'effectif` },
    { label:"Avec restrictions",       val: baseData.filter((v) => v.aptitude === "Apte avec restrictions").length, color:"#d97706", icon: AlertTriangle, sub:"aptitude partielle" },
    { label:"Inaptes",                 val: baseData.filter((v) => v.aptitude.startsWith("Inapte")).length,   color:"#dc2626", icon: AlertTriangle, sub:"temporaire ou définitif" },
    { label:"Visites en retard",       val: enRetard,                                                          color:"#dc2626", icon: Clock,         sub:"à planifier d'urgence" },
    { label:"Échéance < 30 jours",     val: aVenir30j,                                                         color:"#d97706", icon: Activity,      sub:"à anticiper" },
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

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Suivi des Visites Médicales &amp; Aptitudes</h2>
          <p>{baseData.length}/{summary.total} salariés suivis — {tauxAJour}% à jour — {enRetard} en retard — <strong>{filterLabel}</strong>.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="medicalKpis">
        {kpis.map(({ label, val, icon: Icon, color, sub }) => (
          <div key={label} className="medicalKpiCard" style={{ "--med-color": color } as React.CSSProperties}>
            <div style={{ display:"flex", justifyContent:"space-between", width:"100%" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <strong style={{ color, fontSize:26, fontWeight:700, lineHeight:1 }}>{val}</strong>
            <div style={{ width:"100%", height:3, background:"var(--line)", borderRadius:99, marginTop:4 }}>
              <div style={{ width:`${baseData.length > 0 ? Math.round((val / baseData.length) * 100) : 0}%`, height:"100%", background:color, borderRadius:99, transition:"width .5s" }} />
            </div>
            <small style={{ color:"var(--muted)", fontSize:11 }}>{sub}</small>
          </div>
        ))}
      </div>

      {/* Compliance progress */}
      <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--line)", maxWidth:"60%" }}>
        <span style={{ fontSize:12, color:"var(--muted)", fontWeight:500 }}>Suivi de conformité des visites médicales</span>
        <div style={{ position:"relative", height:16, margin:"8px 0 4px" }}>
          <div style={{ position:"absolute", top:"50%", left:0, right:0, height:5, background:"var(--line)", borderRadius:99, overflow:"hidden", transform:"translateY(-50%)" }}>
            <div style={{ display:"flex", height:"100%", borderRadius:99 }}>
              <div style={{ width:`${tauxAJour}%`, background:"linear-gradient(90deg,#16a34a,#0f766e)", transition:"width .5s" }} />
              <div style={{ width:`${baseData.length > 0 ? Math.round((aVenir30j / baseData.length) * 100) : 0}%`, background:"#d97706" }} />
              <div style={{ flex:1, background:"#dc2626" }} />
            </div>
          </div>
          <span style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:700, color: tauxAJour >= 80 ? "#16a34a" : "#d97706", whiteSpace:"nowrap", background:"var(--bg)", paddingLeft:6 }}>
            {tauxAJour}% à jour
          </span>
        </div>
        <div style={{ display:"flex", gap:16, marginTop:4, fontSize:11, flexWrap:"wrap" }}>
          <span style={{ color:"#16a34a" }}>● À jour : {baseData.length - enRetard}</span>
          <span style={{ color:"#d97706" }}>{"● Échéance < 30j"} : {aVenir30j}</span>
          <span style={{ color:"#dc2626" }}>● En retard : {enRetard}</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", alignItems:"center", gap:8, margin:"44px 0 0" }}>
        <div style={{ display:"flex", gap:3, background:"var(--hover)", borderRadius:8, padding:"3px" }}>
          {(["Tous","En retard","A venir"] as const).map((f) => {
            const active = visitFilter === f;
            const color  = f === "En retard" ? "#dc2626" : f === "A venir" ? "#d97706" : undefined;
            return (
              <button key={f} type="button" onClick={() => setVisitFilter(f)}
                style={{ fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:6, border:"none", cursor:"pointer", transition:"all 0.15s",
                  background: active ? (color ?? "var(--primary)") : "transparent",
                  color: active ? "#fff" : color ?? "var(--muted)" }}>
                {f}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize:12, color:"var(--muted)", fontWeight:500 }}>{filtered.length} salarié{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {/* Charts row 1 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Upcoming visits timeline */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Planning des prochaines visites</h2><p>Salariés triés par date de prochaine visite (les 8 plus proches).</p></div></div>
          <div style={{ padding:"8px 0" }}>
            {upcomingTimeline.map((v) => {
              const retard  = v.jours < 0;
              const urgent  = v.jours >= 0 && v.jours <= 30;
              const color   = retard ? "#dc2626" : urgent ? "#d97706" : "#16a34a";
              const barW    = retard ? 100 : Math.max(0, Math.min(100, 100 - Math.round(v.jours / 365 * 100)));
              return (
                <div key={v.id} style={{ padding:"8px 16px", borderBottom:"1px solid var(--line)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <span style={{ fontSize:12, fontWeight:600 }}>{v.nom} {v.prenom}</span>
                      <span style={{ fontSize:11, color:"var(--muted)", marginLeft:8 }}>{v.poste} — {v.site}</span>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <span style={{ fontSize:12, fontWeight:700, color }}>
                        {retard ? `Retard ${-v.jours}j` : v.jours === 0 ? "Aujourd'hui" : `Dans ${v.jours}j`}
                      </span>
                      <div style={{ fontSize:10, color:"var(--muted)" }}>{v.date_prochaine} — {v.type_visite}</div>
                    </div>
                  </div>
                  <div style={{ height:3, background:"var(--line)", borderRadius:99, overflow:"hidden", marginTop:5 }}>
                    <div style={{ width:`${barW}%`, height:"100%", background:color, borderRadius:99, transition:"width .5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* Aptitude donut */}
        <article className="panel" style={{ display:"flex", flexDirection:"column" }}>
          <div className="panelHeader"><div><h2>Répartition des aptitudes</h2><p>Situation médicale actuelle du personnel.</p></div></div>
          <div style={{ flex:1, position:"relative", minHeight:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top:8, right:8, bottom:8, left:8 }}>
                <Pie
                  data={byAptitude}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="46%"
                  outerRadius="40%"
                  innerRadius="24%"
                  labelLine={false}
                  label={({ cx: pcx, cy: pcy, midAngle, innerRadius: ir, outerRadius: or, value }) => {
                    if (!value) return null;
                    const RADIAN = Math.PI / 180;
                    const inner = Number(ir ?? 0);
                    const outer = Number(or ?? inner);
                    const angle = Number(midAngle ?? 0);
                    const r = inner + (outer - inner) * 0.55;
                    const x = Number(pcx ?? 0) + r * Math.cos(-angle * RADIAN);
                    const y = Number(pcy ?? 0) + r * Math.sin(-angle * RADIAN);
                    return (
                      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
                        {value}
                      </text>
                    );
                  }}
                >
                  {byAptitude.map((e) => <Cell key={e.name} fill={APTITUDE_COLOR[e.name as Aptitude] ?? "#94a3b8"} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, textAlign:"center" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:"absolute", top:"46%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center", pointerEvents:"none" }}>
              <div style={{ fontSize:22, fontWeight:800, color: tauxAJour >= 80 ? "#16a34a" : "#d97706" }}>{tauxAJour}%</div>
              <div style={{ fontSize:10, color:"var(--muted)" }}>à jour</div>
            </div>
          </div>
        </article>
      </div>

      {/* Charts row 2 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Site compliance */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Conformité par site</h2><p>Visites à jour vs en retard par localisation.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySite} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="aJour"    name="À jour"    fill="#16a34a" stackId="a" />
                <Bar dataKey="enRetard" name="En retard" fill="#dc2626" stackId="a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Type de visite */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Distribution par type de visite</h2><p>Répartition des visites réalisées.</p></div></div>
          <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
            {byType.map(({ name, value }) => {
              const color = TYPE_COLOR[name] ?? "#94a3b8";
              const pct   = baseData.length > 0 ? Math.round((value / baseData.length) * 100) : 0;
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
          </div>
        </article>
      </div>

      {/* Table */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader">
          <div>
            <h2>Registre des visites médicales</h2>
            <p>
              {tableData.length}/{filtered.length} enregistrement{filtered.length > 1 ? "s" : ""}.
              {hasAnyColFilter && (
                <button
                  type="button"
                  onClick={() => setColFilters({})}
                  style={{ marginLeft:10, fontSize:11, color:"#2563eb", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", padding:0 }}>
                  Réinitialiser les filtres
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Portal dropdown */}
        {mounted && openCol && createPortal(
          <>
            <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setOpenCol(null)} />
            <div style={{ position:"absolute", top:dropPos.top + 2, left:dropPos.left, zIndex:9999, background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, boxShadow:"0 8px 28px rgba(0,0,0,0.14)", minWidth:190, maxHeight:310, display:"flex", flexDirection:"column" }}>
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
              <label style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", borderTop:"1px solid #e5e7eb", cursor:"pointer", fontSize:12, background:"#f9fafb", borderRadius:"0 0 8px 8px" }}>
                <input
                  type="checkbox"
                  checked={!(openCol in colFilters)}
                  ref={(el) => { if (el) el.indeterminate = (openCol in colFilters) && (colFilters[openCol]?.length ?? 0) > 0; }}
                  onChange={() => {
                    const isAll = !(openCol in colFilters);
                    if (isAll) { setColFilters((p) => ({ ...p, [openCol]: [] })); }
                    else       { setColFilters((p) => { const c = { ...p }; delete c[openCol]; return c; }); }
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
                <th>Nom</th>
                <th>Prénom</th>
                {/* Filterable: Poste */}
                <th style={{ whiteSpace:"nowrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span>Poste</span>
                    <button
                      type="button"
                      ref={(el) => { btnRefs.current["poste"] = el; }}
                      onClick={() => openDropdown("poste")}
                      title="Filtrer par Poste"
                      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:18, height:18, borderRadius:4, border: "poste" in colFilters ? "1.5px solid #2563eb" : "1px solid #d1d5db", background: "poste" in colFilters ? "#eff6ff" : "transparent", cursor:"pointer", padding:0, flexShrink:0 }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M1 2.5h8M2.5 5h5M4 7.5h2" stroke={ "poste" in colFilters ? "#2563eb" : "#6b7280"} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </th>
                {/* Filterable: Site */}
                <th style={{ whiteSpace:"nowrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span>Site</span>
                    <button
                      type="button"
                      ref={(el) => { btnRefs.current["site"] = el; }}
                      onClick={() => openDropdown("site")}
                      title="Filtrer par Site"
                      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:18, height:18, borderRadius:4, border: "site" in colFilters ? "1.5px solid #2563eb" : "1px solid #d1d5db", background: "site" in colFilters ? "#eff6ff" : "transparent", cursor:"pointer", padding:0, flexShrink:0 }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M1 2.5h8M2.5 5h5M4 7.5h2" stroke={ "site" in colFilters ? "#2563eb" : "#6b7280"} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </th>
                {/* Filterable: Type visite */}
                <th style={{ whiteSpace:"nowrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span>Type visite</span>
                    <button
                      type="button"
                      ref={(el) => { btnRefs.current["type_visite"] = el; }}
                      onClick={() => openDropdown("type_visite")}
                      title="Filtrer par Type visite"
                      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:18, height:18, borderRadius:4, border: "type_visite" in colFilters ? "1.5px solid #2563eb" : "1px solid #d1d5db", background: "type_visite" in colFilters ? "#eff6ff" : "transparent", cursor:"pointer", padding:0, flexShrink:0 }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M1 2.5h8M2.5 5h5M4 7.5h2" stroke={ "type_visite" in colFilters ? "#2563eb" : "#6b7280"} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </th>
                <th>Date visite</th>
                <th>Prochaine visite</th>
                <th>Échéance</th>
                {/* Filterable: Aptitude */}
                <th style={{ whiteSpace:"nowrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span>Aptitude</span>
                    <button
                      type="button"
                      ref={(el) => { btnRefs.current["aptitude"] = el; }}
                      onClick={() => openDropdown("aptitude")}
                      title="Filtrer par Aptitude"
                      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:18, height:18, borderRadius:4, border: "aptitude" in colFilters ? "1.5px solid #2563eb" : "1px solid #d1d5db", background: "aptitude" in colFilters ? "#eff6ff" : "transparent", cursor:"pointer", padding:0, flexShrink:0 }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M1 2.5h8M2.5 5h5M4 7.5h2" stroke={ "aptitude" in colFilters ? "#2563eb" : "#6b7280"} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </th>
                <th>Restrictions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((v) => {
                const retard = v.date_prochaine < today;
                const jours  = daysUntil(v.date_prochaine);
                return (
                  <tr key={v.id} style={{ background: retard ? "#fef2f222" : undefined }}>
                    <td style={{ fontWeight:600 }}>{v.nom}</td>
                    <td>{v.prenom}</td>
                    <td style={{ fontSize:12, color:"var(--muted)" }}>{v.poste}</td>
                    <td>{v.site}</td>
                    <td><span className="status" style={{ background:`${TYPE_COLOR[v.type_visite] ?? "#94a3b8"}22`, color:TYPE_COLOR[v.type_visite] ?? "#64748b", fontSize:11 }}>{v.type_visite}</span></td>
                    <td style={{ fontSize:12 }}>{v.date_visite}</td>
                    <td style={{ fontSize:12 }}>{v.date_prochaine}</td>
                    <td>
                      {(() => {
                        const abs   = Math.abs(jours);
                        const color = retard ? "#dc2626" : jours <= 30 ? "#d97706" : "#16a34a";
                        const label = retard ? `Retard ${abs}j` : `Dans ${jours}j`;
                        return (
                          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                            <span style={{ fontSize:12, fontWeight:700, color }}>{label}</span>
                            <div style={{ height:3, width:64, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
                              <div style={{ height:"100%", borderRadius:99, background:color,
                                width: retard ? "100%" : `${Math.max(4, Math.min(100, 100 - Math.round(jours / 365 * 100)))}%`,
                                transition:"width .5s" }} />
                            </div>
                            <span style={{ fontSize:10, color:"var(--muted)" }}>{v.type_visite}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td><span className="status" style={{ background:`${APTITUDE_COLOR[v.aptitude]}22`, color:APTITUDE_COLOR[v.aptitude], fontSize:11 }}>{v.aptitude}</span></td>
                    <td style={{ fontSize:11, color:"var(--muted)", maxWidth:180 }}>{v.restrictions || "—"}</td>
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
