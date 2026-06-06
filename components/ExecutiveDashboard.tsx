"use client";

import { useMemo } from "react";
import { ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar, Cell, LabelList, Pie, PieChart } from "recharts";
import { getVbgByType, vbgIncidents } from "@/lib/vbg-data";
import { useCockpitFilter, dateInRange } from "@/lib/use-cockpit-filter";
import { getFilteredCockpitStats } from "@/lib/cockpit-stats";
import { getTrainingSummary } from "@/lib/training-data";
import { getCauserieSummary } from "@/lib/causeries-data";
import { getDuerpSummary } from "@/lib/duerp-data";
import { getMedicalSummary } from "@/lib/medical-data";
import { getConsommationSummary } from "@/lib/consumption-data";
import { Shield, TrendingDown, TrendingUp, Minus, AlertTriangle, CheckCircle2, Target } from "lucide-react";

function TrafficLight({ value, thresholds }: { value: number; thresholds: [number, number] }) {
  const color = value >= thresholds[1] ? "#16a34a" : value >= thresholds[0] ? "#d97706" : "#dc2626";
  return <span style={{ display:"inline-block", width:14, height:14, borderRadius:"50%", background:color, boxShadow:`0 0 0 3px ${color}33` }} />;
}

export function ExecutiveDashboard() {
  const { villes, projets, dateDebut, dateFin } = useCockpitFilter();
  const cockpitStats = useMemo(
    () => getFilteredCockpitStats(villes, projets, dateDebut, dateFin),
    [villes, projets, dateDebut, dateFin],
  );

  const v = villes.length === 1 ? villes[0] : undefined;
  const trainingSummary = useMemo(() => getTrainingSummary(v, dateDebut, dateFin),    [v, dateDebut, dateFin]);
  const causerieSummary = useMemo(() => getCauserieSummary(v, dateDebut, dateFin),    [v, dateDebut, dateFin]);
  const duerpSummary    = useMemo(() => getDuerpSummary(v, dateDebut, dateFin),       [v, dateDebut, dateFin]);
  const medicalSummary  = useMemo(() => getMedicalSummary(v, dateDebut, dateFin),     [v, dateDebut, dateFin]);
  const consoSummary    = useMemo(() => getConsommationSummary(v, dateDebut, dateFin),[v, dateDebut, dateFin]);

  const isFiltered = cockpitStats.isFiltered;

  const byType = useMemo(() => getVbgByType(), []);
  const pieStatut = useMemo(() => {
    const map: Record<string, number> = {};
    vbgIncidents.forEach((i) => { map[i.statut] = (map[i.statut] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  // Période précédente : même durée, immédiatement avant la période sélectionnée
  const { prevDebut, prevFin } = useMemo(() => {
    if (!dateDebut && !dateFin) return { prevDebut: undefined, prevFin: undefined };
    if (dateDebut && dateFin) {
      const start = new Date(dateDebut);
      const end   = new Date(dateFin);
      const ms    = end.getTime() - start.getTime();
      const pEnd  = new Date(start.getTime() - 86400000);
      const pStart = new Date(pEnd.getTime() - ms);
      return { prevDebut: pStart.toISOString().slice(0, 10), prevFin: pEnd.toISOString().slice(0, 10) };
    }
    if (dateDebut) {
      const d = new Date(dateDebut); d.setMonth(d.getMonth() - 1);
      return { prevDebut: d.toISOString().slice(0, 10), prevFin: new Date(new Date(dateDebut).getTime() - 86400000).toISOString().slice(0, 10) };
    }
    const d = new Date(dateFin!); d.setMonth(d.getMonth() - 1);
    return { prevDebut: d.toISOString().slice(0, 10), prevFin: dateFin };
  }, [dateDebut, dateFin]);

  const prevStats    = useMemo(() => isFiltered ? getFilteredCockpitStats(villes, projets, prevDebut, prevFin) : null, [villes, projets, prevDebut, prevFin, isFiltered]);

  const kpis = [
    { label:"Accidents ce mois",         val: isFiltered ? cockpitStats.criticalCount    : 7,    prev: isFiltered ? (prevStats?.criticalCount    ?? 0) : 11, unit:"",   icon:AlertTriangle, color:"#dc2626", thresholds:[5,10]    as [number,number], lower:true },
    ...(!isFiltered ? [
      { label:"TF (acc. avec arrêt×1M/h)", val: 2.8,  prev:3.4, unit:"",   icon:TrendingDown, color:"#ea580c", thresholds:[3,5]     as [number,number], lower:true },
      { label:"Heures sans accident",       val: 1240, prev:850, unit:" h", icon:Shield,       color:"#16a34a", thresholds:[500,1000] as [number,number], lower:false },
    ] : []),
    { label:"Taux conformité global",    val: cockpitStats.averageCompliance,                    prev: isFiltered ? (prevStats?.averageCompliance  ?? 0) : 79, unit:"%",  icon:CheckCircle2,  color:"#0f766e", thresholds:[75,85]   as [number,number], lower:false },
    { label:"Actions en retard",         val: cockpitStats.totalOpenItems,                       prev: isFiltered ? (prevStats?.totalOpenItems      ?? 0) : 52, unit:"",   icon:AlertTriangle, color:"#d97706", thresholds:[20,40]   as [number,number], lower:true },
    { label:"Habilitations à jour",      val: trainingSummary.tauxAJour,         prev: 80, unit:"%",  icon:Target,        color:"#2563eb", thresholds:[80,90]  as [number,number], lower:false },
    { label:"Taux causeries",            val: causerieSummary.tauxParticipation, prev: 88, unit:"%",  icon:CheckCircle2,  color:"#0f766e", thresholds:[90,100] as [number,number], lower:false },
    { label:"Risques critiques DUERP",   val: duerpSummary.critique,             prev: 3,  unit:"",   icon:AlertTriangle, color:"#dc2626", thresholds:[3,6]    as [number,number], lower:true },
  ];

  const siteScores = cockpitStats.filteredSites.map((s) => ({
    ...s,
    status: s.conformite >= 85 ? "vert" : s.conformite >= 70 ? "orange" : "rouge",
  }));

  const ALL_RISQUES = [
    { titre:"Chute de hauteur — Echafaudage",  ville:"Abidjan",      projectId:"PRJ-ABJ-002", niveau:"Critique", criticite:60, action:"Formation recyclage en cours",                date:"12/03/2025" },
    { titre:"Collision engin/piéton",          ville:"Bouake",       projectId:"PRJ-BKE-001", niveau:"Critique", criticite:45, action:"Plan circulation à réviser",                  date:"08/04/2025" },
    { titre:"Stress thermique",                ville:"Yamoussoukro", projectId:"PRJ-YMK-001", niveau:"Élevé",    criticite:45, action:"Protocole canicule validé",                   date:"20/06/2025" },
    { titre:"Déversement produits chimiques",  ville:"San Pedro",    projectId:"PRJ-SPD-001", niveau:"Élevé",    criticite:36, action:"Mise à jour plan intervention d'urgence",     date:"15/02/2025" },
    { titre:"Risque électrique — tableaux HT", ville:"Abidjan",      projectId:"PRJ-ABJ-001", niveau:"Critique", criticite:54, action:"Habilitations électriques à renouveler",      date:"03/05/2025" },
    { titre:"Travaux en hauteur sans EPI",     ville:"Bouake",       projectId:"PRJ-BKE-002", niveau:"Critique", criticite:48, action:"Arrêt chantier jusqu'à équipement complet",   date:"28/01/2025" },
  ];

  const topRisques = ALL_RISQUES.filter((r) => {
    if (projets.length && !projets.includes(r.projectId))   return false;
    if (villes.length  && !villes.includes(r.ville))        return false;
    if (!dateInRange(r.date, dateDebut, dateFin))            return false;
    return true;
  }).slice(0, 3);

  const trend = cockpitStats.filteredTrend.map((m) => ({ ...m, objectif: 8 }));

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Tableau de bord Direction — Vue exécutive HSE</h2>
          <p>Synthèse consolidée tous modules — mise à jour en temps réel.</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Shield size={18} style={{ color:"var(--primary)" }} />
          <span style={{ fontSize:13, color:"var(--muted)" }}>
            {(() => {
              const fmt = (iso: string) => iso.split("-").reverse().join("/");
              if (dateDebut && dateFin) return `Période : ${fmt(dateDebut)} – ${fmt(dateFin)}`;
              if (dateDebut)           return `Depuis le ${fmt(dateDebut)}`;
              if (dateFin)             return `Jusqu'au ${fmt(dateFin)}`;
              return "Toute période";
            })()}
          </span>
        </div>
      </div>

      {/* KPI Scorecard */}
      <div className="execKpiGrid">
        {kpis.map(({ label, val, prev, unit, color, thresholds, lower, icon: Icon }) => {
          const diff   = Number(val) - prev;
          const better = lower ? diff < 0 : diff > 0;
          const TrendIcon = diff === 0 ? Minus : better ? TrendingDown : TrendingUp;
          const trendColor = diff === 0 ? "var(--muted)" : better ? "#16a34a" : "#dc2626";
          return (
            <div key={label} className="execKpiCard">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <Icon size={16} style={{ color }} />
                <TrafficLight value={Number(val)} thresholds={thresholds} />
              </div>
              <strong style={{ fontSize:28, fontWeight:700, letterSpacing:"-0.02em", color }}>{Number.isInteger(val) ? val : Number(val).toFixed(1)}{unit}</strong>
              <span style={{ fontSize:12, color:"var(--muted)" }}>{label}</span>
              <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11 }}>
                <TrendIcon size={12} style={{ color:trendColor }} />
                <span style={{ color:trendColor }}>{diff > 0 ? "+" : ""}{Number.isInteger(diff) ? diff : diff.toFixed(1)}{unit} {isFiltered ? "vs période préc." : "vs mois préc."}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Site traffic lights + Top risques */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        <article className="panel">
          <div className="panelHeader"><div><h2>Performance par site</h2><p>Conformité et volume d&apos;événements par site.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteScores} layout="vertical" barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fontSize:11 }} />
                <YAxis type="category" dataKey="site" width={110} tickLine={false} axisLine={false} tick={{ fontSize:12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="conformite" name="Conformite %" fill="#0f766e" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="conformite" position="right" formatter={(v: unknown) => `${v}%`} style={{ fontSize:11, fill:"#0f766e", fontWeight:600 }} />
                </Bar>
                <Bar dataKey="evenements" name="Evenements" fill="#c2410c" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="evenements" position="right" style={{ fontSize:11, fill:"#c2410c", fontWeight:600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader"><div><h2>Top 3 risques prioritaires</h2><p>Actions immédiates requises.</p></div></div>
          <div style={{ padding:"8px 16px", display:"flex", flexDirection:"column", gap:10 }}>
            {topRisques.map((r, i) => (
              <div key={i} style={{ padding:"12px 14px", background:"var(--bg)", borderRadius:8, borderLeft:`3px solid ${r.niveau === "Critique" ? "#dc2626" : "#ea580c"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontWeight:600, fontSize:13 }}>{r.titre} — <span style={{ color:"var(--muted)", fontWeight:400 }}>{r.ville}</span></span>
                  <span style={{ fontSize:12, fontWeight:700, color: r.niveau === "Critique" ? "#dc2626" : "#ea580c" }}>Criticité {r.criticite}</span>
                </div>
                <span style={{ fontSize:12, color:"var(--muted)" }}>→ {r.action}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel" style={{ display:"flex", flexDirection:"column" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", borderBottom:"1px solid var(--line)" }}>
            <div className="panelHeader" style={{ borderRight:"1px solid var(--line)", margin:0 }}>
              <div><h2>Incidents VBG par type</h2><p>Classification OMS/WB</p></div>
            </div>
            <div className="panelHeader" style={{ margin:0 }}>
              <div><h2>Statut des incidents</h2><p>Cible : 0 ouvert</p></div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", flex:1, minHeight:220 }}>
            <div style={{ padding:"8px 0", borderRight:"1px solid var(--line)" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType} layout="vertical" margin={{ top:8, right:28, bottom:8, left:8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize:11 }} />
                  <YAxis type="category" dataKey="type" width={170} tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Incidents" fill="#be185d" radius={[0,4,4,0]} barSize={14}>
                    <LabelList dataKey="count" position="right" style={{ fontSize:11, fill:"#be185d", fontWeight:700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"12px 16px", gap:12 }}>
              {(() => {
                const COULEURS: Record<string,string> = { "Clôturé":"#16a34a","Résolu":"#22c55e","En investigation":"#d97706","Signalé":"#dc2626","Non fondé":"#94a3b8","Référé":"#7c3aed" };
                return (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart margin={{ top:16, right:16, bottom:16, left:16 }}>
                        <Pie data={pieStatut} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55}
                          label={({ percent }) => percent ? `${Math.round(percent * 100)}%` : ""} labelLine={false}>
                          {pieStatut.map((e) => <Cell key={e.name} fill={COULEURS[e.name] ?? "#94a3b8"} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:5 }}>
                      {pieStatut.map((e) => (
                        <div key={e.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:11 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ width:8, height:8, borderRadius:2, background:COULEURS[e.name] ?? "#94a3b8", flexShrink:0 }} />
                            <span style={{ color:"var(--text)" }}>{e.name}</span>
                          </div>
                          <strong style={{ color:COULEURS[e.name] ?? "#94a3b8" }}>{e.value}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader"><div><h2>Évolution accidents — 6 mois</h2><p>Accidents déclarés vs objectif mensuel.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="month" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="accidents" name="Accidents" stroke="#dc2626" strokeWidth={2} dot={{ r:4 }} />
                <Line type="monotone" dataKey="objectif"  name="Objectif"  stroke="#16a34a" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* Synthèse indicateurs métier */}
      <div className="execSynthese" style={{ marginTop:18 }}>
        {[
          { label:"Habilitations valides",      val:`${trainingSummary.valide}/${trainingSummary.total}`,     pct:trainingSummary.tauxAJour,        color:"#2563eb" },
          { label:"Causeries ce mois",          val:`${causerieSummary.realisesMois}/${causerieSummary.objectifMensuel}`, pct:Math.min(causerieSummary.tauxRealisation,100), color:"#0f766e" },
          { label:"Visites médicales à jour",   val:`${medicalSummary.total - medicalSummary.enRetard}/${medicalSummary.total}`, pct:medicalSummary.tauxAJour, color:"#16a34a" },
          { label:"Risques DUERP maîtrisés",    val:`${duerpSummary.maitrise}/${duerpSummary.total}`,         pct:duerpSummary.tauxMaitrise,         color:"#d97706" },
          { label:"CO₂ émis (tonnes)",           val:`${consoSummary.co2.toFixed(0)}`,                        pct: Math.max(0, 100 - Math.round(consoSummary.co2/500*100)), color:"#7c3aed" },
        ].map(({ label, val, pct, color }) => (
          <div key={label} className="execSyntheseCard">
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
              <span style={{ color:"var(--muted)" }}>{label}</span>
              <strong style={{ color }}>{val}</strong>
            </div>
            <div style={{ height:6, background:"var(--line)", borderRadius:999, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:999, transition:"width 0.5s ease" }} />
            </div>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>{pct}%</div>
          </div>
        ))}
      </div>
    </section>
  );
}
