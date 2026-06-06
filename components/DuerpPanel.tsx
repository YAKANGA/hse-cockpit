"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { RISQUES_DUERP, getDuerpSummary, getNiveauRisque, type StatutDuerp } from "@/lib/duerp-data";
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

function matrixCellColor(f: number, g: number): string {
  const s = f * g;
  if (s >= 15) return "#dc2626";
  if (s >= 9)  return "#ea580c";
  if (s >= 5)  return "#d97706";
  return "#16a34a";
}

export function DuerpPanel() {
  const summary = useMemo(() => getDuerpSummary(), []);
  const [niveau, setNiveau] = useState("Tous");
  const [statut, setStatut] = useState<StatutDuerp | "Tous">("Tous");

  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  const baseData = useMemo(() =>
    activeSites ? RISQUES_DUERP.filter((r) => activeSites.includes(r.site)) : RISQUES_DUERP,
  [activeSites]);

  const filtered = useMemo(() => baseData.filter((r) =>
    isoDateInRange(r.date_evaluation, globalFilter.dateDebut, globalFilter.dateFin) &&
    (niveau === "Tous" || getNiveauRisque(r.criticite) === niveau) &&
    (statut === "Tous" || r.statut === statut)
  ), [baseData, globalFilter.dateDebut, globalFilter.dateFin, niveau, statut]);

  // Risk matrix: rows = Gravité (5→1), cols = Fréquence (1→5)
  const riskMatrix = useMemo(() => {
    const grid: Record<string, typeof RISQUES_DUERP[0][]> = {};
    for (let f = 1; f <= 5; f++)
      for (let g = 1; g <= 5; g++)
        grid[`${f}-${g}`] = [];
    baseData.forEach((r) => { grid[`${r.frequence}-${r.gravite}`]?.push(r); });
    return grid;
  }, [baseData]);

  const bySiteStatut = useMemo(() => {
    const m: Record<string, Record<StatutDuerp, number>> = {};
    baseData.forEach((r) => {
      if (!m[r.site]) m[r.site] = { "Maitrise": 0, "En cours de traitement": 0, "Non traite": 0 };
      m[r.site][r.statut]++;
    });
    return Object.entries(m).map(([s, v]) => ({ site: s, ...v }));
  }, [baseData]);

  const byNiveau = useMemo(() => {
    const m: Record<string, number> = { Critique: 0, Eleve: 0, Modere: 0, Acceptable: 0 };
    baseData.forEach((r) => { m[getNiveauRisque(r.criticite)]++; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [baseData]);

  const maitrisePct = Math.round((summary.maitrise / summary.total) * 100);

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

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Document Unique d'Évaluation des Risques (DUERP)</h2>
          <p>Ref : Code du travail CI — {filtered.length}/{summary.total} risques affichés — {summary.critique} critiques — {summary.tauxMaitrise}% maîtrisés — <strong>{filterLabel}</strong>.</p>
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
              <div style={{ width:`${Math.round((val / summary.total) * 100)}%`, height:"100%", background:color, borderRadius:99, transition:"width .5s ease" }} />
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
          <div style={{ display:"flex", height:"100%", borderRadius:99, overflow:"hidden" }}>
            <div style={{ width:`${maitrisePct}%`, background:"linear-gradient(90deg,#16a34a,#0f766e)", transition:"width .5s" }} />
            <div style={{ width:`${Math.round(((summary.total - summary.maitrise - summary.nonTraite)/summary.total)*100)}%`, background:"#d97706" }} />
            <div style={{ flex:1, background:"#dc2626" }} />
          </div>
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
            <div><h2>Matrice des risques (F × G)</h2><p>Positionnement des {baseData.length} risques. Survoler une cellule pour voir les dangers.</p></div>
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
              <BarChart data={bySiteStatut} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12, border:"1px solid var(--line)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="Maitrise"               name="Maîtrisé"   fill="#16a34a" stackId="a" />
                <Bar dataKey="En cours de traitement" name="En cours"    fill="#d97706" stackId="a" />
                <Bar dataKey="Non traite"             name="Non traité"  fill="#dc2626" stackId="a" radius={[4,4,0,0]} />
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
            {[...baseData].sort((a, b) => b.criticite - a.criticite).slice(0, 6).map((r) => {
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
        <div className="panelHeader"><div><h2>Registre complet — {filtered.length} risque{filtered.length > 1 ? "s" : ""}</h2><p>Score criticité = F × G × P. Cliquer sur les filtres ci-dessus pour affiner.</p></div></div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Unité de travail</th><th>Activité</th><th>Danger</th><th>Risque</th><th style={{ textAlign:"center" }}>F</th><th style={{ textAlign:"center" }}>G</th><th style={{ textAlign:"center" }}>P</th><th>Criticité</th><th>Mesures existantes</th><th>Mesures prévues</th><th>Responsable</th><th>Échéance</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const niv   = getNiveauRisque(r.criticite);
                const color = NIVEAU_COLOR[niv];
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight:600, fontSize:12 }}>{r.unite_travail}</td>
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
