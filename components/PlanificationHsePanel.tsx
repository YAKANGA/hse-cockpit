"use client";

import { useMemo, useState } from "react";
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

export function PlanificationHsePanel() {
  const [trimestre, setTrimestre] = useState<Trimestre | "Tous">("Tous");
  const [categorie, setCategorie] = useState("Toutes");
  const globalFilter = useCockpitFilter();
  const { dateDebut, dateFin } = globalFilter;
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

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
            <span style={{ fontSize:12, color:"var(--muted)", marginLeft:2, whiteSpace:"nowrap" }}>{filtered.length} activité{filtered.length > 1 ? "s" : ""}</span>
          </div>
        </div>

        <article className="panel" style={{ overflow:"hidden" }}>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Trim.</th><th>Mois</th><th>Catégorie</th><th>Activité</th>
                  <th>Responsable</th><th>Site</th>
                  <th style={{ textAlign:"right" }}>Budget (FCFA)</th>
                  <th>Statut</th><th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
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
                {filtered.length === 0 && (
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
