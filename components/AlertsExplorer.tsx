"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, FileText, Play, Search, Zap } from "lucide-react";

const PAGE_SIZES = [10, 25, 50, 100];
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
import type { HseAlert } from "@/lib/alerts-data";

type AlertsExplorerProps = {
  alerts: HseAlert[];
  exportHref: string;
  docxHref: string;
  pdfHref: string;
};

const severityColors: Record<HseAlert["severity"], string> = {
  Critique: "#b42318",
  Haute: "#c2410c",
  Moyenne: "#2563eb",
};

const chartPalette = ["#0f766e", "#2563eb", "#c2410c", "#7c3aed", "#b45309", "#047857"];

type AlertStatus = HseAlert["status"];

export function AlertsExplorer({ alerts, exportHref, docxHref, pdfHref }: AlertsExplorerProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [moduleId, setModuleId] = useState("Tous");
  const [severity, setSeverity] = useState("Tous");
  const [status, setStatus] = useState("Tous");
  const [localStatuses, setLocalStatuses] = useState<Record<string, AlertStatus>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  function getStatus(alert: HseAlert): AlertStatus {
    return localStatuses[alert.id] ?? alert.status;
  }

  function nextStatus(current: AlertStatus): AlertStatus {
    if (current === "Ouvert") return "En cours";
    if (current === "En cours") return "A verifier";
    return "En cours";
  }

  function handleAction(alertId: string, current: AlertStatus) {
    setLocalStatuses((prev) => ({ ...prev, [alertId]: nextStatus(current) }));
  }

  function handleClose(alertId: string) {
    setLocalStatuses((prev) => ({ ...prev, [alertId]: "A verifier" }));
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const modules = ["Tous", ...Array.from(new Set(alerts.map((alert) => alert.moduleName)))];
  const severities = ["Tous", ...Array.from(new Set(alerts.map((alert) => alert.severity)))];
  const statuses = ["Tous", ...Array.from(new Set(alerts.map((alert) => alert.status)))];

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesQuery = normalizedQuery
        ? [
            alert.tenantName,
            alert.site,
            alert.title,
            alert.source,
            alert.owner,
            alert.recommendation,
          ].join(" ").toLowerCase().includes(normalizedQuery)
        : true;
      const matchesModule = moduleId === "Tous" || alert.moduleName === moduleId;
      const matchesSeverity = severity === "Tous" || alert.severity === severity;
      const matchesStatus = status === "Tous" || alert.status === status;

      return matchesQuery && matchesModule && matchesSeverity && matchesStatus;
    });
  }, [alerts, moduleId, query, severity, status]);

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedAlerts = filteredAlerts.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [query, moduleId, severity, status, pageSize]);

  const criticalCount = filteredAlerts.filter((alert) => alert.severity === "Critique").length;
  const openCount = filteredAlerts.filter((alert) => alert.status === "Ouvert").length;
  const severityChart = useMemo(
    () =>
      (["Critique", "Haute", "Moyenne"] as HseAlert["severity"][])
        .map((name) => ({
          name,
          value: filteredAlerts.filter((alert) => alert.severity === name).length,
        }))
        .filter((item) => item.value > 0),
    [filteredAlerts],
  );
  const moduleChart = useMemo(
    () =>
      Array.from(
        filteredAlerts.reduce((acc, alert) => {
          const current = acc.get(alert.moduleName) ?? { module: alert.moduleName, critiques: 0, hautes: 0, total: 0 };
          current.total += 1;
          if (alert.severity === "Critique") current.critiques += 1;
          if (alert.severity === "Haute") current.hautes += 1;
          acc.set(alert.moduleName, current);
          return acc;
        }, new Map<string, { module: string; critiques: number; hautes: number; total: number }>()),
      )
        .map(([, value]) => value)
        .sort((left, right) => right.total - left.total),
    [filteredAlerts],
  );
  const siteChart = useMemo(
    () =>
      Array.from(
        filteredAlerts.reduce((acc, alert) => {
          const current = acc.get(alert.site) ?? { site: alert.site, ouvertes: 0, enCours: 0, verification: 0, total: 0 };
          current.total += 1;
          if (alert.status === "Ouvert") current.ouvertes += 1;
          if (alert.status === "En cours") current.enCours += 1;
          if (alert.status === "A verifier") current.verification += 1;
          acc.set(alert.site, current);
          return acc;
        }, new Map<string, { site: string; ouvertes: number; enCours: number; verification: number; total: number }>()),
      )
        .map(([, value]) => value)
        .sort((left, right) => right.total - left.total),
    [filteredAlerts],
  );

  const criticalAlerts = alerts.filter((a) => a.severity === "Critique");

  return (
    <>
      {criticalAlerts.length > 0 && (
        <section className="alertsCriticalBand">
          <div className="alertsCriticalHeader">
            <Zap size={16} />
            <strong>{criticalAlerts.length} alerte{criticalAlerts.length > 1 ? "s" : ""} critique{criticalAlerts.length > 1 ? "s" : ""} — action immediate requise</strong>
          </div>
          <div className="alertsCriticalCards">
            {criticalAlerts.map((alert) => {
              const cur = getStatus(alert);
              return (
                <div className="alertCriticalCard" key={alert.id}>
                  <div className="alertCriticalTop">
                    <span className="alertCriticalModule">{alert.moduleName}</span>
                    <span className="alertCriticalSite">{alert.site}</span>
                  </div>
                  <strong>{alert.title}</strong>
                  <p>{alert.recommendation}</p>
                  <div className="alertCriticalFooter">
                    <span className={cur === "En cours" ? "status warn" : cur === "A verifier" ? "status ok" : "status danger"}>
                      {cur}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {cur === "Ouvert" && (
                        <button className="alertActionBtn primary" onClick={() => handleAction(alert.id, cur)} type="button">
                          <Play size={12} /> Prendre en charge
                        </button>
                      )}
                      {cur === "En cours" && (
                        <button className="alertActionBtn warn" onClick={() => handleClose(alert.id)} type="button">
                          <CheckCircle2 size={12} /> Marquer a verifier
                        </button>
                      )}
                      <span className="alertDueDate"><Clock size={12} /> {alert.dueDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="adminStats">
        <article>
          <span>Alertes affichees</span>
          <strong>{filteredAlerts.length}</strong>
        </article>
        <article>
          <span>Critiques</span>
          <strong>{criticalCount}</strong>
        </article>
        <article>
          <span>Ouvertes</span>
          <strong>{openCount}</strong>
        </article>
        <article>
          <span>Modules touches</span>
          <strong>{new Set(filteredAlerts.map((alert) => alert.moduleId)).size}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Registre des alertes HSE</h2>
            <p>Priorites operationnelles consolidees par module, site et entreprise.</p>
          </div>
          <div className="buttonGroup">
            <a className="secondaryButton" href={exportHref}>
              <Download size={16} />
              Excel
            </a>
            <a className="secondaryButton" href={docxHref}>
              <FileText size={16} />
              Word
            </a>
            <a className="secondaryButton" href={pdfHref}>
              <FileText size={16} />
              PDF
            </a>
          </div>
        </div>

        <div className="filterBar alertsFilterBar">
          <label className="filterSearch">
            <Search size={17} />
            <input
              placeholder="Rechercher site, responsable, source, recommandation..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            Module
            <select value={moduleId} onChange={(event) => setModuleId(event.target.value)}>
              {modules.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Severite
            <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
              {severities.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Statut
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {statuses.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="alertsChartsBlock">
          <div className="dashboardGrid">
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <h2>Repartition par severite</h2>
                  <p>Lecture immediate du niveau de risque de la selection.</p>
                </div>
              </div>
              <div className="chart compact">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={severityChart} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={2}>
                        {severityChart.map((entry) => (
                          <Cell key={entry.name} fill={severityColors[entry.name]} />
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

            <article className="panel">
              <div className="panelHeader">
                <div>
                  <h2>Alertes par module</h2>
                  <p>Modules les plus exposes avec priorite critique et haute.</p>
                </div>
              </div>
              <div className="chart compact">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="module" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="critiques" name="Critiques" fill="#b42318" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="hautes" name="Hautes" fill="#c2410c" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="total" name="Total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chartSkeleton" />
                )}
              </div>
            </article>
          </div>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <h2>Statut par site</h2>
                <p>Charge d'alertes ouvertes, en cours et a verifier par perimetre.</p>
              </div>
            </div>
            <div className="chart compact">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={siteChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="site" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="ouvertes" name="Ouvertes" fill="#b42318" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="enCours" name="En cours" fill={chartPalette[1]} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="verification" name="A verifier" fill={chartPalette[3]} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chartSkeleton" />
              )}
            </div>
          </article>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Site</th>
                <th>Alerte</th>
                <th>Severite</th>
                <th>Statut</th>
                <th>Echeance</th>
                <th>Responsable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedAlerts.map((alert) => {
                const cur = getStatus(alert);
                return (
                  <tr key={alert.id}>
                    <td><strong>{alert.moduleName}</strong></td>
                    <td>{alert.site}</td>
                    <td>
                      {alert.title}
                      <span>{alert.source}</span>
                    </td>
                    <td>
                      <span className={alert.severity === "Critique" ? "status danger" : alert.severity === "Haute" ? "status warn" : "status ok"}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <span className={cur === "En cours" ? "status warn" : cur === "A verifier" ? "status ok" : "status danger"}>
                        {cur}
                      </span>
                    </td>
                    <td>{alert.dueDate}</td>
                    <td>{alert.owner}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {cur === "Ouvert" && (
                          <button className="alertActionBtn primary" onClick={() => handleAction(alert.id, cur)} type="button">
                            <Play size={11} /> Prendre en charge
                          </button>
                        )}
                        {cur === "En cours" && (
                          <button className="alertActionBtn warn" onClick={() => handleClose(alert.id)} type="button">
                            <CheckCircle2 size={11} /> A verifier
                          </button>
                        )}
                        {cur === "A verifier" && (
                          <span className="status ok">Traite</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div className="paginationInfo">
            {filteredAlerts.length === 0 ? "Aucune alerte" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredAlerts.length)} sur ${filteredAlerts.length}`}
          </div>
          <div className="paginationControls">
            <label className="paginationSize">
              Lignes :
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <button className="paginationBtn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} type="button">
              <ChevronLeft size={15} />
            </button>
            <span className="paginationPages">{safePage} / {totalPages}</span>
            <button className="paginationBtn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} type="button">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
