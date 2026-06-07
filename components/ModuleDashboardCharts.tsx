"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModuleDashboardData } from "@/lib/module-dashboard-data";
import { useCockpitFilter } from "@/lib/use-cockpit-filter";

const palette = ["#0f766e", "#2563eb", "#c2410c", "#7c3aed", "#b45309", "#047857"];

type ModuleDashboardChartsProps = {
  data: ModuleDashboardData;
  accent: string;
};

export function ModuleDashboardCharts({ data, accent }: ModuleDashboardChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [periodRange, setPeriodRange] = useState("6");
  const [selectedSite, setSelectedSite] = useState("Tous");
  const [selectedStatus, setSelectedStatus] = useState("Tous");
  const { villes, dateDebut, dateFin } = useCockpitFilter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const siteOptions = useMemo(() => ["Tous", ...data.siteComparison.map((site) => site.site)], [data.siteComparison]);
  const statusOptions = useMemo(
    () => ["Tous", ...Array.from(new Set(data.table.map((row) => String(row.statut))))],
    [data.table],
  );
  const filteredTrend = useMemo(() => {
    let trend = data.trend;
    if (dateDebut || dateFin) {
      const debutMois = dateDebut ? dateDebut.slice(0, 7) : undefined;
      const finMois   = dateFin   ? dateFin.slice(0, 7)   : undefined;
      const PERIOD_ISO: Record<string, string> = {
        "Jan":"2026-01","Fev":"2026-02","Mar":"2026-03",
        "Avr":"2026-04","Mai":"2026-05","Juin":"2026-06",
        "Juil":"2026-07","Aout":"2026-08","Sep":"2026-09",
        "Oct":"2026-10","Nov":"2026-11","Dec":"2026-12",
      };
      trend = trend.filter((t) => {
        const miso = PERIOD_ISO[String(t.period)];
        if (!miso) return true;
        if (debutMois && miso < debutMois) return false;
        if (finMois   && miso > finMois)   return false;
        return true;
      });
    }
    return trend.slice(periodRange === "3" ? -3 : 0);
  }, [data.trend, periodRange, dateDebut, dateFin]);

  const filteredSites = useMemo(
    () => data.siteComparison.filter((site) =>
      (selectedSite === "Tous" || site.site === selectedSite) &&
      (!villes.length || villes.includes(site.site))
    ),
    [data.siteComparison, selectedSite, villes],
  );
  const filteredTable = useMemo(
    () => data.table.filter((row) => selectedStatus === "Tous" || String(row.statut) === selectedStatus),
    [data.table, selectedStatus],
  );
  const totalAlerts = filteredSites.reduce((sum, site) => sum + site.alertes, 0);
  const averageCompliance = filteredSites.length
    ? Math.round(filteredSites.reduce((sum, site) => sum + site.conformite, 0) / filteredSites.length)
    : 0;

  return (
    <section className="moduleChartsBlock">
      <div className="moduleChartKpis">
        {data.headline.map((kpi) => (
          <article className="kpiCard" key={kpi.label}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.detail}</small>
          </article>
        ))}
      </div>

      <article className="panel moduleFilterPanel">
        <div className="panelHeader">
          <div>
            <h2>Filtres de pilotage</h2>
            <p>Analyse par periode, site et statut d'indicateur.</p>
          </div>
        </div>
        <div className="filterBar moduleDashboardFilters">
          <label>
            Periode
            <select value={periodRange} onChange={(event) => setPeriodRange(event.target.value)}>
              <option value="6">6 mois</option>
              <option value="3">3 derniers mois</option>
            </select>
          </label>
          <label>
            Site
            <select value={selectedSite} onChange={(event) => setSelectedSite(event.target.value)}>
              {siteOptions.map((site) => (
                <option key={site}>{site}</option>
              ))}
            </select>
          </label>
          <label>
            Statut
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="moduleFilterKpis">
          <span><strong>{filteredTrend.length}</strong> periode(s)</span>
          <span><strong>{averageCompliance}%</strong> conformite selection</span>
          <span><strong>{totalAlerts}</strong> alerte(s) site</span>
          <span><strong>{filteredTable.length}</strong> indicateur(s)</span>
        </div>
      </article>

      <div className="dashboardGrid">
        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Tendance mensuelle</h2>
              <p>Evolution du volume et de l'indicateur d'alerte.</p>
            </div>
          </div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredTrend}>
                  <defs>
                    <linearGradient id={`trend-${data.moduleId}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor={accent} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" name="Volume" stroke={accent} fill={`url(#trend-${data.moduleId})`} strokeWidth={2} />
                  <Area type="monotone" dataKey="secondary" name="Alertes" stroke="#c2410c" fill="#fff2e8" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartSkeleton" />
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Repartition</h2>
              <p>Structure des donnees du module.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.distribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={2}>
                    {data.distribution.map((entry, index) => (
                      <Cell key={entry.name} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartSkeleton" />
            )}
          </div>
        </article>
      </div>

      <div className="dashboardGrid">
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Comparatif sites</h2>
              <p>Conformite et alertes par perimetre.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredSites}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="site" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="conformite" name="Conformite" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="alertes" name="Alertes" fill="#c2410c" radius={[6, 6, 0, 0]} />
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
              <h2>Indicateurs de pilotage</h2>
              <p>Points concrets a suivre au quotidien.</p>
            </div>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Indicateur</th>
                  <th>Valeur</th>
                  <th>Tendance</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredTable.map((row) => (
                  <tr key={String(row.indicateur)}>
                    <td>{row.indicateur}</td>
                    <td>{row.valeur}</td>
                    <td>{row.tendance}</td>
                    <td>
                      <span className={String(row.statut).includes("OK") || String(row.statut).includes("controle") ? "status ok" : "status warn"}>
                        {row.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
