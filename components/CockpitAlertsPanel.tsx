"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { hseAlerts } from "@/lib/alerts-data";
import { useCockpitFilter } from "@/lib/use-cockpit-filter";

const SEVERITY_ORDER = { Critique: 0, Haute: 1, Moyenne: 2 };
const SEVERITY_CLASS: Record<string, string> = {
  Critique: "status danger",
  Haute: "status warn",
  Moyenne: "status ok",
};

export function CockpitAlertsPanel() {
  const { ville, projet } = useCockpitFilter();

  const filtered = hseAlerts.filter((a) => {
    if (ville && a.site !== ville) return false;
    if (projet && !a.projectName?.includes(projet) && a.site !== projet) return false;
    return true;
  });

  const top = [...filtered]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 4);

  const criticalCount = filtered.filter((a) => a.severity === "Critique").length;
  const openCount = filtered.filter((a) => a.status === "Ouvert").length;

  return (
    <section className="cockpitBlock">
      <div className="sectionTitle">
        <div>
          <h2>Alertes prioritaires</h2>
          <p>
            {criticalCount} alerte{criticalCount > 1 ? "s" : ""} critique{criticalCount > 1 ? "s" : ""} — {openCount} ouvert{openCount > 1 ? "es" : "e"} en attente d&apos;action.
          </p>
        </div>
        <Link className="secondaryButton" href="/alerts">
          Toutes les alertes
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="alertsPriorityGrid">
        {top.map((alert) => (
          <article className="alertPriorityCard" key={alert.id}>
            <div className="alertPriorityCardTop">
              <span className={SEVERITY_CLASS[alert.severity]}>{alert.severity}</span>
              <span className="alertPriorityModule">{alert.moduleName}</span>
            </div>
            <strong className="alertPriorityTitle">{alert.title}</strong>
            <p className="alertPriorityRec">{alert.recommendation}</p>
            <div className="alertPriorityMeta">
              <span>
                <AlertTriangle size={13} />
                {alert.site}
              </span>
              <span>
                <Clock size={13} />
                {alert.dueDate}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
