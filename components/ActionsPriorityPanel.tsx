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

type ActionRow = {
  label: string;
  priorite: "Critique" | "Haute" | "Normale" | "Basse";
  statut: "Ouvert" | "En cours" | "Clos" | "En retard";
  site: string;
  echeance: string;
  responsable: string;
};

const ACTIONS: ActionRow[] = [
  { label: "Reviser procedure levage site Bouake", priorite: "Critique", statut: "En retard", site: "Bouake", echeance: "15/05/2026", responsable: "M. Diallo" },
  { label: "Former les chauffeurs engins Abidjan", priorite: "Critique", statut: "En cours", site: "Abidjan", echeance: "20/06/2026", responsable: "A. Kouadio" },
  { label: "Remedier aux ecarts audit produits chimiques", priorite: "Haute", statut: "En retard", site: "San Pedro", echeance: "25/05/2026", responsable: "N. Kone" },
  { label: "Mettre a jour registre EPI Yamoussoukro", priorite: "Haute", statut: "Ouvert", site: "Yamoussoukro", echeance: "30/06/2026", responsable: "S. Traore" },
  { label: "Cloturer permis espace confine n° 44", priorite: "Critique", statut: "En retard", site: "Abidjan", echeance: "01/06/2026", responsable: "A. Kouadio" },
  { label: "Plan cloture incidents gravite elevee", priorite: "Haute", statut: "En cours", site: "Bouake", echeance: "10/06/2026", responsable: "M. Diallo" },
  { label: "Audit interne EPI trimestriel", priorite: "Normale", statut: "Ouvert", site: "Abidjan", echeance: "15/06/2026", responsable: "K. Yao" },
  { label: "Briefing securite nouvelles recrues", priorite: "Normale", statut: "Clos", site: "San Pedro", echeance: "01/05/2026", responsable: "N. Kone" },
  { label: "Inspection mensuelle echafaudages", priorite: "Haute", statut: "Clos", site: "Yamoussoukro", echeance: "31/05/2026", responsable: "S. Traore" },
  { label: "Afficher consignes evacuation zone C", priorite: "Basse", statut: "Clos", site: "Abidjan", echeance: "15/05/2026", responsable: "A. Kouadio" },
];

const PRIORITY_COLOR: Record<string, string> = {
  Critique: "#c2410c",
  Haute: "#b45309",
  Normale: "#2563eb",
  Basse: "#64748b",
};

const STATUS_COLORS = {
  Clos: "#0f766e",
  "En cours": "#2563eb",
  Ouvert: "#b45309",
  "En retard": "#c2410c",
};

export function ActionsPriorityPanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const byPriority = useMemo(() => {
    const map: Record<string, { total: number; clos: number; retard: number }> = {
      Critique: { total: 0, clos: 0, retard: 0 },
      Haute: { total: 0, clos: 0, retard: 0 },
      Normale: { total: 0, clos: 0, retard: 0 },
      Basse: { total: 0, clos: 0, retard: 0 },
    };
    ACTIONS.forEach((a) => {
      map[a.priorite].total++;
      if (a.statut === "Clos") map[a.priorite].clos++;
      if (a.statut === "En retard") map[a.priorite].retard++;
    });
    return Object.entries(map).map(([priorite, v]) => ({
      priorite,
      total: v.total,
      clos: v.clos,
      retard: v.retard,
      txCloture: v.total ? Math.round((v.clos / v.total) * 100) : 0,
    }));
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    ACTIONS.forEach((a) => { map[a.statut] = (map[a.statut] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  const overdueActions = useMemo(
    () => ACTIONS.filter((a) => a.statut === "En retard"),
    [],
  );

  const tauxCloture = Math.round(
    (ACTIONS.filter((a) => a.statut === "Clos").length / ACTIONS.length) * 100,
  );

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Pilotage des actions correctives</h2>
          <p>
            {overdueActions.length} action{overdueActions.length > 1 ? "s" : ""} en retard — taux de cloture global : {tauxCloture}% (objectif 85%).
          </p>
        </div>
      </div>

      <div className="actionsKpis">
        {byPriority.map((row) => (
          <div className="actionsKpiCard" key={row.priorite} style={{ "--priority-color": PRIORITY_COLOR[row.priorite] } as React.CSSProperties}>
            <span className="actionsKpiPriority">{row.priorite}</span>
            <strong>{row.total}</strong>
            <div className="actionsKpiBar">
              <div className="actionsKpiBarFill" style={{ width: `${row.txCloture}%` }} />
            </div>
            <small>{row.txCloture}% clos — {row.retard} en retard</small>
          </div>
        ))}
      </div>

      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Repartition par priorite</h2>
              <p>Volume, taux de cloture et retards par niveau de priorite.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byPriority}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="priorite" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clos" name="Clos" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="retard" name="En retard" fill="#c2410c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Repartition par statut</h2>
              <p>Distribution des actions selon leur avancement.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {byStatus.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] ?? "#94a3b8"} />
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

      <article className="panel" style={{ marginTop: 18 }}>
        <div className="panelHeader">
          <div>
            <h2>Actions en retard — escalade requise</h2>
            <p>{overdueActions.length} action{overdueActions.length > 1 ? "s" : ""} depassant leur echeance.</p>
          </div>
          <a className="secondaryButton" href="/modules/actions" style={{ fontSize: 13 }}>
            Voir toutes les actions →
          </a>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Priorite</th>
                <th>Site</th>
                <th>Responsable</th>
                <th>Echeance</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {overdueActions.map((action, idx) => (
                <tr key={idx}>
                  <td>{action.label}</td>
                  <td>
                    <span className={action.priorite === "Critique" ? "status danger" : "status warn"}>
                      {action.priorite}
                    </span>
                  </td>
                  <td>{action.site}</td>
                  <td>{action.responsable}</td>
                  <td><strong>{action.echeance}</strong></td>
                  <td><span className="status danger">En retard</span></td>
                  <td>
                    <a className="secondaryButton" href="/modules/actions" style={{ padding: "2px 8px", fontSize: 12 }}>
                      Voir →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <a className="primaryButton" href="/modules/actions">
          Ouvrir le module Actions — details et imports →
        </a>
      </div>
    </section>
  );
}
