"use client";

import { Activity, AlertTriangle, Gauge, ShieldCheck, UsersRound } from "lucide-react";

const ICONS = {
  shield:   ShieldCheck,
  activity: Activity,
  alert:    AlertTriangle,
  users:    UsersRound,
  gauge:    Gauge,
} as const;

export type KpiIconKey = keyof typeof ICONS;

type KpiSparkCardProps = {
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
  iconKey: KpiIconKey;
  color: string;
  bg: string;
  sparkData?: { v: number }[];
};

export function KpiSparkCard({ label, value, trend, trendUp, iconKey, color, bg }: KpiSparkCardProps) {
  const Icon = ICONS[iconKey];

  return (
    <article
      className="kpiCard kpiHorizontalCard"
      style={{ "--kpi-color": color, "--kpi-bg": bg } as React.CSSProperties}
    >
      <div className="kpiIcon"><Icon size={18} /></div>
      <div className="kpiHorizontalBody">
        <span className="kpiHorizontalLabel">{label}</span>
        <strong className="kpiHorizontalValue">{value}</strong>
        <small className={trendUp === false ? "trendDown" : trendUp === true ? "trendUp" : "kpiHorizontalTrend"}>
          {trend}
        </small>
      </div>
    </article>
  );
}
