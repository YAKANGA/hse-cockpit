import { Database, Download, FileDown } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { CockpitAlertsPanel } from "@/components/CockpitAlertsPanel";
import { CockpitFiltersBar } from "@/components/CockpitFiltersBar";
import { ConformiteGauge } from "@/components/ConformiteGauge";
import { DashboardDensityToggle } from "@/components/DashboardDensityToggle";
import { EcheancierPanel } from "@/components/EcheancierPanel";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { GlobalSynthesisCharts } from "@/components/GlobalSynthesisCharts";
import { KpiSparkCard } from "@/components/KpiSparkCard";
import { SitesComparisonPanel } from "@/components/SitesComparisonPanel";
import { globalSummary, moduleOperationalKpis, modules } from "@/lib/hse-data";


export default function Home() {
  return (
    <main className="appShell">
      <AppSidebar />

      <section className="workspace">
        {/* ── Hero + actions sur une seule barre ── */}
        <section className="heroBand ultraHero" id="cockpit">
          <div className="ultraHeroContent">
            <p className="eyebrow">Tableau de bord</p>
            <h1>Cockpit HSE consolide</h1>
          </div>
          <div className="heroActions">
            <CockpitFiltersBar />
            <DashboardDensityToggle />
            <a className="secondaryButton" href="/api/reports/global/docx">
              <FileDown size={16} /> Word
            </a>
            <a className="darkButton" href="/api/reports/global/pdf">
              <FileDown size={16} /> PDF
            </a>
            <a className="secondaryButton" href="/api/modules">
              <Database size={16} /> Donnees modules
            </a>
          </div>
        </section>

        {/* ── KPI row + gauge en une seule ligne ── */}
        <section className="kpiGaugeRow">
          <div className="kpiGridCompact">
            <KpiSparkCard
              label="Conformite globale"
              value={`${globalSummary.averageCompliance}%`}
              trend="Moy. ponderee"
              trendUp={globalSummary.averageCompliance >= 80}
              iconKey="shield"
              color="#0f766e"
              bg="#ccfbf1"
            />
            <KpiSparkCard
              label="Actions critiques"
              value="44"
              trend="+3 cette semaine"
              trendUp={false}
              iconKey="activity"
              color="#dc2626"
              bg="#fee2e2"
            />
            <KpiSparkCard
              label="Imports a corriger"
              value="2"
              trend="Fichiers en controle"
              iconKey="alert"
              color="#d97706"
              bg="#fef3c7"
            />
            <KpiSparkCard
              label="Modules actifs"
              value="6"
              trend="Couverture complete"
              trendUp={true}
              iconKey="users"
              color="#7c3aed"
              bg="#ede9fe"
            />
          </div>
          <div className="gaugeCompact">
            <ConformiteGauge value={globalSummary.averageCompliance} />
          </div>
        </section>

        {/* ── Stats inline ── */}
        <div className="statsInlineRow">
          <span><strong>{globalSummary.totalRecords}</strong> declarations HSE enregistrees</span>
          <span className="statsDivider" />
          <span><strong>{globalSummary.totalImports}</strong> fichiers Excel valides</span>
          <span className="statsDivider" />
          <span><strong>{globalSummary.totalOpenItems}</strong> elements en attente de traitement</span>
          <span className="statsDivider" />
          <span><strong>{globalSummary.modulesAtRisk}</strong> modules sous le seuil de conformite</span>
          <span className="statsDivider" />
          <span style={{ color: "#dc2626" }}><strong>3</strong> alertes critiques actives</span>
        </div>

        <CockpitAlertsPanel />
        <ExecutiveDashboard />
        <GlobalSynthesisCharts />
        <EcheancierPanel />
        <SitesComparisonPanel />

        {/* ── Synthese modules ── */}
        <section className="cockpitBlock" id="modules">
          <div className="sectionTitle">
            <div>
              <h2>Synthese des modules</h2>
              <p>Cliquer sur un module pour ses KPI, graphiques, imports et exports.</p>
            </div>
          </div>

          <div className="moduleSynthesisList">
            {modules.map((module) => {
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
                    <span><strong>{module.compliance}%</strong> Conformite</span>
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
      </section>
    </main>
  );
}
