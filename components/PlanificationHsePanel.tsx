"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";

type StatutActivite = "Realisee" | "En cours" | "Planifiee" | "En retard";
type Trimestre = "T1" | "T2" | "T3" | "T4";

type ActivitePlan = {
  id: string;
  trimestre: Trimestre;
  mois: string;
  categorie: string;
  activite: string;
  responsable: string;
  budget_fcfa: number;
  statut: StatutActivite;
  site: string;
  commentaire: string;
};

const PLAN_ANNUEL: ActivitePlan[] = [
  { id:"p-001", trimestre:"T1", mois:"Janvier",   categorie:"Formation",      activite:"Formation secouriste SST — 2 sessions",            responsable:"COULIBALY M.",  budget_fcfa:450000,  statut:"Realisee",  site:"Abidjan",      commentaire:"20 personnes formées" },
  { id:"p-002", trimestre:"T1", mois:"Janvier",   categorie:"Audit",          activite:"Audit interne HSE Q1 — tous sites",                 responsable:"CISSE Adama",   budget_fcfa:200000,  statut:"Realisee",  site:"Tous",         commentaire:"Rapport transmis le 15/01" },
  { id:"p-003", trimestre:"T1", mois:"Fevrier",   categorie:"EPI",            activite:"Renouvellement stock EPI critiques Q1",             responsable:"BAMBA Seydou",  budget_fcfa:1200000, statut:"Realisee",  site:"Bouake",       commentaire:"Livraison effectuée" },
  { id:"p-004", trimestre:"T1", mois:"Mars",      categorie:"Inspection",     activite:"Inspection annuelle installations electriques",      responsable:"YAO Augustin",  budget_fcfa:350000,  statut:"Realisee",  site:"Abidjan",      commentaire:"Conformite: 87%" },
  { id:"p-005", trimestre:"T1", mois:"Mars",      categorie:"DUERP",          activite:"Revision annuelle Document Unique",                 responsable:"ASSI Rodrigue", budget_fcfa:100000,  statut:"Realisee",  site:"Tous",         commentaire:"Mis a jour le 31/03" },
  { id:"p-006", trimestre:"T2", mois:"Avril",     categorie:"Formation",      activite:"Formation travail en hauteur — CACES",               responsable:"KOUAME Eric",   budget_fcfa:800000,  statut:"Realisee",  site:"Abidjan",      commentaire:"8 certifications obtenues" },
  { id:"p-007", trimestre:"T2", mois:"Avril",     categorie:"Medical",        activite:"Campagne visites medicales periodiques",            responsable:"COULIBALY M.",  budget_fcfa:600000,  statut:"Realisee",  site:"Tous",         commentaire:"15 visites realisees" },
  { id:"p-008", trimestre:"T2", mois:"Mai",       categorie:"Exercice",       activite:"Exercice evacuation incendie — Yamoussoukro",       responsable:"TRAORE S.",     budget_fcfa:150000,  statut:"Realisee",  site:"Yamoussoukro", commentaire:"Temps evacuation: 4min30" },
  { id:"p-009", trimestre:"T2", mois:"Juin",      categorie:"EPI",            activite:"Renouvellement EPI Q2 — tous sites",                responsable:"BAMBA Seydou",  budget_fcfa:1500000, statut:"En cours",  site:"Tous",         commentaire:"Commande lancee, livraison 15/06" },
  { id:"p-010", trimestre:"T2", mois:"Juin",      categorie:"Audit",          activite:"Audit externe ISO 45001 — surveillance",            responsable:"CISSE Adama",   budget_fcfa:2500000, statut:"Planifiee", site:"Tous",         commentaire:"Auditeur: LRQA, date: 25/06" },
  { id:"p-011", trimestre:"T2", mois:"Juin",      categorie:"Formation",      activite:"Formation habilitation electrique — recyclage",      responsable:"YAO Augustin",  budget_fcfa:400000,  statut:"Planifiee", site:"Bouake",       commentaire:"Prevu le 20/06" },
  { id:"p-012", trimestre:"T3", mois:"Juillet",   categorie:"Inspection",     activite:"Inspection engins de chantier — levage",            responsable:"DIALLO Moussa", budget_fcfa:300000,  statut:"Planifiee", site:"Abidjan",      commentaire:"Bureau Veritas programme" },
  { id:"p-013", trimestre:"T3", mois:"Aout",      categorie:"Formation",      activite:"Formation risques chimiques CMR",                   responsable:"KONAN Brice",   budget_fcfa:600000,  statut:"Planifiee", site:"San Pedro",    commentaire:"En attente confirmation organisme" },
  { id:"p-014", trimestre:"T3", mois:"Septembre", categorie:"Medical",        activite:"Campagne visites medicales Q3",                     responsable:"COULIBALY M.",  budget_fcfa:500000,  statut:"Planifiee", site:"Tous",         commentaire:"A planifier avec medecin" },
  { id:"p-015", trimestre:"T3", mois:"Septembre", categorie:"Audit",          activite:"Audit interne HSE Q3",                             responsable:"ASSI Rodrigue", budget_fcfa:200000,  statut:"Planifiee", site:"Tous",         commentaire:"Prevu 15-20/09" },
  { id:"p-016", trimestre:"T4", mois:"Octobre",   categorie:"Formation",      activite:"Formation conduite defensive — tous conducteurs",   responsable:"OUATTARA M.",   budget_fcfa:900000,  statut:"Planifiee", site:"Abidjan",      commentaire:"" },
  { id:"p-017", trimestre:"T4", mois:"Novembre",  categorie:"EPI",            activite:"Renouvellement EPI Q4",                            responsable:"BAMBA Seydou",  budget_fcfa:1400000, statut:"Planifiee", site:"Tous",         commentaire:"" },
  { id:"p-018", trimestre:"T4", mois:"Novembre",  categorie:"Exercice",       activite:"Exercice plan d'urgence — deversement chimique",    responsable:"KONAN Brice",   budget_fcfa:200000,  statut:"Planifiee", site:"San Pedro",    commentaire:"" },
  { id:"p-019", trimestre:"T4", mois:"Decembre",  categorie:"Bilan",          activite:"Bilan HSE annuel + programme 2027",                 responsable:"CISSE Adama",   budget_fcfa:150000,  statut:"Planifiee", site:"Tous",         commentaire:"" },
  { id:"p-020", trimestre:"T2", mois:"Mai",       categorie:"Inspection",     activite:"Audit sous-traitants HSE Q2",                       responsable:"ASSI Rodrigue", budget_fcfa:180000,  statut:"En retard", site:"Bouake",       commentaire:"Retard — sous-traitant indisponible" },
];

