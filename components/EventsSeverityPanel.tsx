"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type EventRow = {
  type: "Accident" | "Incident" | "Presqu'accident";
  gravite: "Critique" | "Elevee" | "Moyenne" | "Faible";
  site: string;
  cause: string;
  mois: string;
};

const EVENTS: EventRow[] = [
  { type: "Accident", gravite: "Critique", site: "Bouake", cause: "Levage", mois: "Jan" },
  { type: "Accident", gravite: "Elevee", site: "Abidjan", cause: "Circulation", mois: "Fev" },
  { type: "Accident", gravite: "Elevee", site: "San Pedro", cause: "Chimique", mois: "Mar" },
  { type: "Incident", gravite: "Elevee", site: "Bouake", cause: "Levage", mois: "Jan" },
  { type: "Incident", gravite: "Moyenne", site: "Yamoussoukro", cause: "Manutention", mois: "Fev" },
  { type: "Incident", gravite: "Moyenne", site: "Abidjan", cause: "Circulation", mois: "Avr" },
  { type: "Incident", gravite: "Faible", site: "San Pedro", cause: "Electrique", mois: "Mai" },
  { type: "Incident", gravite: "Faible", site: "Bouake", cause: "Chute", mois: "Juin" },
  { type: "Presqu'accident", gravite: "Elevee", site: "Abidjan", cause: "Levage", mois: "Jan" },
  { type: "Presqu'accident", gravite: "Elevee", site: "Bouake", cause: "Circulation", mois: "Mar" },
  { type: "Presqu'accident", gravite: "Moyenne", site: "San Pedro", cause: "Manutention", mois: "Avr" },
  { type: "Presqu'accident", gravite: "Moyenne", site: "Yamoussoukro", cause: "Electrique", mois: "Mai" },
  { type: "Presqu'accident", gravite: "Faible", site: "Abidjan", cause: "Chute", mois: "Juin" },
  { type: "Presqu'accident", gravite: "Faible", site: "Bouake", cause: "Manutention", mois: "Juin" },
];

const GRAVITY_ORDER = ["Critique", "Elevee", "Moyenne", "Faible"];
const GRAVITY_COLOR: Record<string, string> = {
  Critique: "#9f1239",
  Elevee: "#c2410c",
  Moyenne: "#b45309",
  Faible: "#047857",
};

const TYPE_COLOR: Record<string, string> = {
  "Accident": "#c2410c",
  "Incident": "#b45309",
  "Presqu'accident": "#2563eb",
};

export function EventsSeverityPanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pyramidData = useMemo(
    () =>
      [
        { name: "Accidents", value: EVENTS.filter((e) => e.type === "Accident").length, fill: "#c2410c" },
        { name: "Incidents", value: EVENTS.filter((e) => e.type === "Incident").length, fill: "#b45309" },
        { name: "Presqu'accidents", value: EVENTS.filter((e) => e.type === "Presqu'accident").length, fill: "#2563eb" },
      ],
    [],
  );

  const byGravity = useMemo(
    () =>
      GRAVITY_ORDER.map((gravite) => ({
        gravite,
        count: EVENTS.filter((e) => e.gravite === gravite).length,
      })),
    [],
  );

  const byCause = useMemo(() => {
    const map: Record<string, number> = {};
    EVENTS.forEach((e) => { map[e.cause] = (map[e.cause] ?? 0) + 1; });
    return Object.entries(map)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const bySite = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    EVENTS.forEach((e) => {
      if (!map[e.site]) map[e.site] = { Accident: 0, Incident: 0, "Presqu'accident": 0 };
      map[e.site][e.type]++;
    });
    return Object.entries(map).map(([site, counts]) => ({ site, ...counts }));
  }, []);

  const criticalCount = EVENTS.filter((e) => e.gravite === "Critique" || e.gravite === "Elevee").length;

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Pyramide des evenements HSE</h2>
          <p>
            {EVENTS.length} evenements declares — {criticalCount} de gravite elevee ou critique.
          </p>
        </div>
      </div>

      <div className="severityKpis">
        {pyramidData.map((row) => (
          <div className="severityKpiCard" key={row.name} style={{ "--type-color": row.fill } as React.CSSProperties}>
            <span>{row.name}</span>
            <strong>{row.value}</strong>
            <small>{Math.round((row.value / EVENTS.length) * 100)}% du total</small>
          </div>
        ))}
        {byGravity.map((row) => (
          <div className="severityKpiCard" key={row.gravite} style={{ "--type-color": GRAVITY_COLOR[row.gravite] } as React.CSSProperties}>
            <span>Gravite {row.gravite}</span>
            <strong>{row.count}</strong>
            <small>{Math.round((row.count / EVENTS.length) * 100)}% du total</small>
          </div>
        ))}
      </div>

      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Pyramide Heinrich</h2>
              <p>Accidents &rarr; Incidents &rarr; Presqu&apos;accidents (ratio securite).</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Funnel dataKey="value" data={pyramidData} isAnimationActive>
                    {pyramidData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Top causes d&apos;evenements</h2>
              <p>Classement des causes racines les plus recurrentes.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCause} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="cause" width={100} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Evenements" radius={[0, 4, 4, 0]}>
                    {byCause.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? "#c2410c" : idx === 1 ? "#b45309" : "#2563eb"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>


      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <a className="primaryButton" href="/modules/events">
          Ouvrir le module Evenements — details et imports →
        </a>
      </div>
    </section>
  );
}
