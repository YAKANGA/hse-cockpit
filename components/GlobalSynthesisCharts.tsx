"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { moduleOperationalKpis, modules } from "@/lib/hse-data";
import { useCockpitFilter } from "@/lib/use-cockpit-filter";
import { getFilteredCockpitStats } from "@/lib/cockpit-stats";

type Period = "3m" | "6m" | "tout";

export function GlobalSynthesisCharts() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<Period>("6m");
  const [showN1, setShowN1] = useState(false);
  const { villes, projets } = useCockpitFilter();
  const cockpitStats = useMemo(() => getFilteredCockpitStats(villes, projets), [villes, projets]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredTrend = useMemo(() => {
    const trend = cockpitStats.filteredTrend;
    if (period === "3m") return trend.slice(-3);
    if (period === "6m") return trend.slice(-6);
    return trend;
  }, [period, cockpitStats.filteredTrend]);

  const filteredSiteBreakdown = cockpitStats.filteredSites;

  const moduleRisk = useMemo(
    () =>
      cockpitStats.moduleStats.map((module) => {
        const operational = moduleOperationalKpis.find((kpi) => kpi.moduleId === module.id);
        return {
          module: module.shortName,
          conformite: module.compliance,
          ouverts: module.pendingItems,
          alertes: operational?.alertValue ?? 0,
        };
      }),
    [cockpitStats.moduleStats],
  );

  const radarData = useMemo(
    () =>
      cockpitStats.moduleStats.map((module) => ({
        subject: module.shortName,
        conformite: module.compliance,
        fullMark: 100,
      })),
    [cockpitStats.moduleStats],
  );

  return (
    <section className="cockpitBlock">
      <div className="sectionTitle">
        <div>
          <h2>Synthese visuelle</h2>
          <p>Courbes consolidees des signaux cles : volume, conformite, ouverts et alertes.</p>
        </div>
        <div className="periodToggle">
          {(["3m", "6m", "tout"] as Period[]).map((p) => (
            <button
              key={p}
              className={p === period ? "periodBtn active" : "periodBtn"}
              onClick={() => setPeriod(p)}
              type="button"
            >
              {p === "3m" ? "3 mois" : p === "6m" ? "6 mois" : "Tout"}
            </button>
          ))}
          <button
            className={showN1 ? "periodBtn active" : "periodBtn"}
            onClick={() => setShowN1((v) => !v)}
            type="button"
            title="Afficher la comparaison N-1"
          >
            N vs N-1
          </button>
        </div>
      </div>

      <div className="dashboardGrid">
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Tendance mensuelle</h2>
              <p>Evolution des evenements, inspections et actions cloturees.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredTrend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid var(--line)" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="accidents" name="Evenements N" stroke="#c2410c" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#c2410c", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="inspections" name="Inspections N" stroke="#047857" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#047857", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="actions" name="Actions N" stroke="#2563eb" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }} />
                  {showN1 && <Line type="monotone" dataKey="accN1" name="Evenements N-1" stroke="#c2410c" strokeWidth={1.5} strokeDasharray="5 3"
                    dot={{ r: 3, fill: "#fff", strokeWidth: 1.5, stroke: "#c2410c" }} />}
                  {showN1 && <Line type="monotone" dataKey="inspN1" name="Inspections N-1" stroke="#047857" strokeWidth={1.5} strokeDasharray="5 3"
                    dot={{ r: 3, fill: "#fff", strokeWidth: 1.5, stroke: "#047857" }} />}
                  {showN1 && <Line type="monotone" dataKey="actN1" name="Actions N-1" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="5 3"
                    dot={{ r: 3, fill: "#fff", strokeWidth: 1.5, stroke: "#2563eb" }} />}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartSkeleton" />
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Conformite modules</h2>
              <p>Vue radar de la maturite HSE par domaine.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <Radar name="Conformite %" dataKey="conformite" stroke="#0f766e" fill="#0f766e" fillOpacity={0.22} strokeWidth={2} />
                  <Tooltip formatter={(v) => [`${v}%`, "Conformite"]} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartSkeleton" />
            )}
          </div>
        </article>
      </div>

      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Exposition modules</h2>
              <p>Elements ouverts et alertes a surveiller par module.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleRisk} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="module" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conformite" name="Conformite %" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ouverts" name="Ouverts" fill="#c2410c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alertes" name="Alertes" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartSkeleton" />
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Performance par site</h2>
              <p>Conformite et volume d&apos;evenements par site.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredSiteBreakdown} layout="vertical" barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} domain={[0, 100]} />
                  <YAxis type="category" dataKey="site" width={110} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conformite" name="Conformite %" fill="#0f766e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="evenements" name="Evenements" fill="#c2410c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartSkeleton" />
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
