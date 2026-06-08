"use client";

import { useMemo } from "react";
import { hseAlerts } from "@/lib/alerts-data";
import { useCockpitFilter, dateInRange, getActiveSites } from "@/lib/use-cockpit-filter";

type Props = {
  moduleId: string;
  alertLabel: string;
  usefulAction: string;
};

export function DecisionPilotagePanel({ moduleId, alertLabel, usefulAction }: Props) {
  const globalFilter = useCockpitFilter();
  const { dateDebut, dateFin } = globalFilter;
  const cockpitHasDate = !!(dateDebut || dateFin);
  const activeSites = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  const filteredAlerts = useMemo(() =>
    hseAlerts.filter((a) => {
      if (a.moduleId !== moduleId) return false;
      if (activeSites && !activeSites.includes(a.site)) return false;
      if (cockpitHasDate && !dateInRange(a.dueDate, dateDebut, dateFin)) return false;
      return true;
    }),
  [moduleId, activeSites, cockpitHasDate, dateDebut, dateFin]);

  return (
    <section className="moduleOperationalPanel">
      <article className="panel">
        <div className="panelHeader">
          <div>
            <h2>Decision de pilotage</h2>
            <p>Action prioritaire issue des indicateurs du module.</p>
          </div>
        </div>
        {filteredAlerts.length === 0 ? (
          <div className="decisionBox" style={{ color: "var(--muted)", fontStyle: "italic" }}>
            <strong>Aucune alerte dans la période sélectionnée.</strong>
          </div>
        ) : (
          <div className="decisionBox">
            <strong>{usefulAction}</strong>
            <span>{filteredAlerts.length} {alertLabel}</span>
          </div>
        )}
      </article>
    </section>
  );
}
