"use client";

import { useState } from "react";
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
import { getSiteKpis, type SiteKpi } from "@/lib/sites-data";

type Metric = "openItems" | "criticalItems" | "overdueItems" | "conformite";

const METRIC_LABELS: Record<Metric, string> = {
  openItems: "Elements ouverts",
  criticalItems: "Elements critiques",
  overdueItems: "En retard",
  conformite: "Conformite (%)",
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

export function SitesComparisonPanel() {
  const [metric, setMetric] = useState<Metric>("openItems");
  const kpis = getSiteKpis();

  const sorted = [...kpis].sort((a, b) => {
    if (metric === "conformite") return b[metric] - a[metric];
    return b[metric] - a[metric];
  });

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
          <h2>Comparaison par site</h2>
          <p>Performance HSE comparee entre les 4 sites actifs de l'entreprise.</p>
        </div>
        <div className="periodToggle">
          {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
            <button
              key={m}
              className={`periodBtn${metric === m ? " active" : ""}`}
              onClick={() => setMetric(m)}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4 site cards ── */}
      <div className="sitesCardRow">
        {sorted.map((s, idx) => {
          const color = SITE_COLORS[s.site] ?? "#64748b";
          const val = s[metric];
          const pct = Math.round((val / maxVal) * 100);
          return (
            <div
              key={s.site}
              className="siteCard"
              style={{ "--site-color": color } as React.CSSProperties}
            >
              <div className="siteCardHeader">
                <span className="siteCardName">{s.site}</span>
                <span className="siteCardRank">#{idx + 1}</span>
              </div>
              <div className="siteCardMain">
                <strong className="siteCardValue" style={{ color }}>
                  {metric === "conformite" ? `${val}%` : val}
                </strong>
                <span className="siteCardMetricLabel">{METRIC_LABELS[metric]}</span>
              </div>
              <div className="siteCardProgress">
                <div
                  className="siteCardProgressFill"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <p className="siteCardSub">{METRIC_SECONDARY[metric](s)}</p>
              <div className="siteCardKpis">
                <span
                  className="siteCardKpiBadge"
                  style={{
                    background: s.overdueItems > 0 ? "var(--danger-light)" : "var(--bg)",
                    color: s.overdueItems > 0 ? "var(--danger)" : "var(--muted)",
                  }}
                >
                  {s.overdueItems} retard
                </span>
                <span className="siteCardKpiBadge">{s.conformite}% conf.</span>
                <span className="siteCardKpiBadge">{s.openItems} ouverts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Horizontal bar chart ── */}
      <div className="sitesChartFull">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxVal + 1]}
            />
            <YAxis
              type="category"
              dataKey="site"
              width={90}
              tick={{ fontSize: 13, fill: "var(--ink)", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--line)", opacity: 0.5 }}
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Bar
              dataKey="value"
              name={METRIC_LABELS[metric]}
              radius={[0, 6, 6, 0]}
              barSize={28}
            >
              <LabelList
                dataKey="value"
                position="right"
                style={{ fontSize: 13, fontWeight: 700, fill: "var(--ink)" }}
                formatter={(v) => (metric === "conformite" ? `${v}%` : `${v}`)}
              />
              {chartData.map((entry) => (
                <Cell key={entry.site} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
