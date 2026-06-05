"use client";

import { useMemo } from "react";
import { KpiSparkCard } from "@/components/KpiSparkCard";
import { ConformiteGauge } from "@/components/ConformiteGauge";
import { useCockpitFilter } from "@/lib/use-cockpit-filter";
import { getFilteredCockpitStats } from "@/lib/cockpit-stats";

export function CockpitKpiRow() {
  const { ville, projet } = useCockpitFilter();
  const stats = useMemo(() => getFilteredCockpitStats(ville, projet), [ville, projet]);

  const filterLabel = ville ? ` — ${ville}${projet ? ` / ${projet}` : ""}` : "";

  return (
    <>
      {/* ── KPI row + gauge ── */}
      <section className="kpiGaugeRow">
        <div className="kpiGridCompact">
          <KpiSparkCard
            label={`Conformite globale${filterLabel}`}
            value={`${stats.averageCompliance}%`}
            trend={stats.isFiltered ? "Calcul sur enregistrements filtres" : "Moy. ponderee"}
            trendUp={stats.averageCompliance >= 80}
            iconKey="shield"
            color="#0f766e"
            bg="#ccfbf1"
          />
          <KpiSparkCard
            label="Actions critiques"
            value={String(stats.totalOpenItems)}
            trend={stats.isFiltered ? `${filterLabel.replace(" — ", "")}` : "+3 cette semaine"}
            trendUp={false}
            iconKey="activity"
            color="#dc2626"
            bg="#fee2e2"
          />
          <KpiSparkCard
            label="Elements en attente"
            value={String(stats.criticalCount)}
            trend="Priorite haute ou critique"
            iconKey="alert"
            color="#d97706"
            bg="#fef3c7"
          />
          <KpiSparkCard
            label="Modules actifs"
            value={String(stats.moduleStats.filter((m) => m.records > 0).length)}
            trend={stats.isFiltered ? "Avec donnees sur ce perimetre" : "Couverture complete"}
            trendUp={true}
            iconKey="users"
            color="#7c3aed"
            bg="#ede9fe"
          />
        </div>
        <div className="gaugeCompact">
          <ConformiteGauge value={stats.averageCompliance} />
        </div>
      </section>

      {/* ── Stats inline ── */}
      <div className="statsInlineRow">
        <span><strong>{stats.totalRecords.toLocaleString("fr-FR")}</strong> declarations HSE{filterLabel}</span>
        <span className="statsDivider" />
        <span><strong>{stats.totalImports}</strong> fichiers Excel valides</span>
        <span className="statsDivider" />
        <span><strong>{stats.totalOpenItems}</strong> elements en attente</span>
        <span className="statsDivider" />
        <span><strong>{stats.modulesAtRisk}</strong> modules sous le seuil de conformite</span>
        <span className="statsDivider" />
        <span style={{ color: "#dc2626" }}><strong>{stats.criticalCount}</strong> elements critiques actifs</span>
      </div>
    </>
  );
}