const STATUT_COLOR: Record<StatutActivite, string> = {
  Realisee:  "#16a34a",
  "En cours":"#2563eb",
  Planifiee: "#94a3b8",
  "En retard":"#dc2626",
};

const STATUT_ICON: Record<StatutActivite, React.ElementType> = {
  Realisee:   CheckCircle2,
  "En cours": Clock,
  Planifiee:  Calendar,
  "En retard":AlertCircle,
};

const CATEGORIES = ["Toutes", ...Array.from(new Set(PLAN_ANNUEL.map((p) => p.categorie)))];
const TRIMESTRES: (Trimestre | "Tous")[] = ["Tous", "T1", "T2", "T3", "T4"];

const MOIS_ISO: Record<string, string> = {
  "Janvier":"2026-01","Fevrier":"2026-02","Mars":"2026-03",
  "Avril":"2026-04","Mai":"2026-05","Juin":"2026-06",
  "Juillet":"2026-07","Aout":"2026-08","Septembre":"2026-09",
  "Octobre":"2026-10","Novembre":"2026-11","Decembre":"2026-12",
};

const COL_DEFS_PLAN = [
  { key:"trimestre",   label:"Trim.",       get:(p: ActivitePlan) => p.trimestre },
  { key:"mois",        label:"Mois",        get:(p: ActivitePlan) => p.mois },
  { key:"categorie",   label:"Catégorie",   get:(p: ActivitePlan) => p.categorie },
  { key:"responsable", label:"Responsable", get:(p: ActivitePlan) => p.responsable },
  { key:"site",        label:"Site",        get:(p: ActivitePlan) => p.site },
  { key:"statut",      label:"Statut",      get:(p: ActivitePlan) => p.statut },
];

