"use client";

import { useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar, Cell } from "recharts";
import { modules, moduleOperationalKpis } from "@/lib/hse-data";
import { useCockpitFilter } from "@/lib/use-cockpit-filter";
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
  const { villes, projets } = useCockpitFilter();
  const cockpitStats = useMemo(() => getFilteredCockpitStats(villes, projets), [villes, projets]);

  const v = villes.length === 1 ? villes[0] : undefined;
  const trainingSummary = useMemo(() => getTrainingSummary(v),         [v]);
  const causerieSummary = useMemo(() => getCauserieSummary(v),         [v]);
  const duerpSummary    = useMemo(() => getDuerpSummary(v),            [v]);
  const medicalSummary  = useMemo(() => getMedicalSummary(v),          [v]);
  const consoSummary    = useMemo(() => getConsommationSummary(v),     [v]);

  const radarData = cockpitStats.moduleStats.map((m) => ({ subject: m.shortName, conformite: m.compliance, full: 100 }));

  const isFiltered = cockpitStats.isFiltered;

  const kpis = [
    { label:"Accidents ce mois",        val: isFiltered ? cockpitStats.criticalCount       : 7,    prev:11,  unit:"",   icon:AlertTriangle, color:"#dc2626", thresholds:[5,10]    as [number,number], lower:true },
    { label:"TF (acc. avec arrêt×1M/h)",val: 2.8,                                                  prev:3.4, unit:"",   icon:TrendingDown,  color:"#ea580c", thresholds:[3,5]     as [number,number], lower:true },
    { label:"Heures sans accident",      val: 1240,                                                 prev:850, unit:" h", icon:Shield,        color:"#16a34a", thresholds:[500,1000] as [number,number], lower:false },
    { label:"Taux conformité global",    val: cockpitStats.averageCompliance,                       prev:79,  unit:"%",  icon:CheckCircle2,  color:"#0f766e", thresholds:[75,85]   as [number,number], lower:false },
    { label:"Actions en retard",         val: cockpitStats.totalOpenItems,                          prev:52,  unit:"",   icon:AlertTriangle, color:"#d97706", thresholds:[20,40]   as [number,number], lower:true },
    { label:"Habilitations à jour",      val: trainingSummary.tauxAJour,                            prev:80,  unit:"%",  icon:Target,        color:"#2563eb", thresholds:[80,90]   as [number,number], lower:false },
    { label:"Taux causeries",            val: causerieSummary.tauxParticipation,                    prev:88,  unit:"%",  icon:CheckCircle2,  color:"#0f766e", thresholds:[90,100]  as [number,number], lower:false },
    { label:"Risques critiques DUERP",   val: duerpSummary.critique,                                prev:3,   unit:"",   icon:AlertTriangle, color:"#dc2626", thresholds:[3,6]     as [number,number], lower:true },
  ];

  const siteScores = cockpitStats.filteredSites.map((s) => ({
    ...s,
    status: s.conformite >= 85 ? "vert" : s.conformite >= 70 ? "orange" : "rouge",
  }));

  const ALL_RISQUES = [
    { titre:"Chute de hauteur — Echafaudage",  ville:"Abidjan",      niveau:"Critique", criticite:60, action:"Formation recyclage en cours" },
    { titre:"Collision engin/piéton",          ville:"Bouake",       niveau:"Critique", criticite:45, action:"Plan circulation à réviser" },
    { titre:"Stress thermique",                ville:"Yamoussoukro", niveau:"Élevé",    criticite:45, action:"Protocole canicule validé" },
    { titre:"Déversement produits chimiques",  ville:"San Pedro",    niveau:"Élevé",    criticite:36, action:"Mise à jour plan intervention d'urgence" },
    { titre:"Risque électrique — tableaux HT", ville:"Abidjan",      niveau:"Critique", criticite:54, action:"Habilitations électriques à renouveler" },
    { titre:"Travaux en hauteur sans EPI",     ville:"Bouake",       niveau:"Critique", criticite:48, action:"Arrêt chantier jusqu'à équipement complet" },
  ];

  const topRisques = (villes.length
    ? ALL_RISQUES.filter((r) => villes.includes(r.ville))
    : ALL_RISQUES
  ).slice(0, 3);

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
          <span style={{ fontSize:13, color:"var(--muted)" }}>Période : Juin 2026</span>
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
                <span style={{ color:trendColor }}>{diff > 0 ? "+" : ""}{Number.isInteger(diff) ? diff : diff.toFixed(1)}{unit} vs mois préc.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Site traffic lights + Top risques */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        <article className="panel">
          <div className="panelHeader"><div><h2>Performance par site</h2><p>Feux tricolores — conformité HSE.</p></div></div>
          <div style={{ padding:"8px 16px", display:"flex", flexDirection:"column", gap:10 }}>
            {siteScores.map((s) => (
              <div key={s.site} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"var(--bg)", borderRadius:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <TrafficLight value={s.conformite} thresholds={[70, 85]} />
                  <span style={{ fontWeight:600 }}>{s.site}</span>
                </div>
                <div style={{ display:"flex", gap:16, fontSize:13 }}>
                  <span style={{ color:"var(--muted)" }}>{s.conformite}% conformité</span>
                  <span style={{ color: s.evenements > 30 ? "#dc2626" : "#d97706" }}>{s.evenements} événements</span>
                </div>
              </div>
            ))}
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

        <article className="panel">
          <div className="panelHeader"><div><h2>Conformité par module</h2><p>Radar de performance HSE globale.</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize:11 }} />
                <Radar name="Conformité %" dataKey="conformite" stroke="#0f766e" fill="#0f766e" fillOpacity={0.3} />
                <Tooltip formatter={(v) => [`${v}%`, "Conformité"]} />
              </RadarChart>
            </ResponsiveContainer>
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
