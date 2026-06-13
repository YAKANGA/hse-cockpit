"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { HABILITATIONS, type StatutHabilitation } from "@/lib/training-data";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";

const STATUT_COLOR: Record<StatutHabilitation, string> = {
  "Valide":        "#16a34a",
  "A renouveler":  "#d97706",
  "Expire":        "#dc2626",
  "En cours":      "#2563eb",
};

const TYPES  = ["Tous", "Formation", "Habilitation", "Attestation", "Recyclage"];
const STATUTS: (StatutHabilitation | "Tous")[] = ["Tous", "Valide", "A renouveler", "Expire", "En cours"];

const today = new Date().toISOString().slice(0, 10);

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 9999;
  return Math.round((new Date(dateStr).getTime() - new Date(today).getTime()) / 86400000);
}

const COL_DEFS_TRAIN = [
  { key:"site",      label:"Site",      get:(h: typeof HABILITATIONS[0]) => h.site },
  { key:"type",      label:"Type",      get:(h: typeof HABILITATIONS[0]) => h.type },
  { key:"statut",    label:"Statut",    get:(h: typeof HABILITATIONS[0]) => h.statut },
  { key:"organisme", label:"Organisme", get:(h: typeof HABILITATIONS[0]) => h.organisme },
  { key:"poste",     label:"Poste",     get:(h: typeof HABILITATIONS[0]) => h.poste },
];

