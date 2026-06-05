"use client";

import { Download } from "lucide-react";
import { useMemo } from "react";
import { useCockpitFilter } from "@/lib/use-cockpit-filter";
import { getFilteredCockpitStats } from "@/lib/cockpit-stats";
import { moduleOperationalKpis } from "@/lib/hse-data";

export function CockpitModuleSynthesis() {
  const { ville, projet } = useCockpitFilter();
  const stats = useMemo(() => getFilteredCockpitStats(ville, projet), [ville, projet]);
  const filterLabel = ville ? ` — ${ville}${projet ? ` / ${projet}` : ""}` : "";

  return (
    <section className="cockpitBlock" id="modules">
      <div className="sectionTitle">
        <div>
          <h2>Synthese des modules{filterLabel}</h2>
          <p>
            {stats.isFiltered
              ? `Donnees filtrees sur le perimetre selectionne. Cliquer sur un module pour ses details.`
              : "Cliquer sur un module pour ses KPI, graphiques, imports et exports."}
          </p>
        </div>
      </div>

      <div className="moduleSynthesisList">
        {stats.moduleStats.map((module) => {
          const Icon = module.icon;
          const operational = moduleOperationalKpis.find((kpi) => kpi.moduleId === module.id);

          return (
            <article
              className="moduleSynthesisRow"
              key={module.id}
              style={{ "--module": module.color, "--tint": module.accent } as React.CSSProperties}
            >
              <div className="moduleSynthesisTitle">
                <div className="moduleIcon"><Icon size={20} /></div>
                <div>
                  <h3>{module.shortName}</h3>
                  <span>{module.name}</span>
                </div>
              </div>
              <div className="moduleSynthesisMetrics">
                <span><strong>{module.records}</strong> Enregistrements</span>
                <span
                  style={{ color: module.compliance < 80 ? "#dc2626" : module.compliance < 90 ? "#d97706" : "#16a34a" }}
                >
                  <strong>{module.compliance}%</strong> Conformite
                </span>
                <span><strong>{module.pendingItems}</strong> En attente</span>
                <span><strong>{operational?.alertValue ?? 0}</strong> Alertes</span>
              </div>
              <div className="moduleSynthesisAction">
                <p>{operational?.usefulAction}</p>
                <div>
                  <a className="secondaryButton" href={`/api/templates/${module.id}`}>
                    <Download size={14} /> Modele
                  </a>
                  <a className="primaryButton" href={`/modules/${module.id}`}>Ouvrir</a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
