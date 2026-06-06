"use client";

import { useMemo, useState } from "react";
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

export function MedicalPanel() {
  const summary = useMemo(() => getMedicalSummary(), []);
  const [visitFilter, setVisitFilter] = useState<"Tous" | "En retard" | "A venir">("Tous");

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
      <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--line)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
          <span style={{ color:"var(--muted)", fontWeight:500 }}>Suivi de conformité des visites médicales</span>
          <span style={{ fontWeight:700, color: tauxAJour >= 80 ? "#16a34a" : "#d97706" }}>{tauxAJour}% à jour</span>
        </div>
        <div style={{ height:8, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ display:"flex", height:"100%", overflow:"hidden", borderRadius:99 }}>
            <div style={{ width:`${tauxAJour}%`, background:"linear-gradient(90deg,#16a34a,#0f766e)", transition:"width .5s" }} />
            <div style={{ width:`${baseData.length > 0 ? Math.round((aVenir30j / baseData.length) * 100) : 0}%`, background:"#d97706" }} />
            <div style={{ flex:1, background:"#dc2626" }} />
          </div>
        </div>
        <div style={{ display:"flex", gap:16, marginTop:6, fontSize:11, flexWrap:"wrap" }}>
          <span style={{ color:"#16a34a" }}>● À jour : {baseData.length - enRetard}</span>
          <span style={{ color:"#d97706" }}>{"● Échéance < 30j"} : {aVenir30j}</span>
          <span style={{ color:"#dc2626" }}>● En retard : {enRetard}</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:6, margin:"14px 0 0" }}>
        {(["Tous","En retard","A venir"] as const).map((f) => (
          <button key={f} type="button" className={visitFilter === f ? "periodBtn active" : "periodBtn"} onClick={() => setVisitFilter(f)}>{f}</button>
        ))}
        <span style={{ fontSize:12, color:"var(--muted)", alignSelf:"center", marginLeft:6 }}>{filtered.length} salarié{filtered.length > 1 ? "s" : ""}</span>
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
        <article className="panel">
          <div className="panelHeader"><div><h2>Répartition des aptitudes</h2><p>Situation médicale actuelle du personnel.</p></div></div>
          <div className="chart compact" style={{ position:"relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byAptitude} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={52}>
                  {byAptitude.map((e) => <Cell key={e.name} fill={APTITUDE_COLOR[e.name as Aptitude] ?? "#94a3b8"} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-65%)", textAlign:"center", pointerEvents:"none" }}>
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
        <div className="panelHeader"><div><h2>Registre des visites médicales</h2><p>{filtered.length} enregistrement{filtered.length > 1 ? "s" : ""}.</p></div></div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Nom</th><th>Prénom</th><th>Poste</th><th>Site</th><th>Type visite</th><th>Date visite</th><th>Prochaine visite</th><th>Médecin</th><th>Aptitude</th><th>Restrictions</th></tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
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
                    <td style={{ fontSize:12, color: retard ? "#dc2626" : jours <= 30 ? "#d97706" : "inherit", fontWeight: retard || jours <= 30 ? 600 : 400 }}>
                      {v.date_prochaine} {retard ? "⚠ Retard" : jours <= 30 ? `(${jours}j)` : ""}
                    </td>
                    <td style={{ fontSize:12 }}>{v.medecin}</td>
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