export function PlanificationHsePanel() {
  const [trimestre, setTrimestre] = useState<Trimestre | "Tous">("Tous");
  const [categorie, setCategorie] = useState("Toutes");
  const globalFilter = useCockpitFilter();
  const { dateDebut, dateFin } = globalFilter;
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  // Column filter state
  const [mounted, setMounted] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => { setMounted(true); }, []);

  const baseData = useMemo(() => {
    const debutMois = dateDebut ? dateDebut.slice(0, 7) : undefined;
    const finMois   = dateFin   ? dateFin.slice(0, 7)   : undefined;
    return PLAN_ANNUEL.filter((p) => {
      if (activeSites && p.site !== "Tous" && !activeSites.includes(p.site)) return false;
      if (debutMois || finMois) {
        const miso = MOIS_ISO[p.mois];
        if (miso) {
          if (debutMois && miso < debutMois) return false;
          if (finMois   && miso > finMois)   return false;
        }
      }
      return true;
    });
  }, [activeSites, dateDebut, dateFin]);

  const filtered = useMemo(() =>
    baseData.filter((p) =>
      (trimestre === "Tous" || p.trimestre === trimestre) &&
      (categorie === "Toutes" || p.categorie === categorie)
    ),
    [baseData, trimestre, categorie]
  );

  const colOptions = useMemo(() =>
    Object.fromEntries(COL_DEFS_PLAN.map(({ key, get }) => [
      key, Array.from(new Set(filtered.map(get))).sort(),
    ])),
  [filtered]);

  const tableData = useMemo(() =>
    filtered.filter((p) =>
      COL_DEFS_PLAN.every(({ key, get }) => {
        if (!(key in colFilters)) return true;
        const vals = colFilters[key] ?? [];
        return vals.length === 0 ? false : vals.includes(get(p));
      })
    ),
  [filtered, colFilters]);

  const summary = useMemo(() => ({
    total:     baseData.length,
    realisees: baseData.filter((p) => p.statut === "Realisee").length,
    enRetard:  baseData.filter((p) => p.statut === "En retard").length,
    taux:      baseData.length ? Math.round(baseData.filter((p) => p.statut === "Realisee").length / baseData.length * 100) : 0,
    budgetTotal:   baseData.reduce((s, p) => s + p.budget_fcfa, 0),
    budgetConsomme:baseData.filter((p) => p.statut === "Realisee").reduce((s, p) => s + p.budget_fcfa, 0),
  }), [baseData]);

  const byTrimestre = useMemo(() => (["T1","T2","T3","T4"] as Trimestre[]).map((t) => {
    const items = baseData.filter((p) => p.trimestre === t);
    return {
      trimestre: t,
      realisees: items.filter((p) => p.statut === "Realisee").length,
      enCours:   items.filter((p) => p.statut === "En cours").length,
      planifiees:items.filter((p) => p.statut === "Planifiee").length,
      enRetard:  items.filter((p) => p.statut === "En retard").length,
    };
  }), [baseData]);

  const budgetConsomme = summary.budgetTotal > 0
    ? Math.round((summary.budgetConsomme / summary.budgetTotal) * 100)
    : 0;

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
          <h2>Programme &amp; Planification HSE 2026</h2>
          <p>{summary.realisees}/{summary.total} activités réalisées — {summary.taux}% — {summary.enRetard} en retard — Budget : {(summary.budgetConsomme/1000000).toFixed(1)}M / {(summary.budgetTotal/1000000).toFixed(1)}M FCFA.</p>
        </div>
      </div>

      <div className="planifKpis">
        {[
          { label:"Réalisées",           val:summary.realisees, sub:`${summary.taux}%`,             color:"#16a34a" },
          { label:"En cours",            val:baseData.filter((p) => p.statut === "En cours").length, sub:"en exécution", color:"#2563eb" },
          { label:"En retard",           val:summary.enRetard,  sub:"action requise",               color:"#dc2626" },
          { label:"Budget consommé",     val:`${budgetConsomme}%`, sub:`${(summary.budgetConsomme/1000000).toFixed(1)}M FCFA`, color:"#0f766e" },
        ].map(({ label, val, sub, color }) => (
          <div key={label} className="planifKpiCard" style={{ "--planif-color": color } as React.CSSProperties}>
            <strong style={{ color }}>{val}</strong>
            <span>{label}</span>
            <small>{sub}</small>
          </div>
        ))}
      </div>

      {/* Progress bar budget */}
      <article className="panel" style={{ marginTop:18 }}>
        <div style={{ padding:"10px 20px 8px", display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ fontWeight:600, fontSize:13, whiteSpace:"nowrap" }}>Consommation budget HSE 2026</span>
          <div style={{ flex:1, height:8, background:"var(--line)", borderRadius:999, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${budgetConsomme}%`, background:"#0f766e", borderRadius:999, transition:"width 0.5s ease" }} />
          </div>
          <span style={{ fontSize:12, color:"var(--muted)", whiteSpace:"nowrap" }}>{budgetConsomme}% — {summary.budgetConsomme.toLocaleString("fr-FR")} / {summary.budgetTotal.toLocaleString("fr-FR")} FCFA</span>
        </div>
      </article>

      <div className="dashboardGrid" style={{ marginTop:18 }}>
        <article className="panel" style={{ gridColumn:"span 2" }}>
          <div className="panelHeader"><div><h2>Avancement par trimestre</h2><p>Répartition des activités par statut et trimestre.</p></div></div>
          <div className="chart" style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTrimestre} barCategoryGap="30%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="trimestre" tickLine={false} axisLine={false} tick={{ fontSize:12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize:11 }} width={28} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12, border:"1px solid var(--line)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="realisees"  name="Réalisées"  fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="enCours"    name="En cours"   fill="#2563eb" radius={[4,4,0,0]} />
                <Bar dataKey="planifiees" name="Planifiées" fill="#94a3b8" radius={[4,4,0,0]} />
                <Bar dataKey="enRetard"   name="En retard"  fill="#dc2626" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* ── Section Calendrier ── */}
      <div style={{ marginTop:32 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:10 }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700, color:"var(--text)", margin:0 }}>Calendrier des activités HSE 2026</h3>
            <p style={{ fontSize:12, color:"var(--muted)", margin:"2px 0 0" }}>Programme détaillé avec budgets et responsables.</p>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
            {/* Trimestres */}
            <div style={{ display:"flex", gap:3, background:"var(--hover)", borderRadius:8, padding:"3px" }}>
              {TRIMESTRES.map((t) => (
                <button key={t} type="button" onClick={() => setTrimestre(t)}
                  style={{ fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:6, border:"none", cursor:"pointer", transition:"all 0.15s",
                    background: trimestre === t ? "var(--primary)" : "transparent",
                    color: trimestre === t ? "#fff" : "var(--muted)" }}>{t}</button>
              ))}
            </div>
            <span style={{ width:1, height:24, background:"var(--line)", display:"inline-block" }} />
            {/* Catégories */}
            <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategorie(c)}
                  style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:6, border:`1.5px solid ${categorie === c ? "var(--primary)" : "var(--line)"}`, cursor:"pointer", transition:"all 0.15s",
                    background: categorie === c ? "var(--primary)" : "var(--panel)",
                    color: categorie === c ? "#fff" : "var(--ink)" }}>{c}</button>
              ))}
            </div>
            <span style={{ fontSize:12, color:"var(--muted)", marginLeft:2, whiteSpace:"nowrap" }}>
              {hasAnyColFilter ? `${tableData.length}/${filtered.length}` : `${filtered.length}`} activité{filtered.length > 1 ? "s" : ""}
            </span>
            {hasAnyColFilter && (
              <button type="button" onClick={() => setColFilters({})}
                style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:6, border:"1.5px solid #dc2626", cursor:"pointer", background:"#fef2f2", color:"#dc2626" }}>
                Réinitialiser filtres colonnes
              </button>
            )}
          </div>
        </div>

        <article className="panel" style={{ overflow:"hidden" }}>
          {/* Portal dropdown for column filters */}
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
                  {/* Filterable: Trim. */}
                  <th>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span>Trim.</span>
                      <button type="button"
                        ref={(el) => { btnRefs.current["trimestre"] = el; }}
                        onClick={() => openDropdown("trimestre")}
                        title="Filtrer par trimestre"
                        style={{ border:"none", background:"none", cursor:"pointer", padding:"1px 3px", borderRadius:4, display:"flex", alignItems:"center", color: "trimestre" in colFilters ? "#2563eb" : "var(--muted)", fontSize:11 }}>
                        {"trimestre" in colFilters ? "▼" : "⏷"}
                      </button>
                    </div>
                  </th>
                  {/* Filterable: Mois */}
                  <th>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span>Mois</span>
                      <button type="button"
                        ref={(el) => { btnRefs.current["mois"] = el; }}
                        onClick={() => openDropdown("mois")}
                        title="Filtrer par mois"
                        style={{ border:"none", background:"none", cursor:"pointer", padding:"1px 3px", borderRadius:4, display:"flex", alignItems:"center", color: "mois" in colFilters ? "#2563eb" : "var(--muted)", fontSize:11 }}>
                        {"mois" in colFilters ? "▼" : "⏷"}
                      </button>
                    </div>
                  </th>
                  {/* Filterable: Catégorie */}
                  <th>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span>Catégorie</span>
                      <button type="button"
                        ref={(el) => { btnRefs.current["categorie"] = el; }}
                        onClick={() => openDropdown("categorie")}
                        title="Filtrer par catégorie"
                        style={{ border:"none", background:"none", cursor:"pointer", padding:"1px 3px", borderRadius:4, display:"flex", alignItems:"center", color: "categorie" in colFilters ? "#2563eb" : "var(--muted)", fontSize:11 }}>
                        {"categorie" in colFilters ? "▼" : "⏷"}
                      </button>
                    </div>
                  </th>
                  {/* Plain: Activité */}
                  <th>Activité</th>
                  {/* Filterable: Responsable */}
                  <th>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span>Responsable</span>
                      <button type="button"
                        ref={(el) => { btnRefs.current["responsable"] = el; }}
                        onClick={() => openDropdown("responsable")}
                        title="Filtrer par responsable"
                        style={{ border:"none", background:"none", cursor:"pointer", padding:"1px 3px", borderRadius:4, display:"flex", alignItems:"center", color: "responsable" in colFilters ? "#2563eb" : "var(--muted)", fontSize:11 }}>
                        {"responsable" in colFilters ? "▼" : "⏷"}
                      </button>
                    </div>
                  </th>
                  {/* Filterable: Site */}
                  <th>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span>Site</span>
                      <button type="button"
                        ref={(el) => { btnRefs.current["site"] = el; }}
                        onClick={() => openDropdown("site")}
                        title="Filtrer par site"
                        style={{ border:"none", background:"none", cursor:"pointer", padding:"1px 3px", borderRadius:4, display:"flex", alignItems:"center", color: "site" in colFilters ? "#2563eb" : "var(--muted)", fontSize:11 }}>
                        {"site" in colFilters ? "▼" : "⏷"}
                      </button>
                    </div>
                  </th>
                  {/* Plain: Budget */}
                  <th style={{ textAlign:"right" }}>Budget (FCFA)</th>
                  {/* Filterable: Statut */}
                  <th>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span>Statut</span>
                      <button type="button"
                        ref={(el) => { btnRefs.current["statut"] = el; }}
                        onClick={() => openDropdown("statut")}
                        title="Filtrer par statut"
                        style={{ border:"none", background:"none", cursor:"pointer", padding:"1px 3px", borderRadius:4, display:"flex", alignItems:"center", color: "statut" in colFilters ? "#2563eb" : "var(--muted)", fontSize:11 }}>
                        {"statut" in colFilters ? "▼" : "⏷"}
                      </button>
                    </div>
                  </th>
                  {/* Plain: Commentaire */}
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((p) => {
                  const Icon = STATUT_ICON[p.statut];
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight:700, color:"var(--primary)", fontSize:12 }}>{p.trimestre}</td>
                      <td style={{ fontSize:12, whiteSpace:"nowrap" }}>{p.mois}</td>
                      <td>
                        <span className="status" style={{ background:"var(--bg)", color:"var(--muted)", fontSize:11, border:"1px solid var(--line)" }}>
                          {p.categorie}
                        </span>
                      </td>
                      <td style={{ fontSize:12, maxWidth:240 }}>{p.activite}</td>
                      <td style={{ fontSize:12, whiteSpace:"nowrap" }}>{p.responsable}</td>
                      <td style={{ fontSize:12 }}>{p.site}</td>
                      <td style={{ textAlign:"right", fontSize:12, fontVariantNumeric:"tabular-nums", fontWeight:500 }}>
                        {p.budget_fcfa.toLocaleString("fr-FR")}
                      </td>
                      <td>
                        <span className="status" style={{ background:`${STATUT_COLOR[p.statut]}22`, color:STATUT_COLOR[p.statut], fontSize:11, display:"inline-flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
                          <Icon size={11} />
                          {p.statut}
                        </span>
                      </td>
                      <td style={{ fontSize:11, color:"var(--muted)", maxWidth:200 }}>{p.commentaire || "—"}</td>
                    </tr>
                  );
                })}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign:"center", padding:"28px 0", fontSize:13, color:"var(--muted)" }}>
                      Aucune activité ne correspond aux filtres sélectionnés.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