export function TrainingHabilitationsPanel() {
  const [type,   setType]   = useState("Tous");
  const [statut, setStatut] = useState<StatutHabilitation | "Tous">("Tous");

  const [mounted, setMounted] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => { setMounted(true); }, []);

  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  const baseData = useMemo(() =>
    HABILITATIONS.filter((h) =>
      (!activeSites || activeSites.includes(h.site)) &&
      isoDateInRange(h.date_formation, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const filtered = useMemo(() => baseData.filter((h) =>
    (type === "Tous" || h.type === type) &&
    (statut === "Tous" || h.statut === statut)
  ), [baseData, type, statut]);

  const colOptions = useMemo(() =>
    Object.fromEntries(COL_DEFS_TRAIN.map(({ key, get }) => [
      key, Array.from(new Set(filtered.map(get))).sort(),
    ])),
  [filtered]);

  const tableData = useMemo(() =>
    filtered.filter((h) =>
      COL_DEFS_TRAIN.every(({ key, get }) => {
        if (!(key in colFilters)) return true;
        const vals = colFilters[key] ?? [];
        return vals.length === 0 ? false : vals.includes(get(h));
      })
    ),
  [filtered, colFilters]);

  // Stacked bar per site (from baseData)
  const bySiteStatut = useMemo(() => {
    const m: Record<string, Record<StatutHabilitation, number>> = {};
    baseData.forEach((h) => {
      if (!m[h.site]) m[h.site] = { Valide: 0, "A renouveler": 0, Expire: 0, "En cours": 0 };
      m[h.site][h.statut]++;
    });
    return Object.entries(m).map(([s, v]) => ({ site: s, ...v }));
  }, [baseData]);

  // Pie data (filtered)
  const byStatut = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((h) => { m[h.statut] = (m[h.statut] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Upcoming expirations (sorted ascending, <90 days or expired)
  const urgentList = useMemo(() =>
    [...baseData]
      .filter((h) => h.date_expiration !== null)
      .map((h) => ({ ...h, jours: daysUntil(h.date_expiration) }))
      .filter((h) => h.jours <= 90)
      .sort((a, b) => a.jours - b.jours)
      .slice(0, 8),
  [baseData]);

  const summary = useMemo(() => {
    const total       = baseData.length;
    const valide      = baseData.filter((h) => h.statut === "Valide").length;
    const expire      = baseData.filter((h) => h.statut === "Expire").length;
    const aRenouveler = baseData.filter((h) => h.statut === "A renouveler").length;
    const enCours     = baseData.filter((h) => h.statut === "En cours").length;
    return { total, valide, expire, aRenouveler, enCours };
  }, [baseData]);
  const tauxAJour = summary.total > 0 ? Math.round((summary.valide / summary.total) * 100) : 0;

  const filterLabel = activeSites
    ? activeSites.length === 1 ? activeSites[0] : `${activeSites.length} sites`
    : "Tous les sites";

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

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Formations &amp; Habilitations du personnel</h2>
          <p>{baseData.length}/{summary.total} habilitations — {tauxAJour}% à jour — {summary.expire} expirées — <strong>{filterLabel}</strong>.</p>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--line)", fontSize:12 }}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="trainingKpis">
        {([
          ["Valide",        summary.valide,       CheckCircle2, "#16a34a"],
          ["A renouveler",  summary.aRenouveler,  Clock,        "#d97706"],
          ["Expire",        summary.expire,       AlertTriangle,"#dc2626"],
          ["En cours",      summary.enCours,      RefreshCw,    "#2563eb"],
        ] as [string, number, React.ElementType, string][]).map(([label, count, Icon, color]) => (
          <div key={label} className="trainingKpiCard"
            onClick={() => setStatut(statut === label ? "Tous" : label as StatutHabilitation)}
            role="button" tabIndex={0} style={{ cursor:"pointer", ...({"--train-color": color} as React.CSSProperties) }}>
            <Icon size={20} style={{ color }} />
            <strong style={{ fontSize:28, fontWeight:700, color }}>{count}</strong>
            <span style={{ fontSize:12 }}>{label}</span>
            <div style={{ width:"100%", height:3, background:"var(--line)", borderRadius:99, marginTop:2 }}>
              <div style={{ width:`${summary.total > 0 ? Math.round((count / summary.total) * 100) : 0}%`, height:"100%", background:color, borderRadius:99 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Global compliance bar */}
      <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--line)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
          <span style={{ color:"var(--muted)", fontWeight:500 }}>Taux d'habilitations à jour</span>
          <span style={{ fontWeight:700, color: tauxAJour >= 80 ? "#16a34a" : tauxAJour >= 60 ? "#d97706" : "#dc2626" }}>{tauxAJour}%</span>
        </div>
        <div style={{ height:8, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
          {summary.total > 0 && (
            <div style={{ display:"flex", height:"100%", overflow:"hidden", borderRadius:99 }}>
              <div style={{ width:`${tauxAJour}%`, background:"linear-gradient(90deg,#16a34a,#0f766e)", transition:"width .5s" }} />
              <div style={{ width:`${Math.round((summary.aRenouveler / summary.total) * 100)}%`, background:"#d97706" }} />
              <div style={{ flex:1, background:"#dc2626" }} />
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:16, marginTop:6, fontSize:11, flexWrap:"wrap" }}>
          <span style={{ color:"#16a34a" }}>● Valides : {summary.valide}</span>
          <span style={{ color:"#d97706" }}>● À renouveler : {summary.aRenouveler}</span>
          <span style={{ color:"#dc2626" }}>● Expirées : {summary.expire}</span>
          <span style={{ color:"#2563eb" }}>● En cours : {summary.enCours}</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:6, margin:"14px 0 0", flexWrap:"wrap" }}>
        {STATUTS.map((s) => (
          <button key={s} type="button" className={statut === s ? "periodBtn active" : "periodBtn"} onClick={() => setStatut(s)}>{s}</button>
        ))}
        <span style={{ fontSize:12, color:"var(--muted)", alignSelf:"center", marginLeft:6 }}>{filtered.length} ligne{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {/* Charts row */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Stacked site bar */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Conformité par site</h2><p>Répartition des statuts d'habilitation par localisation.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySiteStatut} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12, border:"1px solid var(--line)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="Valide"       name="Valide"        fill="#16a34a" stackId="a" />
                <Bar dataKey="En cours"     name="En cours"      fill="#2563eb" stackId="a" />
                <Bar dataKey="A renouveler" name="À renouveler"  fill="#d97706" stackId="a" />
                <Bar dataKey="Expire"       name="Expirée"       fill="#dc2626" stackId="a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Urgency list */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Alertes — expirations imminentes</h2><p>Habilitations expirant dans les 90 prochains jours ou déjà expirées.</p></div></div>
          <div style={{ padding:"8px 0", maxHeight:280, overflowY:"auto" }}>
            {urgentList.length === 0 ? (
              <div style={{ padding:"24px 16px", textAlign:"center", color:"var(--muted)", fontSize:13 }}>
                <CheckCircle2 size={32} style={{ color:"#16a34a", margin:"0 auto 8px", display:"block" }} />
                Aucune habilitation à renouveler dans les 90 prochains jours.
              </div>
            ) : urgentList.map((h) => {
              const expired = h.jours < 0;
              const urgent  = h.jours <= 15;
              const color   = expired ? "#dc2626" : urgent ? "#ea580c" : "#d97706";
              return (
                <div key={h.id} style={{ padding:"8px 16px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.nom} {h.prenom}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.titre} — {h.site}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color }}>{expired ? `Exp. il y a ${-h.jours}j` : `Dans ${h.jours}j`}</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>{h.date_expiration}</div>
                  </div>
                  <div style={{ width:6, height:36, background:color, borderRadius:3, flexShrink:0 }} />
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {/* Donut + site bar */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        <article className="panel">
          <div className="panelHeader"><div><h2>Répartition par statut (filtrée)</h2><p>{filtered.length} habilitation{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}.</p></div></div>
          <div className="chart compact" style={{ position:"relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatut} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={52}>
                  {byStatut.map((e) => <Cell key={e.name} fill={STATUT_COLOR[e.name as StatutHabilitation] ?? "#94a3b8"} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-60%)", textAlign:"center", pointerEvents:"none" }}>
              <div style={{ fontSize:22, fontWeight:800, color: tauxAJour >= 80 ? "#16a34a" : "#d97706" }}>{tauxAJour}%</div>
              <div style={{ fontSize:10, color:"var(--muted)" }}>à jour</div>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader"><div><h2>Volume par site</h2><p>Nombre total d'habilitations par localisation.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySiteStatut.map((s) => ({ ...s, total: (s["Valide"] ?? 0) + (s["A renouveler"] ?? 0) + (s["Expire"] ?? 0) + (s["En cours"] ?? 0) }))} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Bar dataKey="total" name="Habilitations" fill="#15803d" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* Table */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader">
          <div>
            <h2>Registre des habilitations</h2>
            <p>
              {tableData.length}/{filtered.length} enregistrement{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}.
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
                <th>Nom</th>
                <th>Prénom</th>
                {/* Filterable: Poste */}
                <th style={{ whiteSpace:"nowrap" }}>
                  <button
                    ref={(el) => { btnRefs.current["poste"] = el; }}
                    type="button"
                    onClick={() => openDropdown("poste")}
                    style={{ display:"inline-flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:0, fontSize:"inherit", fontWeight:"inherit", color:"inherit" }}>
                    Poste
                    <span style={{ fontSize:10, color: "poste" in colFilters ? "#2563eb" : "#9ca3af" }}>▼</span>
                  </button>
                </th>
                {/* Filterable: Site */}
                <th style={{ whiteSpace:"nowrap" }}>
                  <button
                    ref={(el) => { btnRefs.current["site"] = el; }}
                    type="button"
                    onClick={() => openDropdown("site")}
                    style={{ display:"inline-flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:0, fontSize:"inherit", fontWeight:"inherit", color:"inherit" }}>
                    Site
                    <span style={{ fontSize:10, color: "site" in colFilters ? "#2563eb" : "#9ca3af" }}>▼</span>
                  </button>
                </th>
                {/* Filterable: Type */}
                <th style={{ whiteSpace:"nowrap" }}>
                  <button
                    ref={(el) => { btnRefs.current["type"] = el; }}
                    type="button"
                    onClick={() => openDropdown("type")}
                    style={{ display:"inline-flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:0, fontSize:"inherit", fontWeight:"inherit", color:"inherit" }}>
                    Type
                    <span style={{ fontSize:10, color: "type" in colFilters ? "#2563eb" : "#9ca3af" }}>▼</span>
                  </button>
                </th>
                <th>Titre</th>
                {/* Filterable: Organisme */}
                <th style={{ whiteSpace:"nowrap" }}>
                  <button
                    ref={(el) => { btnRefs.current["organisme"] = el; }}
                    type="button"
                    onClick={() => openDropdown("organisme")}
                    style={{ display:"inline-flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:0, fontSize:"inherit", fontWeight:"inherit", color:"inherit" }}>
                    Organisme
                    <span style={{ fontSize:10, color: "organisme" in colFilters ? "#2563eb" : "#9ca3af" }}>▼</span>
                  </button>
                </th>
                <th>Date formation</th>
                <th>Expiration</th>
                {/* Filterable: Statut */}
                <th style={{ whiteSpace:"nowrap" }}>
                  <button
                    ref={(el) => { btnRefs.current["statut"] = el; }}
                    type="button"
                    onClick={() => openDropdown("statut")}
                    style={{ display:"inline-flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:0, fontSize:"inherit", fontWeight:"inherit", color:"inherit" }}>
                    Statut
                    <span style={{ fontSize:10, color: "statut" in colFilters ? "#2563eb" : "#9ca3af" }}>▼</span>
                  </button>
                </th>
                <th>Réf.</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((h) => {
                const jours  = daysUntil(h.date_expiration);
                const urgent = h.date_expiration && jours <= 30;
                return (
                  <tr key={h.id} style={{ background: urgent ? "#fef9c322" : undefined }}>
                    <td style={{ fontWeight:600 }}>{h.nom}</td>
                    <td>{h.prenom}</td>
                    <td style={{ fontSize:12, color:"var(--muted)" }}>{h.poste}</td>
                    <td>{h.site}</td>
                    <td><span className="status" style={{ background:"var(--bg)", color:"var(--muted)" }}>{h.type}</span></td>
                    <td style={{ fontSize:12, maxWidth:180 }}>{h.titre}</td>
                    <td style={{ fontSize:11, color:"var(--muted)" }}>{h.organisme}</td>
                    <td style={{ fontSize:12 }}>{h.date_formation}</td>
                    <td style={{ fontSize:12, color: jours < 0 ? "#dc2626" : jours <= 30 ? "#ea580c" : "inherit", fontWeight: jours <= 30 ? 600 : 400 }}>
                      {h.date_expiration ?? "—"}{jours < 0 ? " ⚠ Exp." : jours <= 30 ? ` (${jours}j)` : ""}
                    </td>
                    <td><span className="status" style={{ background:`${STATUT_COLOR[h.statut]}22`, color:STATUT_COLOR[h.statut] }}>{h.statut}</span></td>
                    <td style={{ fontSize:11 }}><code>{h.document_ref}</code></td>
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
