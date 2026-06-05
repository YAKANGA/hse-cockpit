import { Database, FileDown } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { CockpitAlertsPanel } from "@/components/CockpitAlertsPanel";
import { CockpitFiltersBar } from "@/components/CockpitFiltersBar";
import { CockpitKpiRow } from "@/components/CockpitKpiRow";
import { CockpitModuleSynthesis } from "@/components/CockpitModuleSynthesis";
import { DashboardDensityToggle } from "@/components/DashboardDensityToggle";
import { EcheancierPanel } from "@/components/EcheancierPanel";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { GlobalSynthesisCharts } from "@/components/GlobalSynthesisCharts";
import { SitesComparisonPanel } from "@/components/SitesComparisonPanel";


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

        <CockpitKpiRow />

        <CockpitAlertsPanel />
        <ExecutiveDashboard />
        <GlobalSynthesisCharts />
        <EcheancierPanel />
        <SitesComparisonPanel />

        <CockpitModuleSynthesis />
      </section>
    </main>
  );
}
