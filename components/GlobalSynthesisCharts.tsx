"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
import { hseAlerts } from "@/lib/alerts-data";
import { useCockpitFilter, dateInRange } from "@/lib/use-cockpit-filter";
import { getFilteredCockpitStats } from "@/lib/cockpit-stats";

const EPI_TREND = [
  { month: "Jan", initial: 480, distribues: 340, reste: 140 },
  { month: "Fev", initial: 475, distribues: 350, reste: 125 },
  { month: "Mar", initial: 465, distribues: 358, reste: 107 },
  { month: "Avr", initial: 462, distribues: 360, reste: 102 },
  { month: "Mai", initial: 460, distribues: 363, reste:  97 },
  { month: "Juin",initial: 460, distribues: 364, reste:  96 },
];

type Period = "3m" | "6m" | "tout";

export function GlobalSynthesisCharts() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<Period>("6m");
  const [showN1, setShowN1] = useState(false);
  const { villes, projets, dateDebut, dateFin } = useCockpitFilter();
  const cockpitStats = useMemo(
    () => getFilteredCockpitStats(villes, projets, dateDebut, dateFin),
    [villes, projets, dateDebut, dateFin],
  );

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
      cockpitStats.moduleStats.map((module) => ({
        module: module.shortName,
        conformite: module.compliance,
        ouverts: module.pendingItems,
        alertes: hseAlerts.filter(a =>
          a.moduleId === module.id &&
          (!villes.length || villes.includes(a.site)) &&
          dateInRange(a.dueDate, dateDebut, dateFin)
        ).length,
      })),
    [cockpitStats.moduleStats, villes, dateDebut, dateFin],
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
              <h2>Tendance mensuelle — Gestion EPI</h2>
              <p>Evolution du stock disponible, dotations distribuees et alertes EPI par mois.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={period === "3m" ? EPI_TREND.slice(-3) : EPI_TREND}
                  margin={{ top: 4, right: 16, left: -10, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid var(--line)" }}
                    formatter={(value, name) => [`${value} EPI`, String(name)]}
                    itemSorter={(item) => -(item.value ?? 0)}
                  />
                  <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="initial"    name="Stock initial" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="initial"    position="top" style={{ fontSize: 10, fill: "#3b82f6", fontWeight: 600 }} />
                  </Bar>
                  <Bar dataKey="distribues" name="Distribues"    fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="distribues" position="top" style={{ fontSize: 10, fill: "#f59e0b", fontWeight: 600 }} />
                  </Bar>
                  <Bar dataKey="reste"      name="Reste dispo"   fill="#22c55e" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="reste"      position="top" style={{ fontSize: 10, fill: "#22c55e", fontWeight: 600 }} />
                  </Bar>
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

      </div>
    </section>
  );
}
