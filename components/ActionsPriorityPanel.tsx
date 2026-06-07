"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";
import { AlertCircle, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { dateInRange } from "@/lib/date-utils";

type ActionRow = {
  label:       string;
  priorite:    "Critique" | "Haute" | "Normale" | "Basse";
  statut:      "Ouvert" | "En cours" | "Clos" | "En retard";
  site:        string;
  echeance:    string;
  responsable: string;
};

const ACTIONS: ActionRow[] = [
  { label:"Réviser procédure levage site Bouake",        priorite:"Critique",statut:"En retard",site:"Bouake",       echeance:"15/05/2026",responsable:"M. Diallo" },
  { label:"Former les chauffeurs engins Abidjan",        priorite:"Critique",statut:"En cours", site:"Abidjan",      echeance:"20/06/2026",responsable:"A. Kouadio" },
  { label:"Remédier aux écarts audit produits chimiques",priorite:"Haute",   statut:"En retard",site:"San Pedro",    echeance:"25/05/2026",responsable:"N. Kone" },
  { label:"Mettre à jour registre EPI Yamoussoukro",     priorite:"Haute",   statut:"Ouvert",   site:"Yamoussoukro", echeance:"30/06/2026",responsable:"S. Traore" },
  { label:"Clôturer permis espace confiné n° 44",        priorite:"Critique",statut:"En retard",site:"Abidjan",      echeance:"01/06/2026",responsable:"A. Kouadio" },
  { label:"Plan clôture incidents gravité élevée",       priorite:"Haute",   statut:"En cours", site:"Bouake",       echeance:"10/06/2026",responsable:"M. Diallo" },
  { label:"Audit interne EPI trimestriel",               priorite:"Normale", statut:"Ouvert",   site:"Abidjan",      echeance:"15/06/2026",responsable:"K. Yao" },
  { label:"Briefing sécurité nouvelles recrues",         priorite:"Normale", statut:"Clos",     site:"San Pedro",    echeance:"01/05/2026",responsable:"N. Kone" },
  { label:"Inspection mensuelle échafaudages",           priorite:"Haute",   statut:"Clos",     site:"Yamoussoukro", echeance:"31/05/2026",responsable:"S. Traore" },
  { label:"Afficher consignes évacuation zone C",        priorite:"Basse",   statut:"Clos",     site:"Abidjan",      echeance:"15/05/2026",responsable:"A. Kouadio" },
];

const PRIORITY_ORDER = ["Critique","Haute","Normale","Basse"] as const;
const PRIORITY_COLOR: Record<string, string> = {
  Critique:"#c2410c", Haute:"#b45309", Normale:"#2563eb", Basse:"#64748b",
};
const STATUS_COLOR: Record<string, string> = {
  Clos:"#0f766e", "En cours":"#2563eb", Ouvert:"#b45309", "En retard":"#c2410c",
};

export function ActionsPriorityPanel() {
  const [mounted, setMounted] = useState(false);
  const [prioriteFilter, setPrioriteFilter] = useState<string>("Toutes");
  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);
  useEffect(() => { setMounted(true); }, []);

  const baseData = useMemo(() =>
    ACTIONS.filter((a) =>
      (!activeSites || activeSites.includes(a.site)) &&
      dateInRange(a.echeance, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const filtered = useMemo(() =>
    baseData.filter((a) => prioriteFilter === "Toutes" || a.priorite === prioriteFilter),
  [baseData, prioriteFilter]);

  const byPriority = useMemo(() =>
    PRIORITY_ORDER.map((p) => {
      const items = baseData.filter((a) => a.priorite === p);
      const clos    = items.filter((a) => a.statut === "Clos").length;
      const retard  = items.filter((a) => a.statut === "En retard").length;
      const enCours = items.filter((a) => a.statut === "En cours").length;
      return { priorite:p, total:items.length, clos, retard, enCours, ouvert:items.filter((a) => a.statut === "Ouvert").length,
        txCloture:items.length ? Math.round((clos/items.length)*100) : 0 };
    }),
  [baseData]);

  const byStatus = useMemo(() => {
    const m: Record<string, number> = {};
    baseData.forEach((a) => { m[a.statut] = (m[a.statut] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [baseData]);

  const bySiteStatut = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    baseData.forEach((a) => {
      if (!m[a.site]) m[a.site] = { Clos:0, "En cours":0, Ouvert:0, "En retard":0 };
      m[a.site][a.statut]++;
    });
    return Object.entries(m).map(([site, v]) => ({ site, ...v }));
  }, [baseData]);

  const overdueActions = useMemo(() => baseData.filter((a) => a.statut === "En retard"), [baseData]);
  const tauxCloture    = baseData.length ? Math.round((baseData.filter((a) => a.statut === "Clos").length / baseData.length) * 100) : 0;
  const critiquesOuvertes = baseData.filter((a) => a.priorite === "Critique" && a.statut !== "Clos").length;

  const kpis = [
    { label:"Actions totales",    val:baseData.length,        color:"#0f766e", icon:CheckCircle2, sub:`${tauxCloture}% clôturées` },
    { label:"En retard",          val:overdueActions.length,  color:"#dc2626", icon:AlertCircle,  sub:"dépassement échéance" },
    { label:"Critiques ouvertes", val:critiquesOuvertes,      color:"#c2410c", icon:AlertTriangle, sub:"priorité maximale" },
    { label:"En cours",           val:baseData.filter((a) => a.statut === "En cours").length, color:"#2563eb", icon:Clock, sub:"en exécution" },
  ];

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Pilotage des Actions Correctives &amp; Préventives</h2>
          <p>{overdueActions.length} action{overdueActions.length > 1 ? "s" : ""} en retard — taux de clôture : {tauxCloture}% (objectif 85%).</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="actionsKpis">
        {kpis.map(({ label, val, color, icon:Icon, sub }) => (
          <div key={label} className="actionsKpiCard" style={{ "--priority-color": color } as React.CSSProperties}>
            <div style={{ display:"flex", justifyContent:"space-between", width:"100%" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <strong style={{ color, fontSize:26, fontWeight:700, lineHeight:1 }}>{val}</strong>
            <small style={{ color:"var(--muted)", fontSize:11 }}>{sub}</small>
          </div>
        ))}
      </div>

      {/* Global clôture progress */}
      <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--line)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
          <span style={{ color:"var(--muted)", fontWeight:500 }}>Taux de clôture global — objectif 85%</span>
          <span style={{ fontWeight:700, color: tauxCloture >= 85 ? "#16a34a" : tauxCloture >= 60 ? "#d97706" : "#dc2626" }}>{tauxCloture}%</span>
        </div>
        <div style={{ height:8, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ display:"flex", height:"100%", overflow:"hidden", borderRadius:99 }}>
            <div style={{ width:`${tauxCloture}%`, background:"linear-gradient(90deg,#16a34a,#0f766e)", transition:"width .5s" }} />
            <div style={{ width:`${Math.round((ACTIONS.filter((a) => a.statut === "En cours").length / ACTIONS.length)*100)}%`, background:"#2563eb" }} />
            <div style={{ width:`${Math.round((overdueActions.length / ACTIONS.length)*100)}%`, background:"#dc2626" }} />
            <div style={{ flex:1, background:"#d97706" }} />
          </div>
        </div>
        <div style={{ display:"flex", gap:12, marginTop:6, fontSize:11, flexWrap:"wrap" }}>
          <span style={{ color:"#16a34a" }}>● Clôturées : {ACTIONS.filter((a) => a.statut === "Clos").length}</span>
          <span style={{ color:"#2563eb" }}>● En cours : {ACTIONS.filter((a) => a.statut === "En cours").length}</span>
          <span style={{ color:"#dc2626" }}>● En retard : {overdueActions.length}</span>
          <span style={{ color:"#d97706" }}>● Ouvertes : {ACTIONS.filter((a) => a.statut === "Ouvert").length}</span>
        </div>
      </div>

      {/* Priority filter */}
      <div style={{ display:"flex", gap:6, margin:"14px 0 0", flexWrap:"wrap" }}>
        {["Toutes",...PRIORITY_ORDER].map((p) => (
          <button key={p} type="button" className={prioriteFilter === p ? "periodBtn active" : "periodBtn"}
            style={{ fontSize:11, ...(prioriteFilter === p && PRIORITY_COLOR[p] ? { borderColor:PRIORITY_COLOR[p], color:PRIORITY_COLOR[p] } : {}) }}
            onClick={() => setPrioriteFilter(p)}>{p}</button>
        ))}
        <span style={{ fontSize:12, color:"var(--muted)", alignSelf:"center", marginLeft:6 }}>{filtered.length} action{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {/* Priority breakdown cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginTop:16 }}>
        {byPriority.map((row) => (
          <div key={row.priorite} style={{ padding:"12px 14px", borderRadius:10, border:`1.5px solid ${PRIORITY_COLOR[row.priorite]}33`,
            background:`${PRIORITY_COLOR[row.priorite]}08`, cursor:"pointer" }}
            onClick={() => setPrioriteFilter(prioriteFilter === row.priorite ? "Toutes" : row.priorite)}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:PRIORITY_COLOR[row.priorite] }}>{row.priorite}</span>
              <span style={{ fontSize:20, fontWeight:800, color:PRIORITY_COLOR[row.priorite] }}>{row.total}</span>
            </div>
            <div style={{ height:4, background:"var(--line)", borderRadius:99, overflow:"hidden", marginBottom:6 }}>
              <div style={{ width:`${row.txCloture}%`, height:"100%", background:PRIORITY_COLOR[row.priorite], borderRadius:99 }} />
            </div>
            <div style={{ fontSize:10, color:"var(--muted)", display:"flex", justifyContent:"space-between" }}>
              <span>{row.txCloture}% clôturé</span>
              {row.retard > 0 && <span style={{ color:"#dc2626", fontWeight:600 }}>{row.retard} retard{row.retard > 1 ? "s" : ""}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* By site */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Actions par site</h2><p>Clôturées, en cours, ouvertes et en retard par localisation.</p></div></div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySiteStatut} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="Clos"       name="Clôturées"  fill="#0f766e" stackId="a" />
                  <Bar dataKey="En cours"   name="En cours"   fill="#2563eb" stackId="a" />
                  <Bar dataKey="Ouvert"     name="Ouvertes"   fill="#b45309" stackId="a" />
                  <Bar dataKey="En retard"  name="En retard"  fill="#c2410c" stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        {/* Pie statut */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Répartition par statut</h2><p>Distribution globale des {ACTIONS.length} actions.</p></div></div>
          <div className="chart compact" style={{ position:"relative" }}>
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48}>
                    {byStatus.map((e) => <Cell key={e.name} fill={STATUS_COLOR[e.name] ?? "#94a3b8"} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-65%)", textAlign:"center", pointerEvents:"none" }}>
              <div style={{ fontSize:20, fontWeight:800, color: tauxCloture >= 85 ? "#16a34a" : "#d97706" }}>{tauxCloture}%</div>
              <div style={{ fontSize:10, color:"var(--muted)" }}>clôturées</div>
            </div>
          </div>
        </article>
      </div>

      {/* Overdue alerts */}
      {overdueActions.length > 0 && (
        <article className="panel" style={{ marginTop:18, borderLeft:"3px solid #dc2626" }}>
          <div className="panelHeader">
            <div><h2>Actions en retard — escalade requise</h2><p>{overdueActions.length} action{overdueActions.length > 1 ? "s" : ""} dépassant leur échéance — intervention immédiate.</p></div>
          </div>
          <div style={{ padding:"8px 0" }}>
            {overdueActions.map((a, i) => (
              <div key={i} style={{ padding:"10px 16px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{a.label}</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{a.responsable} — {a.site}</div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                  <span className="status" style={{ background:`${PRIORITY_COLOR[a.priorite]}22`, color:PRIORITY_COLOR[a.priorite], fontSize:11 }}>{a.priorite}</span>
                  <span style={{ fontSize:11, color:"#dc2626", fontWeight:700 }}>Éch. {a.echeance}</span>
                  <span className="status" style={{ background:"#dc262622", color:"#dc2626", fontSize:11 }}>En retard</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Full actions table */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader">
          <div><h2>Registre complet — {filtered.length} action{filtered.length > 1 ? "s" : ""}</h2><p>Filtrer par priorité ou site ci-dessus.</p></div>
          <a className="secondaryButton" href="/modules/actions" style={{ fontSize:12 }}>Voir module →</a>
        </div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Action</th><th>Priorité</th><th>Site</th><th>Responsable</th><th>Échéance</th><th>Statut</th></tr></thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} style={{ background: a.statut === "En retard" ? "#fef2f222" : undefined }}>
                  <td style={{ fontSize:12, maxWidth:260 }}>{a.label}</td>
                  <td><span className="status" style={{ background:`${PRIORITY_COLOR[a.priorite]}22`, color:PRIORITY_COLOR[a.priorite], fontSize:11 }}>{a.priorite}</span></td>
                  <td style={{ fontSize:12 }}>{a.site}</td>
                  <td style={{ fontSize:12, whiteSpace:"nowrap" }}>{a.responsable}</td>
                  <td style={{ fontSize:12, fontWeight:600, color:a.statut === "En retard" ? "#dc2626" : "inherit" }}>{a.echeance}</td>
                  <td><span className="status" style={{ background:`${STATUS_COLOR[a.statut]}22`, color:STATUS_COLOR[a.statut], fontSize:11 }}>{a.statut}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
