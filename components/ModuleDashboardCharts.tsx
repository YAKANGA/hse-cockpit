"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
import { getMonthlyEventsTrend } from "@/lib/events-data";

const palette = ["#0f766e", "#2563eb", "#c2410c", "#7c3aed", "#b45309", "#047857"];

type ModuleDashboardChartsProps = {
  data: ModuleDashboardData;
  accent: string;
  records?: ModuleRecord[];
};

export function ModuleDashboardCharts({ data, accent, records }: ModuleDashboardChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [periodRange, setPeriodRange] = useState("6");
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
    () => getActiveSites({ siteIds: [], villes, projets }),
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
    if (!cockpitActive) return data.distribution;
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
    if (!cockpitActive) return data.headline;
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
    if (!cockpitActive) return data.siteComparison;
    // Filtrer aux sites actifs, scaler les alertes par trendRatio
    const base = activeSiteFilter
      ? data.siteComparison.filter((s) => activeSiteFilter.includes(s.site))
      : data.siteComparison;
    return base.map((s) => ({ ...s, alertes: Math.round(s.alertes * trendRatio) }));
  }, [filteredRecords, data.siteComparison, cockpitActive, records, cockpitHasSite, villes, filteredTrend, activeSiteFilter, trendRatio]);

  const filteredSites = computedSiteComparison;

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


      <div className="dashboardGrid">
        <article className="panel wide" style={{ borderTop: `3px solid ${accent}` }}>
          <div style={{ padding: "14px 18px 8px", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Tendance mensuelle</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>
              {data.moduleId === "events" ? "Accidents, incidents et presqu'accidents par mois — 12 mois" : "Évolution du volume et des alertes"}
            </p>
          </div>
          <div className="chart">
            {mounted ? (
              data.moduleId === "events" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getMonthlyEventsTrend()} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="mois" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--line)" }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="linear" dataKey="accidents"       name="Accidents"        stroke="#dc2626" strokeWidth={2} dot={{ r: 3, fill: "#dc2626", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="linear" dataKey="incidents"       name="Incidents"        stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="linear" dataKey="presquAccidents" name="Presqu'accidents" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayTrend} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`trend-${data.moduleId}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor={accent} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={32} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--line)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} cursor={{ stroke: "var(--line)", strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="value" name="Volume" stroke={accent} fill={`url(#trend-${data.moduleId})`} strokeWidth={2.5} dot={{ r: 3, fill: accent, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="secondary" name="Alertes" stroke="#c2410c" fill="#fff2e8" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: "#c2410c", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )
            ) : (
              <div className="chartSkeleton" />
            )}
          </div>
        </article>

        <article className="panel" style={{ borderTop: "3px solid #7c3aed" }}>
          <div style={{ padding: "14px 18px 8px", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Répartition</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>Structure des données du module</p>
          </div>
          <div style={{ padding: "10px 14px 14px" }}>
            {mounted ? (
              filteredDistribution.length === 0 ? (
                <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "20px 0" }}>Aucune donnée</p>
              ) : (() => {
                const total = filteredDistribution.reduce((s, e) => s + e.value, 0);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ position: "relative", flexShrink: 0, width: 148, height: 148 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={filteredDistribution} dataKey="value" nameKey="name"
                            innerRadius={44} outerRadius={68} paddingAngle={2}
                            cx="50%" cy="50%" label={false} labelLine={false}>
                            {filteredDistribution.map((entry, index) => (
                              <Cell key={entry.name} fill={palette[index % palette.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: unknown, name: unknown) => {
                              const count = Number(value ?? 0);
                              return [`${count} enregistrement${count > 1 ? "s" : ""}`, String(name)];
                            }}
                            contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--line)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{total}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>total</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                      {filteredDistribution.map((entry, index) => {
                        const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                        const color = palette[index % palette.length];
                        return (
                          <div key={entry.name}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</span>
                              <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 4 }}>{pct}%</span>
                              <strong style={{ fontSize: 13, fontWeight: 700, color, minWidth: 20, textAlign: "right" }}>{entry.value}</strong>
                            </div>
                            <div style={{ height: 3, background: "var(--line)", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="chartSkeleton" style={{ height: 148 }} />
            )}
          </div>
        </article>
      </div>

      <div className="dashboardGrid">
        <article className="panel" style={{ borderTop: "3px solid #2563eb" }}>
          <div style={{ padding: "14px 18px 8px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Comparatif sites</h2>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>Conformité et alertes par périmètre</p>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "center", padding: "4px 10px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f766e", lineHeight: 1 }}>{averageCompliance}%</div>
                <div style={{ fontSize: 10, color: "#0f766e", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#0f766e", display: "inline-block" }} />
                  Conformité globale
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "4px 10px", background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#c2410c", lineHeight: 1 }}>{totalAlerts}</div>
                <div style={{ fontSize: 10, color: "#c2410c", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#c2410c", display: "inline-block" }} />
                  Alertes globales
                </div>
              </div>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredSites} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="site" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={32} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--line)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="conformite" name="Conformité %" fill="#0f766e" radius={[6, 6, 0, 0]}
                    label={{ position: "top", fontSize: 11, fontWeight: 700, fill: "#0f766e", formatter: (v: unknown) => Number(v ?? 0) > 0 ? `${Number(v)}%` : "" }} />
                  <Bar dataKey="alertes" name="Alertes" fill="#c2410c" radius={[6, 6, 0, 0]}
                    label={{ position: "top", fontSize: 11, fontWeight: 700, fill: "#c2410c", formatter: (v: unknown) => Number(v ?? 0) > 0 ? String(v) : "" }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chartSkeleton" />
            )}
          </div>
        </article>

        <article className="panel" style={{ borderTop: "3px solid #d97706" }}>
          <div style={{ padding: "14px 18px 8px", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Indicateurs de pilotage</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>Points clés à suivre au quotidien</p>
          </div>
          <div style={{ padding: "8px 0 0", overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 320, borderCollapse: "separate", borderSpacing: "0 3px" }}>
              <thead>
                <tr>
                  {["Indicateur", "Valeur", "Tendance", "Statut"].map((h) => (
                    <th key={h} style={{ padding: "4px 14px", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: h === "Statut" ? "center" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTable.map((row) => {
                  const isOk = String(row.statut).includes("OK") || String(row.statut).includes("controle") || String(row.statut).includes("Amelioration");
                  const statusColor = isOk ? "#16a34a" : "#d97706";
                  return (
                    <tr key={String(row.indicateur)}>
                      <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "var(--ink)", background: "var(--hover)", borderRadius: "8px 0 0 8px" }}>{row.indicateur}</td>
                      <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, color: "var(--ink)", background: "var(--hover)" }}>{row.valeur}</td>
                      <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--muted)", background: "var(--hover)" }}>{row.tendance}</td>
                      <td style={{ padding: "8px 14px", background: "var(--hover)", borderRadius: "0 8px 8px 0", textAlign: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}44`, borderRadius: 99, padding: "3px 10px", whiteSpace: "nowrap" }}>
                          {row.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
