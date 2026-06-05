"use client";

import { useEffect, useState } from "react";
import { useCockpitFilter } from "@/lib/use-cockpit-filter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSiteKpis, getProjectKpisForCity, type SiteKpi, type ProjectKpi } from "@/lib/sites-data";
import { ChevronDown, ChevronRight, MapPin, Users } from "lucide-react";

type Metric = "openItems" | "criticalItems" | "overdueItems" | "conformite";

const METRIC_LABELS: Record<Metric, string> = {
  openItems:    "Elements ouverts",
  criticalItems:"Elements critiques",
  overdueItems: "En retard",
  conformite:   "Conformite (%)",
};

const METRIC_SECONDARY: Record<Metric, (s: SiteKpi) => string> = {
  openItems:    (s) => `${s.totalRecords} enreg. · ${s.conformite}% conf.`,
  criticalItems:(s) => `${s.openItems} ouverts · ${s.overdueItems} retard`,
  overdueItems: (s) => `${s.openItems} ouverts · ${s.criticalItems} critiques`,
  conformite:   (s) => `${s.closedItems} clos sur ${s.totalRecords}`,
};

const SITE_COLORS: Record<string, string> = {
  Abidjan:      "#2563eb",
  Bouake:       "#c2410c",
  "San Pedro":  "#047857",
  Yamoussoukro: "#7c3aed",
};

function ProjectCard({ p, metric }: { p: ProjectKpi; metric: Metric }) {
  const val = p[metric];
  return (
    <div className="projectCard" style={{ "--project-color": p.color } as React.CSSProperties}>
      <div className="projectCardHeader">
        <span className="projectCardType">{p.projectType}</span>
        <span className={`projectCardStatus ${p.status === "En cours" ? "active" : p.status === "Planifie" ? "planned" : "done"}`}>
          {p.status}
        </span>
      </div>
      <p className="projectCardName">{p.projectName}</p>
      <div className="projectCardKpis">
        <div className="projectCardKpiItem">
          <strong style={{ color: p.color }}>{metric === "conformite" ? `${val}%` : val}</strong>
          <span>{METRIC_LABELS[metric]}</span>
        </div>
        <div className="projectCardKpiItem">
          <strong>{p.workforce}</strong>
          <span>Travailleurs</span>
        </div>
        <div className="projectCardKpiItem">
          <strong style={{ color: p.overdueItems > 0 ? "var(--danger)" : "var(--muted)" }}>
            {p.overdueItems}
          </strong>
          <span>En retard</span>
        </div>
        <div className="projectCardKpiItem">
          <strong>{p.conformite}%</strong>
          <span>Conformite</span>
        </div>
      </div>
    </div>
  );
}

export function SitesComparisonPanel() {
  const [metric, setMetric] = useState<Metric>("openItems");
  const { ville } = useCockpitFilter();
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  useEffect(() => {
    if (ville) setExpandedCity(ville);
  }, [ville]);
  const kpis = getSiteKpis();

  const sorted = [...kpis].sort((a, b) => b[metric] - a[metric]);
  const chartData = sorted.map((s) => ({
    site: s.site,
    value: s[metric],
    fill: SITE_COLORS[s.site] ?? "#64748b",
  }));
  const maxVal = Math.max(...kpis.map((k) => k[metric]), 1);

  return (
    <section className="cockpitBlock sitesBlock">
      <div className="sectionTitle">
        <div>
          <h2>Villes &amp; Projets HSE</h2>
          <p>Performance HSE par ville — cliquer sur une ville pour voir ses projets.</p>
        </div>
        <div className="periodToggle">
          {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
            <button key={m} className={`periodBtn${metric === m ? " active" : ""}`} onClick={() => setMetric(m)}>
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cartes villes cliquables ── */}
      <div className="sitesCardRow">
        {sorted.map((s, idx) => {
          const color = SITE_COLORS[s.site] ?? "#64748b";
          const val = s[metric];
          const pct = Math.round((val / maxVal) * 100);
          const isExpanded = expandedCity === s.site;

          return (
            <button
              key={s.site}
              className={`siteCard clickable${isExpanded ? " expanded" : ""}`}
              style={{ "--site-color": color } as React.CSSProperties}
              onClick={() => setExpandedCity(isExpanded ? null : s.site)}
            >
              <div className="siteCardHeader">
                <span className="siteCardName">
                  <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />
                  {s.site}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="siteCardRank">#{idx + 1}</span>
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </div>
              </div>
              <div className="siteCardMain">
                <strong className="siteCardValue" style={{ color }}>
                  {metric === "conformite" ? `${val}%` : val}
                </strong>
                <span className="siteCardMetricLabel">{METRIC_LABELS[metric]}</span>
              </div>
              <div className="siteCardProgress">
                <div className="siteCardProgressFill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <p className="siteCardSub">{METRIC_SECONDARY[metric](s)}</p>
              <div className="siteCardKpis">
                <span className="siteCardKpiBadge" style={{
                  background: s.overdueItems > 0 ? "var(--danger-light)" : "var(--bg)",
                  color: s.overdueItems > 0 ? "var(--danger)" : "var(--muted)",
                }}>
                  {s.overdueItems} retard
                </span>
                <span className="siteCardKpiBadge">{s.conformite}% conf.</span>
                <span className="siteCardKpiBadge">{s.openItems} ouverts</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Drill-down projets ── */}
      {expandedCity && (
        <div className="projectsDrillDown">
          <div className="projectsDrillHeader">
            <MapPin size={14} style={{ color: SITE_COLORS[expandedCity] }} />
            <strong style={{ color: SITE_COLORS[expandedCity] }}>{expandedCity}</strong>
            <span className="projectsDrillSub">— Projets actifs et leurs indicateurs HSE</span>
          </div>
          <div className="projectsGrid">
            {getProjectKpisForCity(expandedCity).map((p) => (
              <ProjectCard key={p.projectId} p={p} metric={metric} />
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
