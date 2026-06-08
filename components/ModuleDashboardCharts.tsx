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
import type { ModuleRecord } from "@/lib/module-records-data";
import { useCockpitFilter, dateInRange, getActiveSites } from "@/lib/use-cockpit-filter";
import { TFTG_BY_MONTH, MONTH_ISO, MONTHLY_DATA_BY_SITE, calcTF, calcTG } from "@/lib/tftg-data";
import { ppeRecords, getPpeSummary } from "@/lib/ppe-data";
import { isoDateInRange } from "@/lib/date-utils";

const palette = ["#0f766e", "#2563eb", "#c2410c", "#7c3aed", "#b45309", "#047857"];

type ModuleDashboardChartsProps = {
  data: ModuleDashboardData;
  accent: string;
  records?: ModuleRecord[];
};

export function ModuleDashboardCharts({ data, accent, records }: ModuleDashboardChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [periodRange, setPeriodRange] = useState("6");
  const [selectedSite, setSelectedSite] = useState("Tous");
  const [selectedStatus, setSelectedStatus] = useState("Tous");
  const { villes, projets, dateDebut, dateFin } = useCockpitFilter();

  // Cockpit filter flags — these OVERRIDE local dropdowns
  const cockpitHasSite = villes.length > 0;
  const cockpitHasProj = projets.length > 0;
  const cockpitHasDate = !!(dateDebut || dateFin);
  const cockpitActive  = cockpitHasSite || cockpitHasProj || cockpitHasDate;

  useEffect(() => {
    setMounted(true);
  }, []);

  const siteOptions = useMemo(() => ["Tous", ...data.siteComparison.map((site) => site.site)], [data.siteComparison]);
  const statusOptions = useMemo(
    () => ["Tous", ...Array.from(new Set(data.table.map((row) => String(row.statut))))],
    [data.table],
  );

  const PERIOD_ISO: Record<string, string> = {
    "Jan":"2026-01","Fev":"2026-02","Mar":"2026-03",
    "Avr":"2026-04","Mai":"2026-05","Juin":"2026-06",
    "Juil":"2026-07","Aout":"2026-08","Sep":"2026-09",
    "Oct":"2026-10","Nov":"2026-11","Dec":"2026-12",
  };

  // Cockpit date → ignore local periodRange; no cockpit date → use local periodRange
  const filteredTrend = useMemo(() => {
    if (cockpitHasDate) {
      const debutMois = dateDebut ? dateDebut.slice(0, 7) : undefined;
      const finMois   = dateFin   ? dateFin.slice(0, 7)   : undefined;
      return data.trend.filter((t) => {
        const miso = PERIOD_ISO[String(t.period)];
        if (!miso) return true;
        if (debutMois && miso < debutMois) return false;
        if (finMois   && miso > finMois)   return false;
        return true;
      });
    }
    return data.trend.slice(periodRange === "3" ? -3 : 0);
  }, [data.trend, periodRange, dateDebut, dateFin, cockpitHasDate]);

  const filteredRecords = useMemo(() => {
    if (!records?.length) return [];
    if (!cockpitActive) return records;
    return records.filter((r) => {
      if (cockpitHasSite && !villes.includes(r.site)) return false;
      if (cockpitHasProj && !projets.includes(r.projectId)) return false;
      if (cockpitHasDate && !dateInRange(r.date, dateDebut, dateFin)) return false;
      return true;
    });
  }, [records, villes, projets, dateDebut, dateFin, cockpitActive, cockpitHasSite, cockpitHasProj, cockpitHasDate]);

  // Sites actifs résolus (villes directes + projets → villes)
  const activeSiteFilter = useMemo(
    () => getActiveSites({ villes, projets }),
    [villes, projets],
  );

  // MONTHLY_DATA_BY_SITE filtré par site actif + période active → base pour TF/TG
  const filteredMonthlyRows = useMemo(() => {
    const debutMois = cockpitHasDate && dateDebut ? dateDebut.slice(0, 7) : undefined;
    const finMois   = cockpitHasDate && dateFin   ? dateFin.slice(0, 7)   : undefined;
    const keepMonths = !debutMois && !finMois
      ? (periodRange === "3"
          ? TFTG_BY_MONTH.slice(-3).map((m) => m.mois)
          : TFTG_BY_MONTH.map((m) => m.mois))
      : null;
    return MONTHLY_DATA_BY_SITE.filter((r) => {
      if (activeSiteFilter && !activeSiteFilter.includes(r.site)) return false;
      if (keepMonths) return keepMonths.includes(r.mois);
      const miso = MONTH_ISO[r.mois];
      if (!miso) return true;
      if (debutMois && miso < debutMois) return false;
      if (finMois   && miso > finMois)   return false;
      return true;
    });
  }, [activeSiteFilter, periodRange, cockpitHasDate, dateDebut, dateFin]);

  // Ratio période : volume filteredTrend / volume total trend
  const trendRatio = useMemo(() => {
    const base   = data.trend.reduce((s, t) => s + t.value, 0);
    const period = filteredTrend.reduce((s, t) => s + t.value, 0);
    return base > 0 ? period / base : 1;
  }, [data.trend, filteredTrend]);

  // Ratio site : proportion des alertes des sites actifs sur le total
  const siteRatio = useMemo(() => {
    if (!activeSiteFilter) return 1;
    const total  = data.siteComparison.reduce((s, x) => s + x.alertes, 0);
    if (total === 0) return 1;
    const active = data.siteComparison
      .filter((s) => activeSiteFilter.includes(s.site))
      .reduce((s, x) => s + x.alertes, 0);
    return active / total;
  }, [data.siteComparison, activeSiteFilter]);

  // Trend affiché : period-filtered + site-scalé (ou TF/TG recalculés pour indicators)
  const displayTrend = useMemo(() => {
    if (!filteredTrend.length) return [];
    if (data.moduleId === "indicators") {
      return filteredTrend.map((t) => {
        const rows = filteredMonthlyRows.filter((r) => r.mois === String(t.period));
        if (!rows.length) return { ...t, value: 0, secondary: 0 };
        const heures    = rows.reduce((s, r) => s + r.heures, 0);
        const accidents = rows.reduce((s, r) => s + r.accidents, 0);
        const jours     = rows.reduce((s, r) => s + r.jours, 0);
        return { ...t, value: calcTF(accidents, heures), secondary: calcTG(jours, heures) };
      });
    }
    if (siteRatio === 1) return filteredTrend;
    return filteredTrend.map((t) => ({
      ...t,
      value:     Math.round(t.value     * siteRatio),
      secondary: Math.round(t.secondary * siteRatio),
    }));
  }, [filteredTrend, siteRatio, data.moduleId, filteredMonthlyRows]);

  const filteredDistribution = useMemo(() => {
    if (!filteredTrend.length) return [];
    if (cockpitActive && records?.length) {
      const map: Record<string, number> = {};
      filteredRecords.forEach((r) => {
        if (r.category) map[r.category] = (map[r.category] ?? 0) + 1;
      });
      return Object.entries(map).map(([name, value]) => ({ name, value }));
    }
    const ratio = siteRatio * trendRatio;
    return data.distribution.map((d) => ({ ...d, value: Math.round(d.value * ratio) }));
  }, [filteredRecords, data.distribution, records, cockpitActive, filteredTrend, siteRatio, trendRatio]);

  const computedHeadline = useMemo(() => {
    if (!filteredTrend.length) return data.headline.map((kpi) => ({ ...kpi, value: "—" }));
    if (cockpitActive && records?.length) {
      const total   = filteredRecords.length;
      const open    = filteredRecords.filter((r) => !["Clos","Valide","Approuve"].includes(r.status)).length;
      const crit    = filteredRecords.filter((r) => r.priority === "Critique").length;
      const closed  = filteredRecords.filter((r) => r.status === "Clos" || r.status === "Valide").length;
      const rate    = total === 0 ? 0 : Math.round((closed / total) * 100);
      const vals    = [String(total), String(open), String(crit), `${rate}%`];
      const details = ["enregistrements filtres", "elements non clos", "elements critiques", "elements clos/valides"];
      return data.headline.map((kpi, i) => ({ ...kpi, value: vals[i] ?? kpi.value, detail: details[i] ?? kpi.detail }));
    }
    const ratio = siteRatio * trendRatio;
    return data.headline.map((kpi) => {
      if (/^\d+$/.test(kpi.value)) return { ...kpi, value: String(Math.round(parseInt(kpi.value) * ratio)) };
      return kpi;
    });
  }, [filteredRecords, data.headline, cockpitActive, records, filteredTrend, siteRatio, trendRatio]);

  const computedSiteComparison = useMemo(() => {
    if (!filteredTrend.length) return data.siteComparison.map((s) => ({ ...s, conformite: 0, alertes: 0 }));
    if (cockpitActive && records?.length) {
      const sites = cockpitHasSite ? villes : [...new Set(filteredRecords.map((r) => r.site))];
      return sites.map((site) => {
        const siteRecs   = filteredRecords.filter((r) => r.site === site);
        const total      = siteRecs.length;
        const closed     = siteRecs.filter((r) => r.status === "Clos" || r.status === "Valide").length;
        const alertes    = siteRecs.filter((r) => r.priority === "Critique" || r.priority === "Haute").length;
        const conformite = total === 0 ? 0 : Math.round((closed / total) * 100);
        return { site, conformite, alertes };
      });
    }
    // Filtrer aux sites actifs, scaler les alertes par trendRatio
    const base = activeSiteFilter
      ? data.siteComparison.filter((s) => activeSiteFilter.includes(s.site))
      : data.siteComparison;
    return base.map((s) => ({ ...s, alertes: Math.round(s.alertes * trendRatio) }));
  }, [filteredRecords, data.siteComparison, cockpitActive, records, cockpitHasSite, villes, filteredTrend, activeSiteFilter, trendRatio]);

  const filteredSites = useMemo(() => {
    // Filtre site cockpit actif → sites déjà restreints dans computedSiteComparison
    if (cockpitHasSite || cockpitHasProj) return computedSiteComparison;
    return computedSiteComparison.filter((site) =>
      selectedSite === "Tous" || site.site === selectedSite
    );
  }, [computedSiteComparison, selectedSite, cockpitHasSite, cockpitHasProj]);

  const computedTable = useMemo(() => {
    const EMPTY = data.table.map((row) => ({ ...row, valeur: "—", tendance: "—", statut: "—" }));

    const dynamicStatut = (scaled: number, original: string): string => {
      if (String(original) === "OK") return "OK";
      return scaled === 0 ? "OK" : original;
    };

    const hasTFTG = data.table.some((r) => r.indicateur === "TF" || r.indicateur === "TG");

    if (hasTFTG) {
      if (!filteredMonthlyRows.length) return EMPTY;
      const heures    = filteredMonthlyRows.reduce((s, r) => s + r.heures, 0);
      const accidents = filteredMonthlyRows.reduce((s, r) => s + r.accidents, 0);
      const jours     = filteredMonthlyRows.reduce((s, r) => s + r.jours, 0);
      const tf = calcTF(accidents, heures);
      const tg = calcTG(jours, heures);
      const totalAcc = MONTHLY_DATA_BY_SITE.reduce((s, r) => s + r.accidents, 0);
      const accRatio = totalAcc > 0 ? accidents / totalAcc : 1;
      const tfStatut = (v: number) => v <= 2.5 ? "Amelioration" : v <= 3.5 ? "Sous controle" : v <= 5 ? "Surveillance" : "Critique";
      const tgStatut = (v: number) => v <= 0.2 ? "OK" : v <= 0.3 ? "Surveillance" : "Critique";
      return data.table.map((row) => {
        const ind = String(row.indicateur);
        if (ind === "TF") return { ...row, valeur: tf, statut: tfStatut(tf) };
        if (ind === "TG") return { ...row, valeur: tg, statut: tgStatut(tg) };
        const rawVal = Number(row.valeur);
        if (!isNaN(rawVal) && rawVal > 0) {
          const scaled = Math.round(rawVal * accRatio);
          return { ...row, valeur: scaled, statut: dynamicStatut(scaled, String(row.statut)) };
        }
        return row;
      });
    }

    // PPE-specific: derive real values from filtered ppeRecords
    if (data.moduleId === "ppe") {
      const filtered = ppeRecords.filter((r) => {
        if (activeSiteFilter && !activeSiteFilter.includes(r.site)) return false;
        if (!isoDateInRange(r.dateAchat, dateDebut, dateFin)) return false;
        return true;
      });
      if (!filtered.length) return EMPTY;
      const summary = getPpeSummary(filtered);
      return data.table.map((row) => {
        const ind = String(row.indicateur);
        if (ind === "Valeur stock") return { ...row, valeur: summary.inventoryValue.toLocaleString("fr-FR") + " FCFA", statut: "Suivi cout" };
        if (ind === "Stock critique") return { ...row, valeur: summary.lowStock, statut: summary.lowStock === 0 ? "OK" : "A commander" };
        if (ind === "EPI expires") return { ...row, valeur: summary.expired, statut: summary.expired === 0 ? "OK" : "A remplacer" };
        return row;
      });
    }

    if (!filteredTrend.length) return EMPTY;
    const ratio = siteRatio * trendRatio;
    return data.table.map((row) => {
      const rawVal = Number(row.valeur);
      if (!isNaN(rawVal) && rawVal > 0) {
        const scaled = Math.round(rawVal * ratio);
        return { ...row, valeur: scaled, statut: dynamicStatut(scaled, String(row.statut)) };
      }
      return row;
    });
  }, [data.table, filteredMonthlyRows, filteredTrend, siteRatio, trendRatio, data.moduleId, activeSiteFilter, dateDebut, dateFin]);

  const filteredTable = useMemo(
    () => computedTable.filter((row) => selectedStatus === "Tous" || String(row.statut) === selectedStatus),
    [computedTable, selectedStatus],
  );
  const totalAlerts = filteredSites.reduce((sum, site) => sum + site.alertes, 0);
  const averageCompliance = filteredSites.length
    ? Math.round(filteredSites.reduce((sum, site) => sum + site.conformite, 0) / filteredSites.length)
    : 0;

  return (
    <section className="moduleChartsBlock">
      <div className="moduleChartKpis">
        {computedHeadline.map((kpi) => (
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
        {cockpitActive && (
          <div style={{ fontSize:12, color:"#0f766e", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:6, padding:"6px 12px", marginBottom:8 }}>
            Filtres cockpit actifs —{cockpitHasSite ? ` Sites : ${villes.join(", ")}` : ""}{cockpitHasProj ? `${cockpitHasSite ? " · " : " "}Projets : ${projets.join(", ")}` : ""}{cockpitHasDate ? `${(cockpitHasSite || cockpitHasProj) ? " · " : " "}Période : ${dateDebut ? dateDebut.split("-").reverse().join("/") : "…"} – ${dateFin ? dateFin.split("-").reverse().join("/") : "…"}` : ""}. Tous les graphiques sont recalcules.
          </div>
        )}
        <div className="filterBar moduleDashboardFilters">
          <label style={{ opacity: cockpitHasDate ? 0.4 : 1 }}>
            Periode{cockpitHasDate ? " (cockpit actif)" : ""}
            <select value={periodRange} onChange={(event) => setPeriodRange(event.target.value)} disabled={cockpitHasDate}>
              <option value="6">6 mois</option>
              <option value="3">3 derniers mois</option>
            </select>
          </label>
          <label style={{ opacity: cockpitHasSite ? 0.4 : 1 }}>
            Site{cockpitHasSite ? " (cockpit actif)" : ""}
            <select value={selectedSite} onChange={(event) => setSelectedSite(event.target.value)} disabled={cockpitHasSite}>
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
          <span><strong>{filteredTrend.length > 0 ? filteredTable.length : 0}</strong> indicateur(s)</span>
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
                <AreaChart data={displayTrend}>
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
                  <Pie data={filteredDistribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={2}>
                    {filteredDistribution.map((entry, index) => (
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
