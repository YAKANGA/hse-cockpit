"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IMPACTS_ENV,
  IMPORTANCE_COLOR,
  STATUT_COLOR,
  getNiveauImportance,
  getEnvSummary,
  type NiveauImportance,
} from "@/lib/environment-data";

const CHANTIERS = ["Tous", ...Array.from(new Set(IMPACTS_ENV.map((i) => i.codeChantier)))];
const PHASES = ["Tous", "Preparation", "Construction", "Exploitation"];
const NIVEAUX: (NiveauImportance | "Tous")[] = ["Tous", "Critique", "Eleve", "Modere", "Faible"];

function ImportanceBadge({ score }: { score: number }) {
  const niveau = getNiveauImportance(score);
  const color = IMPORTANCE_COLOR[niveau];
  return (
    <span
      className="envImportanceBadge"
      style={{ background: `${color}22`, color, borderColor: `${color}44` }}
    >
      {score} — {niveau}
    </span>
  );
}

export function EnvironmentImpactsPanel() {
  const [mounted, setMounted] = useState(false);
  const [chantier, setChantier] = useState("Tous");
  const [phase, setPhase] = useState("Tous");
  const [niveau, setNiveau] = useState<NiveauImportance | "Tous">("Tous");

  useEffect(() => { setMounted(true); }, []);

  const summary = useMemo(() => getEnvSummary(), []);

  const filtered = useMemo(() => {
    return IMPACTS_ENV.filter((i) => {
      if (chantier !== "Tous" && i.codeChantier !== chantier) return false;
      if (phase !== "Tous" && i.phase !== phase) return false;
      if (niveau !== "Tous" && getNiveauImportance(i.importance) !== niveau) return false;
      return true;
    });
  }, [chantier, phase, niveau]);

  const byMilieu = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((i) => { map[i.milieuAffecte] = (map[i.milieuAffecte] ?? 0) + 1; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [filtered]);

  const byNiveau = useMemo(() => {
    const map: Record<string, number> = { Critique: 0, Eleve: 0, Modere: 0, Faible: 0 };
    filtered.forEach((i) => { map[getNiveauImportance(i.importance)]++; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byStatut = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((i) => { map[i.statut] = (map[i.statut] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const MILIEU_COLORS = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#dc2626", "#16a34a", "#c2410c"];

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Gestion Environnementale — Impacts par Chantier</h2>
          <p>
            Ref : ISO 14001:2015 | IFC Standards | Decret CI n°2017-665 — {summary.chantiers} chantiers, {summary.total} impacts identifies.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>Chantier :</label>
          <select
            value={chantier}
            onChange={(e) => setChantier(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }}
          >
            {CHANTIERS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>Phase :</label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }}
          >
            {PHASES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="envKpis">
        {(["Critique", "Eleve", "Modere", "Faible"] as NiveauImportance[]).map((n) => {
          const count = IMPACTS_ENV.filter((i) => getNiveauImportance(i.importance) === n).length;
          const color = IMPORTANCE_COLOR[n];
          const isActive = niveau === n;
          return (
            <div
              key={n}
              className="envKpiCard"
              style={{ "--env-color": color, outline: isActive ? `2px solid ${color}` : "none" } as React.CSSProperties}
              onClick={() => setNiveau(isActive ? "Tous" : n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setNiveau(isActive ? "Tous" : n); }}
            >
              <span>{n}</span>
              <strong>{count}</strong>
              <small>impact{count > 1 ? "s" : ""} {n === "Critique" ? "≥18" : n === "Eleve" ? "12–17" : n === "Modere" ? "9–11" : "≤8"}</small>
            </div>
          );
        })}
        <div className="envKpiCard" style={{ "--env-color": "#16a34a" } as React.CSSProperties}>
          <span>Mesures validees</span>
          <strong style={{ color: "#16a34a" }}>{summary.valide}</strong>
          <small>sur {summary.total} impacts</small>
        </div>
        <div className="envKpiCard" style={{ "--env-color": "#d97706" } as React.CSSProperties}>
          <span>En cours de mise en œuvre</span>
          <strong style={{ color: "#d97706" }}>{summary.enCours}</strong>
          <small>mesures actives</small>
        </div>
      </div>

      {/* Filtres niveau */}
      <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
        {NIVEAUX.map((n) => (
          <button
            key={n}
            type="button"
            className={niveau === n ? "periodBtn active" : "periodBtn"}
            onClick={() => setNiveau(n)}
          >
            {n}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center", marginLeft: 6 }}>
          {filtered.length} impact{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Charts */}
      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Impacts par milieu affecte</h2>
              <p>Nombre d'impacts identifies par categorie de milieu.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMilieu} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Impacts" radius={[0, 4, 4, 0]}>
                    {byMilieu.map((_, i) => <Cell key={i} fill={MILIEU_COLORS[i % MILIEU_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Repartition par niveau d'importance</h2>
              <p>Critique (≥18) · Eleve (12–17) · Modere (9–11) · Faible (≤8)</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byNiveau}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={40}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                  >
                    {byNiveau.map((entry) => (
                      <Cell key={entry.name} fill={IMPORTANCE_COLOR[entry.name as NiveauImportance] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Statut des mesures d'attenuation</h2>
              <p>Suivi de la mise en oeuvre des mesures compensatoires.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatut}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={40}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {byStatut.map((entry) => (
                      <Cell key={entry.name} fill={STATUT_COLOR[entry.name] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>

      {/* Registre des impacts */}
      <article className="panel" style={{ marginTop: 18 }}>
        <div className="panelHeader">
          <div>
            <h2>Registre des impacts environnementaux</h2>
            <p>Score importance = Intensite × Portee × Duree (IxPxD) — {filtered.length} ligne{filtered.length > 1 ? "s" : ""} affichee{filtered.length > 1 ? "s" : ""}.</p>
          </div>
        </div>
        <div className="tableWrap">
          <table className="envTable">
            <thead>
              <tr>
                <th>N°</th>
                <th>Code</th>
                <th>Chantier</th>
                <th>Type travaux</th>
                <th>Phase</th>
                <th>Impact environnemental</th>
                <th>Milieu affecte</th>
                <th style={{ textAlign: "center" }}>I</th>
                <th style={{ textAlign: "center" }}>P</th>
                <th style={{ textAlign: "center" }}>D</th>
                <th>Importance (IxPxD)</th>
                <th>Mesures d'attenuation</th>
                <th>Responsable</th>
                <th>Indicateur suivi</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--muted)", fontSize: 12 }}>{item.id}</td>
                  <td><code style={{ fontSize: 11 }}>{item.codeChantier}</code></td>
                  <td style={{ maxWidth: 160, fontSize: 12 }}>{item.chantier}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{item.typeTravraux}</td>
                  <td>
                    <span className={`envPhaseBadge envPhase${item.phase}`}>{item.phase}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>{item.impact}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{item.milieuAffecte}</td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{item.intensite}</td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{item.portee}</td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{item.duree}</td>
                  <td><ImportanceBadge score={item.importance} /></td>
                  <td style={{ fontSize: 11, maxWidth: 180 }}>{item.mesuresAttenuation}</td>
                  <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{item.responsable}</td>
                  <td style={{ fontSize: 11, color: "var(--muted)" }}>{item.indicateurSuivi}</td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background: `${STATUT_COLOR[item.statut]}22`,
                        color: STATUT_COLOR[item.statut],
                      }}
                    >
                      {item.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
