"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  AlertTriangle, BookOpen, CheckCircle2, ClipboardList,
  FileText, HandshakeIcon, Shield, Users,
} from "lucide-react";
import {
  vbgCodeConduite, vbgFormations, vbgIncidents, vbgPlanAction, vbgPlaintes,
} from "@/lib/vbg-data";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";

const COULEURS_STATUT: Record<string, string> = {
  "Clôturé":         "#16a34a",
  "Résolu":          "#22c55e",
  "En investigation":"#d97706",
  "Signalé":         "#dc2626",
  "Non fondé":       "#94a3b8",
  "Référé":          "#7c3aed",
};

const COULEURS_GRAVITE: Record<string, string> = {
  "Mineur":     "#22c55e",
  "Modéré":     "#d97706",
  "Grave":      "#dc2626",
  "Très grave": "#7f1d1d",
};

const COULEURS_PLAN: Record<string, string> = {
  "Réalisé":   "#16a34a",
  "En cours":  "#d97706",
  "Planifié":  "#2563eb",
  "En retard": "#dc2626",
};

type Tab = "incidents" | "formations" | "plaintes" | "plan" | "code";

// Shared button style generator for filterable column headers
function filterThStyle(col: string, openCol: string | null, colFilters: Record<string, string[]>) {
  const isOpen   = openCol === col;
  const isActive = col in colFilters;
  return {
    display:"flex" as const, alignItems:"center" as const, gap:5,
    padding:"5px 8px",
    border: isOpen ? "1px solid #be185d" : "1px solid transparent",
    borderRadius:6, cursor:"pointer" as const,
    fontSize:11, fontWeight:800, textTransform:"uppercase" as const, letterSpacing:"0.05em",
    background: isOpen || isActive ? "#fdf2f8" : "transparent",
    color: isActive ? "#be185d" : "var(--fg)",
    transition:"all 0.12s",
  };
}

