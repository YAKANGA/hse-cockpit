import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Database,
  Download,
  FileDown,
} from "lucide-react";
import { moduleOperationalKpis, modules } from "@/lib/hse-data";
import { getIntegratedModuleRecords } from "@/lib/import-store";
import { getModuleDashboardData } from "@/lib/module-dashboard-data";
import { getModuleRecords } from "@/lib/module-records-data";
import { getTenant } from "@/lib/tenant-analytics";
import { ActionsPriorityPanel } from "@/components/ActionsPriorityPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { CockpitFiltersBar } from "@/components/CockpitFiltersBar";
import { EpiDashboardPanel } from "@/components/EpiDashboardPanel";
import { EventsSeverityPanel } from "@/components/EventsSeverityPanel";
import { IndicateursTFTGDashboard } from "@/components/IndicateursTFTGDashboard";
import { InspectionsConformitePanel } from "@/components/InspectionsConformitePanel";
import { AcrPanel } from "@/components/AcrPanel";
import { CauseriesPanel } from "@/components/CauseriesPanel";
import { ConsumptionPanel } from "@/components/ConsumptionPanel";
import { DuerpPanel } from "@/components/DuerpPanel";
import { EnvironmentImpactsPanel } from "@/components/EnvironmentImpactsPanel";
import { MedicalPanel } from "@/components/MedicalPanel";
import { PermisStatusPanel } from "@/components/PermisStatusPanel";
import { PlanificationHsePanel } from "@/components/PlanificationHsePanel";
import { TrainingHabilitationsPanel } from "@/components/TrainingHabilitationsPanel";
import { DecisionPilotagePanel } from "@/components/DecisionPilotagePanel";
import { VbgDashboardPanel } from "@/components/VbgDashboardPanel";
import { PpeModuleSection } from "@/components/PpeModuleSection";
import { ModuleDashboardCharts } from "@/components/ModuleDashboardCharts";
import { ModuleImportForm } from "@/components/ModuleImportForm";
import { ModuleRecordsExplorer } from "@/components/ModuleRecordsExplorer";
import "../../globals.css";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return modules.map((module) => ({ moduleId: module.id }));
}

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const { moduleId } = await params;
  const { tenantId } = await searchParams;
  const module = modules.find((item) => item.id === moduleId);

  if (!module) {
    notFound();
  }

  if (tenantId) {
    const tenant = getTenant(tenantId);
    if (!tenant || !tenant.modules.includes(module.id)) {
      notFound();
    }
  }

  const Icon = module.icon;
  const operationalKpi = moduleOperationalKpis.find((item) => item.moduleId === module.id);
  const dashboardData = getModuleDashboardData(module.id);
  const records = [...getIntegratedModuleRecords(module.id, tenantId), ...getModuleRecords(module.id)];
  const tenantQuery = tenantId ? `?tenantId=${tenantId}` : "";

  return (
    <main className="appShell">
      <AppSidebar />
      <section className="modulePage">
      <header className="moduleHero" style={{ "--module": module.color, "--tint": module.accent } as React.CSSProperties}>
        <div>
          <Link className="backLink" href="/">
            <ArrowLeft size={18} />
            Retour cockpit
          </Link>
          <div className="moduleHeroTitle">
            <div className="moduleIcon">
              <Icon size={26} />
            </div>
            <div>
              <p className="eyebrow">Module HSE</p>
              <h1>{module.name}</h1>
              <p>{module.description}</p>
            </div>
          </div>
        </div>
        <div className="moduleHeroActions">
          <CockpitFiltersBar />
          <a className="secondaryButton" href={`/api/templates/${module.id}${tenantQuery}`}>
            <Download size={18} />
            Modele Excel
          </a>
          <a className="darkButton" href={`/api/modules/${module.id}/dashboard${tenantQuery}`}>
            <Database size={18} />
            API dashboard
          </a>
        </div>
      </header>

      {dashboardData ? <ModuleDashboardCharts data={dashboardData} accent={module.color} records={records} /> : null}

      <section className="moduleActionGrid">
        <ModuleImportForm moduleId={module.id} moduleName={module.name} tenantId={tenantId} />
        <article className="panel moduleQuickActions">
          <div className="panelHeader">
            <div>
              <h2>Actions rapides</h2>
              <p>Ressources du module et sorties disponibles.</p>
            </div>
          </div>
          <div className="reportList">
            <a className="reportItem" href={`/api/templates/${module.id}${tenantQuery}`}>
              <span>Telecharger le modele .xlsx</span>
              <Download size={16} />
            </a>
            <a className="reportItem" href={`/api/modules/${module.id}/dashboard${tenantQuery}`}>
              <span>Consulter les donnees dashboard</span>
              <Database size={16} />
            </a>
            <a className="reportItem" href={`/api/reports/modules/${module.id}/docx${tenantQuery}`}>
              <span>Exporter un rapport Word</span>
              <FileDown size={16} />
            </a>
            <a className="reportItem" href={`/api/reports/modules/${module.id}/pdf${tenantQuery}`}>
              <span>Exporter un rapport PDF</span>
              <FileDown size={16} />
            </a>
            <a className="reportItem" href={`/api/exports/${module.id}${tenantQuery}`}>
              <span>Exporter les donnees Excel</span>
              <Download size={16} />
            </a>
          </div>
        </article>
      </section>

      {operationalKpi ? (
        <DecisionPilotagePanel
          moduleId={module.id}
          alertLabel={operationalKpi.alertLabel}
          usefulAction={operationalKpi.usefulAction}
        />
      ) : null}

      {module.id === "indicators"   ? <IndicateursTFTGDashboard />     : null}
      {module.id === "actions"      ? <ActionsPriorityPanel />          : null}
      {module.id === "events"       ? <EventsSeverityPanel />           : null}
      {module.id === "inspections"  ? <InspectionsConformitePanel />    : null}
      {module.id === "permits"      ? <PermisStatusPanel />             : null}
      {module.id === "ppe"          ? <EpiDashboardPanel />             : null}
      {module.id === "environment"  ? <EnvironmentImpactsPanel />       : null}
      {module.id === "training"     ? <TrainingHabilitationsPanel />    : null}
      {module.id === "causeries"    ? <CauseriesPanel />                : null}
      {module.id === "duerp"        ? <DuerpPanel />                    : null}
      {module.id === "medical"      ? <MedicalPanel />                  : null}
      {module.id === "acr"          ? <AcrPanel />                      : null}
      {module.id === "consumption"  ? <ConsumptionPanel />              : null}
      {module.id === "planification"? <PlanificationHsePanel />         : null}
      {module.id === "vbg"          ? <VbgDashboardPanel />             : null}

      <ModuleRecordsExplorer moduleId={module.id} records={records} tenantId={tenantId} />

      {module.id === "ppe" ? <PpeModuleSection /> : null}
      </section>
    </main>
  );
}