export function VbgDashboardPanel() {
  const [tab, setTab] = useState<Tab>("incidents");
  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  const filteredIncidents = useMemo(() =>
    vbgIncidents.filter((i) =>
      (!activeSites || activeSites.includes(i.site)) &&
      isoDateInRange(i.date, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const filteredFormations = useMemo(() =>
    vbgFormations.filter((f) =>
      (!activeSites || activeSites.includes(f.site)) &&
      isoDateInRange(f.date, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const filteredPlaintes = useMemo(() =>
    vbgPlaintes.filter((p) =>
      isoDateInRange(p.dateDepot, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [globalFilter.dateDebut, globalFilter.dateFin]);

  const filteredCodeConduite = useMemo(() => {
    const bySite = activeSites ? vbgCodeConduite.filter((c) => activeSites.includes(c.site)) : vbgCodeConduite;
    return bySite.filter((c) => isoDateInRange(c.dateMAJ, globalFilter.dateDebut, globalFilter.dateFin));
  }, [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const filteredPlanAction = useMemo(() =>
    vbgPlanAction.filter((p) =>
      isoDateInRange(p.echeance, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [globalFilter.dateDebut, globalFilter.dateFin]);

  // ── Column filter state ──────────────────────────────────────────────────
  const [mounted,    setMounted]    = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openCol,    setOpenCol]    = useState<string | null>(null);
  const [dropPos,    setDropPos]    = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => { setMounted(true); }, []);

  function switchTab(t: Tab) { setTab(t); setColFilters({}); setOpenCol(null); }

  // Per-tab unique option sets (sorted)
  const colOptsInc = useMemo(() => ({
    site:    Array.from(new Set(filteredIncidents.map((i) => i.site))).sort(),
    type:    Array.from(new Set(filteredIncidents.map((i) => i.type))).sort(),
    gravite: Array.from(new Set(filteredIncidents.map((i) => i.gravite))).sort(),
    statut:  Array.from(new Set(filteredIncidents.map((i) => i.statut))).sort(),
  }), [filteredIncidents]);

  const colOptsForm = useMemo(() => ({
    site:      Array.from(new Set(filteredFormations.map((f) => f.site))).sort(),
    formateur: Array.from(new Set(filteredFormations.map((f) => f.formateur))).sort(),
  }), [filteredFormations]);

  const colOptsPlnt = useMemo(() => ({
    canal:       Array.from(new Set(filteredPlaintes.map((p) => p.canal))).sort(),
    typePlainte: Array.from(new Set(filteredPlaintes.map((p) => p.typePlainte))).sort(),
    statut:      Array.from(new Set(filteredPlaintes.map((p) => p.statut))).sort(),
  }), [filteredPlaintes]);

  const colOptsPlan = useMemo(() => ({
    categorie: Array.from(new Set(filteredPlanAction.map((p) => p.categorie))).sort(),
    statut:    Array.from(new Set(filteredPlanAction.map((p) => p.statut))).sort(),
  }), [filteredPlanAction]);

  const colOptsCode = useMemo(() => ({
    validite: ["Valide", "À renouveler"],
  }), []);

  const colOptions: Record<string, string[]> =
    tab === "incidents"  ? colOptsInc :
    tab === "formations" ? colOptsForm :
    tab === "plaintes"   ? colOptsPlnt :
    tab === "plan"       ? colOptsPlan :
                           colOptsCode;

  // Per-tab filtered table data
  const tableIncidents = useMemo(() =>
    filteredIncidents.filter((i) => {
      if ("site"    in colFilters) { const v = colFilters.site;    if (!v.length) return false; if (!v.includes(i.site))    return false; }
      if ("type"    in colFilters) { const v = colFilters.type;    if (!v.length) return false; if (!v.includes(i.type))    return false; }
      if ("gravite" in colFilters) { const v = colFilters.gravite; if (!v.length) return false; if (!v.includes(i.gravite)) return false; }
      if ("statut"  in colFilters) { const v = colFilters.statut;  if (!v.length) return false; if (!v.includes(i.statut))  return false; }
      return true;
    }),
  [filteredIncidents, colFilters]);

  const tableFormations = useMemo(() =>
    filteredFormations.filter((f) => {
      if ("site"      in colFilters) { const v = colFilters.site;      if (!v.length) return false; if (!v.includes(f.site))      return false; }
      if ("formateur" in colFilters) { const v = colFilters.formateur; if (!v.length) return false; if (!v.includes(f.formateur)) return false; }
      return true;
    }),
  [filteredFormations, colFilters]);

  const tablePlaintes = useMemo(() =>
    filteredPlaintes.filter((p) => {
      if ("canal"       in colFilters) { const v = colFilters.canal;       if (!v.length) return false; if (!v.includes(p.canal))       return false; }
      if ("typePlainte" in colFilters) { const v = colFilters.typePlainte; if (!v.length) return false; if (!v.includes(p.typePlainte)) return false; }
      if ("statut"      in colFilters) { const v = colFilters.statut;      if (!v.length) return false; if (!v.includes(p.statut))      return false; }
      return true;
    }),
  [filteredPlaintes, colFilters]);

  const tablePlan = useMemo(() =>
    filteredPlanAction.filter((p) => {
      if ("categorie" in colFilters) { const v = colFilters.categorie; if (!v.length) return false; if (!v.includes(p.categorie)) return false; }
      if ("statut"    in colFilters) { const v = colFilters.statut;    if (!v.length) return false; if (!v.includes(p.statut))    return false; }
      return true;
    }),
  [filteredPlanAction, colFilters]);

  const tableCode = useMemo(() =>
    filteredCodeConduite.filter((c) => {
      if ("validite" in colFilters) {
        const v = colFilters.validite;
        if (!v.length) return false;
        const label = c.valide ? "Valide" : "À renouveler";
        if (!v.includes(label)) return false;
      }
      return true;
    }),
  [filteredCodeConduite, colFilters]);

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

  const hasAnyColFilter = Object.keys(colFilters).length > 0;

  // Reusable filter header button
  function FilterTh({ col, label }: { col: string; label: string }) {
    return (
      <th style={{ padding:"4px 8px", textAlign:"left" }}>
        <button
          ref={(el) => { btnRefs.current[col] = el; }}
          type="button"
          onClick={() => openDropdown(col)}
          style={filterThStyle(col, openCol, colFilters)}
        >
          {label}
          {col in colFilters
            ? <span style={{ background:"#be185d", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>
                {(colFilters[col] ?? []).length}
              </span>
            : <span style={{ fontSize:10, opacity:0.5 }}>▾</span>}
        </button>
      </th>
    );
  }

  // Reusable reset bar
  function ResetBar({ total, filtered: filt, label }: { total: number; filtered: number; label: string }) {
    if (!hasAnyColFilter) return null;
    return (
      <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:11, color:"var(--muted)" }}>{filt}/{total} {label}</span>
        <button type="button" onClick={() => setColFilters({})}
          style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #be185d", background:"#fdf2f8", color:"#be185d", cursor:"pointer", fontWeight:700 }}>
          ✕ Réinitialiser colonnes
        </button>
      </div>
    );
  }

  // Portal dropdown (shared across all tabs)
  const portalDropdown = mounted && openCol ? createPortal(
    <>
      <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setOpenCol(null)} />
      <div style={{ position:"absolute", top:dropPos.top+2, left:dropPos.left, zIndex:9999, background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, boxShadow:"0 8px 28px rgba(0,0,0,0.14)", minWidth:190, maxHeight:310, display:"flex", flexDirection:"column" }}>
        <div style={{ overflowY:"auto", flex:1 }}>
          {(colOptions[openCol] ?? []).map((opt) => {
            const isFiltering = openCol in colFilters;
            const cur         = isFiltering ? (colFilters[openCol] ?? []) : null;
            const checked     = cur === null || cur.includes(opt);
            return (
              <label key={opt}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 12px", cursor:"pointer", fontSize:12, borderBottom:"1px solid #f1f5f9", background:"#fff" }}
                onMouseEnter={(ev) => { ev.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.background = "#fff"; }}>
                <input type="checkbox" checked={checked} onChange={() => toggleColValue(openCol, opt)}
                  style={{ accentColor:"#be185d", width:14, height:14, cursor:"pointer" }} />
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
              else       { setColFilters((p) => { const c = {...p}; delete c[openCol]; return c; }); }
            }}
            style={{ accentColor:"#be185d", width:14, height:14, cursor:"pointer" }} />
          <span style={{ fontWeight:600, color:"#374151" }}>Tout sélectionner</span>
        </label>
      </div>
    </>,
    document.body
  ) : null;

  // ── Derived KPIs ─────────────────────────────────────────────────────────
  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncidents.forEach((i) => { map[i.type] = (map[i.type] ?? 0) + 1; });
    return Object.entries(map).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }, [filteredIncidents]);

  const formBySite = useMemo(() => {
    const map: Record<string, number> = {};
    filteredFormations.forEach((f) => { map[f.site] = (map[f.site] ?? 0) + f.participants; });
    return Object.entries(map).map(([site, participants]) => ({ site, participants }));
  }, [filteredFormations]);

  const summary = useMemo(() => {
    const total    = filteredIncidents.length;
    const graves   = filteredIncidents.filter((i) => i.gravite === "Grave" || i.gravite === "Très grave").length;
    const ouverts  = filteredIncidents.filter((i) => i.statut === "Signalé" || i.statut === "En investigation").length;
    const clotures = filteredIncidents.filter((i) => i.statut === "Clôturé" || i.statut === "Résolu").length;
    const totalPersonnel = filteredCodeConduite.reduce((s, c) => s + c.totalPersonnel, 0);
    const signataires    = filteredCodeConduite.reduce((s, c) => s + c.signataires, 0);
    const tauxSignature  = Math.round((signataires / Math.max(totalPersonnel, 1)) * 100);
    const totalFormes    = filteredFormations.reduce((s, f) => s + f.participants, 0);
    const tauxFormation  = Math.round((totalFormes / Math.max(totalPersonnel, 1)) * 100);
    const plaintesCloturees = filteredPlaintes.filter((p) => p.statut === "Clôturé").length;
    const tauxResolution    = Math.round((plaintesCloturees / Math.max(filteredPlaintes.length, 1)) * 100);
    const withDelai  = filteredPlaintes.filter((p) => p.delaiTraitement);
    const delaiMoyen = withDelai.length
      ? Math.round(withDelai.reduce((s, p) => s + (p.delaiTraitement ?? 0), 0) / withDelai.length)
      : 0;
    const planRealise    = filteredPlanAction.filter((p) => p.statut === "Réalisé").length;
    const tauxPlanAction = Math.round((planRealise / Math.max(filteredPlanAction.length, 1)) * 100);
    return {
      total, graves, ouverts, clotures,
      totalPersonnel, signataires, tauxSignature,
      totalFormes, tauxFormation,
      plaintesCloturees, tauxResolution, delaiMoyen,
      planRealise, tauxPlanAction,
    };
  }, [filteredIncidents, filteredFormations, filteredPlaintes, filteredCodeConduite, filteredPlanAction]);

  const pieStatut = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncidents.forEach((i) => { map[i.statut] = (map[i.statut] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredIncidents]);

  const planByStatut = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPlanAction.forEach((p) => { map[p.statut] = (map[p.statut] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredPlanAction]);

  return (
    <section className="cockpitBlock">
      {/* ── Normes banner ── */}
      <div style={{ background: "linear-gradient(135deg,#be185d,#9d174d)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <Shield size={20} style={{ color: "#fbcfe8", flexShrink: 0 }} />
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0 }}>Module VBG / EAS / HS — Conformité internationale</p>
          <p style={{ color: "#fbcfe8", fontSize: 11, margin: 0 }}>World Bank ESS2 · ESS4 · IFC PS2 · ILO C190 · WB Good Practice Note on GBV (2018) · UN Women Standards</p>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="kpiGridCompact" style={{ marginBottom: 20, gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
        {[
          { label: "Incidents signalés",      value: summary.total,            icon: AlertTriangle,  color: "#dc2626", bg: "#fee2e2", sub: `${summary.graves} graves` },
          { label: "En investigation",         value: summary.ouverts,          icon: ClipboardList,  color: "#d97706", bg: "#fef3c7", sub: "Délai cible: 30j (WB)" },
          { label: "Taux formation VBG",       value: `${summary.tauxFormation}%`,   icon: BookOpen,  color: "#2563eb", bg: "#eff6ff", sub: `${summary.totalFormes} personnes formées` },
          { label: "Code de conduite signé",   value: `${summary.tauxSignature}%`,   icon: FileText,  color: "#7c3aed", bg: "#f5f3ff", sub: `${summary.signataires}/${summary.totalPersonnel} travailleurs` },
          { label: "Taux résolution plaintes", value: `${summary.tauxResolution}%`,  icon: CheckCircle2, color: "#16a34a", bg: "#dcfce7", sub: `Délai moyen: ${summary.delaiMoyen}j` },
          { label: "Plan d'action VBG",        value: `${summary.tauxPlanAction}%`,  icon: HandshakeIcon, color: "#be185d", bg: "#fdf2f8", sub: `${summary.planRealise}/${filteredPlanAction.length} mesures réalisées` },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <article key={k.label} className="kpiCard" style={{ background: k.bg, border: `1px solid ${k.bg}` }}>
              <div className="kpiCardHeader"><Icon size={18} style={{ color: k.color }} /></div>
              <strong className="kpiCardValue" style={{ color: k.color }}>{k.value}</strong>
              <p className="kpiCardLabel">{k.label}</p>
              <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{k.sub}</p>
            </article>
          );
        })}
      </div>

      {/* ── Graphiques ── */}
      <div className="dashboardGrid" style={{ marginBottom: 20 }}>
        <article className="panel">
          <div className="panelHeader"><div><h2>Incidents par type</h2><p>Répartition selon la classification OMS/WB</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="type" width={180} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Incidents" fill="#be185d" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader"><div><h2>Statut des incidents</h2><p>Suivi du traitement (cible: 0 ouvert)</p></div></div>
          <div className="chart compact" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={pieStatut} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                  label={({ percent }) => percent ? `${Math.round(percent * 100)}%` : ""} labelLine={false}>
                  {pieStatut.map((entry) => <Cell key={entry.name} fill={COULEURS_STATUT[entry.name] ?? "#94a3b8"} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {pieStatut.map((e) => (
                <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: COULEURS_STATUT[e.name] ?? "#94a3b8", flexShrink: 0 }} />
                  <span>{e.name}</span>
                  <strong style={{ marginLeft: "auto", color: COULEURS_STATUT[e.name] }}>{e.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* ── Portal dropdown (shared) ── */}
      {portalDropdown}

      {/* ── Onglets détail ── */}
      <div className="panel">
        <div style={{ display: "flex", gap: 3, background: "var(--hover)", borderRadius: 10, padding: "3px", marginBottom: 16, flexWrap: "wrap" }}>
          {([
            ["incidents",  "Registre incidents", AlertTriangle],
            ["formations", "Formations VBG",     BookOpen],
            ["plaintes",   "Mécanisme plaintes",  ClipboardList],
            ["plan",       "Plan d'action",       HandshakeIcon],
            ["code",       "Code de conduite",    Users],
          ] as [Tab, string, React.ElementType][]).map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => switchTab(id)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", border:"none", borderRadius:7, cursor:"pointer", fontSize:12, fontWeight:600, transition:"all 0.15s",
                background: tab === id ? "#be185d" : "transparent",
                color:      tab === id ? "#fff"    : "var(--muted)" }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ── Incidents ── */}
        {tab === "incidents" && (
          <>
            <ResetBar total={filteredIncidents.length} filtered={tableIncidents.length} label="incidents" />
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Date</th>
                    <FilterTh col="site"    label="Site" />
                    <FilterTh col="type"    label="Type VBG" />
                    <FilterTh col="gravite" label="Gravité" />
                    <FilterTh col="statut"  label="Statut" />
                    <th>Délai (j)</th>
                    <th>Mesures prises</th>
                  </tr>
                </thead>
                <tbody>
                  {tableIncidents.map((i) => (
                    <tr key={i.id}>
                      <td><strong>{i.reference}</strong></td>
                      <td>{i.date}</td>
                      <td>{i.site}</td>
                      <td style={{ fontSize: 11 }}>{i.type}</td>
                      <td><span className="status" style={{ background: COULEURS_GRAVITE[i.gravite] + "22", color: COULEURS_GRAVITE[i.gravite], border: `1px solid ${COULEURS_GRAVITE[i.gravite]}44` }}>{i.gravite}</span></td>
                      <td><span className="status" style={{ background: COULEURS_STATUT[i.statut] + "22", color: COULEURS_STATUT[i.statut] }}>{i.statut}</span></td>
                      <td style={{ textAlign: "center" }}>{i.delaiResolution ?? "—"}</td>
                      <td style={{ fontSize: 10, maxWidth: 280, color: "var(--muted)" }}>{i.mesuresPrises}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 8, padding: "0 4px" }}>
                * Toutes les références sont anonymisées conformément aux exigences de confidentialité WB Good Practice Note GBV §6.2.
              </p>
            </div>
          </>
        )}

        {/* ── Formations ── */}
        {tab === "formations" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div className="chart" style={{ height: 180 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Participants par site</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formBySite}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="site" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="participants" name="Participants" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Total formés",         value: summary.totalFormes,   color: "#2563eb" },
                  { label: "Sessions réalisées",   value: filteredFormations.length, color: "#0f766e" },
                  { label: "Taux couverture",       value: `${summary.tauxFormation}%`, color: summary.tauxFormation >= 80 ? "#16a34a" : "#d97706" },
                  { label: "Score satisfaction moy.", value: filteredFormations.length ? `${(filteredFormations.reduce((s, f) => s + (f.scoreSatisfaction ?? 4), 0) / filteredFormations.length).toFixed(1)}/5` : "—", color: "#7c3aed" },
                ].map((k) => (
                  <div key={k.label} style={{ display: "flex", alignItems: "baseline", gap: 4, padding: "7px 10px", background: "var(--hover)", borderRadius: 8, borderLeft: `3px solid ${k.color}` }}>
                    <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{k.label}</span>
                    <span style={{ flex: 1, borderBottom: "1px dotted rgba(100,116,139,0.35)", margin: "0 6px 3px" }} />
                    <strong style={{ fontSize: 14, color: k.color, whiteSpace: "nowrap" }}>{k.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <ResetBar total={filteredFormations.length} filtered={tableFormations.length} label="sessions" />
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <FilterTh col="site"      label="Site" />
                    <th>Thème</th>
                    <th>Participants</th>
                    <FilterTh col="formateur" label="Formateur" />
                    <th>Durée (h)</th>
                    <th>Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  {tableFormations.map((f) => (
                    <tr key={f.id}>
                      <td>{f.date}</td>
                      <td>{f.site}</td>
                      <td style={{ fontSize: 11 }}>{f.theme}</td>
                      <td style={{ textAlign: "center" }}><strong>{f.participants}</strong></td>
                      <td style={{ fontSize: 11 }}>{f.formateur}</td>
                      <td style={{ textAlign: "center" }}>{f.duree}h</td>
                      <td style={{ textAlign: "center" }}>
                        {f.scoreSatisfaction
                          ? <span style={{ color: f.scoreSatisfaction >= 4 ? "#16a34a" : "#d97706", fontWeight: 700 }}>{f.scoreSatisfaction}/5</span>
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Plaintes MGP ── */}
        {tab === "plaintes" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Plaintes totales",     v: filteredPlaintes.length,                                                   c: "#be185d" },
                { label: "Clôturées (WB ≤30j)", v: summary.plaintesCloturees,                                                 c: "#16a34a" },
                { label: "En cours",             v: filteredPlaintes.filter((p) => p.statut === "En investigation").length,    c: "#d97706" },
                { label: "Délai moyen (j)",      v: summary.delaiMoyen,                                                        c: summary.delaiMoyen <= 30 ? "#16a34a" : "#dc2626" },
              ].map((k) => (
                <div key={k.label} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--hover)", textAlign: "center" }}>
                  <strong style={{ fontSize: 22, color: k.c, display: "block" }}>{k.v}</strong>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{k.label}</span>
                </div>
              ))}
            </div>
            <ResetBar total={filteredPlaintes.length} filtered={tablePlaintes.length} label="plaintes" />
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Date dépôt</th>
                    <FilterTh col="canal"       label="Canal" />
                    <FilterTh col="typePlainte" label="Type" />
                    <FilterTh col="statut"      label="Statut" />
                    <th>Délai (j)</th>
                    <th>Résolution</th>
                  </tr>
                </thead>
                <tbody>
                  {tablePlaintes.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 12 }}><strong>{p.reference}</strong></td>
                      <td style={{ fontSize: 12 }}>{p.dateDepot}</td>
                      <td style={{ fontSize: 12 }}>{p.canal}</td>
                      <td style={{ fontSize: 12 }}>{p.typePlainte}</td>
                      <td style={{ fontSize: 12 }}><span className="status" style={{ background: COULEURS_STATUT[p.statut] + "22", color: COULEURS_STATUT[p.statut] }}>{p.statut}</span></td>
                      <td style={{ textAlign: "center", fontSize: 12 }}>
                        {p.delaiTraitement
                          ? <span style={{ color: p.delaiTraitement <= 30 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{p.delaiTraitement}</span>
                          : "En cours"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--muted)", maxWidth: 220 }}>{p.resolution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 8, padding: "0 4px" }}>
                Délai cible: 30 jours maximum (World Bank ESS2 §26). Toutes les plaintes sont traitées de manière confidentielle.
              </p>
            </div>
          </>
        )}

        {/* ── Plan d'action ── */}
        {tab === "plan" && (
          <>
            <ResetBar total={filteredPlanAction.length} filtered={tablePlan.length} label="mesures" />
            <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 3px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", padding: "4px 12px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          Plan
                          <button ref={(el) => { btnRefs.current["categorie"] = el; }} type="button" onClick={() => openDropdown("categorie")}
                            style={{ ...filterThStyle("categorie", openCol, colFilters), fontSize:10 }}>
                            Catégorie
                            {"categorie" in colFilters
                              ? <span style={{ background:"#be185d", color:"#fff", borderRadius:"50%", width:15, height:15, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700 }}>{(colFilters["categorie"] ?? []).length}</span>
                              : <span style={{ fontSize:9, opacity:0.5 }}>▾</span>}
                          </button>
                        </div>
                      </th>
                      <th style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--muted)", padding: "4px 12px 8px", textTransform: "uppercase", letterSpacing: "0.05em", width: 68 }}>
                        <button ref={(el) => { btnRefs.current["statut"] = el; }} type="button" onClick={() => openDropdown("statut")}
                          style={{ ...filterThStyle("statut", openCol, colFilters), fontSize:10, width:"100%" }}>
                          Statut
                          {"statut" in colFilters
                            ? <span style={{ background:"#be185d", color:"#fff", borderRadius:"50%", width:15, height:15, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700 }}>{(colFilters["statut"] ?? []).length}</span>
                            : <span style={{ fontSize:9, opacity:0.5 }}>▾</span>}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Prévention",  items: tablePlan.filter((p) => p.categorie === "Prévention") },
                      { label: "Réponse",     items: tablePlan.filter((p) => p.categorie === "Réponse") },
                      { label: "Atténuation", items: tablePlan.filter((p) => p.categorie === "Atténuation") },
                      { label: "Suivi",       items: tablePlan.filter((p) => p.categorie === "Suivi") },
                    ].filter((cat) => cat.items.length > 0).map((cat) => (
                      <>
                        <tr key={`cat-${cat.label}`}>
                          <td colSpan={2} style={{ padding: "10px 12px 4px", fontSize: 11, fontWeight: 700, color: "#be185d", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {cat.label}
                          </td>
                        </tr>
                        {cat.items.map((item) => (
                          <tr key={item.id}>
                            <td style={{ padding: "9px 12px", background: item.statut === "En retard" ? "#fee2e2" : "var(--hover)", borderRadius: "8px 0 0 8px" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: COULEURS_PLAN[item.statut], flexShrink: 0, marginTop: 4 }} />
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{item.mesure}</p>
                                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{item.responsable} — Échéance: {item.echeance} — <em>{item.norme}</em></p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "9px 12px", background: item.statut === "En retard" ? "#fee2e2" : "var(--hover)", borderRadius: "0 8px 8px 0", textAlign: "center", verticalAlign: "middle", borderLeft: "1px solid var(--line, #e5e7eb)" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: COULEURS_PLAN[item.statut], background: `${COULEURS_PLAN[item.statut]}20`, padding: "3px 10px", borderRadius: 5, whiteSpace: "nowrap" }}>
                                {item.statut}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4, alignSelf: "center" }}>Avancement</p>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={planByStatut} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={58}
                      label={({ percent }) => {
                        const pct = percent ?? 0;
                        return pct > 0.04 ? `${Math.round(pct * 100)}%` : "";
                      }}
                      labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}>
                      {planByStatut.map((e) => <Cell key={e.name} fill={COULEURS_PLAN[e.name] ?? "#94a3b8"} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ width: "100%", padding: "0 8px" }}>
                  {planByStatut.map((e) => (
                    <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, marginBottom: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: COULEURS_PLAN[e.name] ?? "#94a3b8", flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{e.name}</span>
                      <strong>{e.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Code de conduite ── */}
        {tab === "code" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#15803d", margin: "0 0 4px" }}>Conformité IFC/WB</p>
                <p style={{ fontSize: 11, color: "#166534", margin: 0 }}>
                  Le Code de Conduite couvre: harcèlement sexuel, EAS/HS, discrimination, violence — signé individuellement par chaque travailleur et sous-traitant.
                  Référence: WB Good Practice Note GBV (2018) §3.1 — IFC PS2 — ILO C190.
                </p>
              </div>
            </div>
            <ResetBar total={filteredCodeConduite.length} filtered={tableCode.length} label="sites" />
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Personnel total</th>
                    <th>Signataires</th>
                    <th>Taux signature</th>
                    <th>Date MAJ</th>
                    <FilterTh col="validite" label="Validité" />
                  </tr>
                </thead>
                <tbody>
                  {tableCode.map((c) => {
                    const taux = Math.round((c.signataires / c.totalPersonnel) * 100);
                    return (
                      <tr key={c.site}>
                        <td><strong>{c.site}</strong></td>
                        <td style={{ textAlign: "center" }}>{c.totalPersonnel}</td>
                        <td style={{ textAlign: "center" }}>{c.signataires}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e5e7eb" }}>
                              <div style={{ width: `${taux}%`, height: "100%", borderRadius: 4, background: taux >= 95 ? "#16a34a" : taux >= 80 ? "#d97706" : "#dc2626" }} />
                            </div>
                            <strong style={{ fontSize: 12, color: taux >= 95 ? "#16a34a" : taux >= 80 ? "#d97706" : "#dc2626", width: 40 }}>{taux}%</strong>
                          </div>
                        </td>
                        <td>{c.dateMAJ}</td>
                        <td>
                          <span className="status" style={{ background: c.valide ? "#dcfce7" : "#fee2e2", color: c.valide ? "#16a34a" : "#dc2626" }}>
                            {c.valide ? "Valide" : "À renouveler"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredCodeConduite.some((c) => !c.valide) && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, border: "1px solid #fde68a" }}>
                <p style={{ fontSize: 11, color: "#92400e", margin: 0, fontWeight: 600 }}>
                  Action requise: {filteredCodeConduite.find((c) => !c.valide)?.site} — Renouvellement du Code de Conduite requis. Objectif: 100% signatures avant la prochaine mission de supervision WB.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
