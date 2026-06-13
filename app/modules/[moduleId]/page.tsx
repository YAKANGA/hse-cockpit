import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import { ModuleHeaderDropdowns } from "@/components/ModuleHeaderDropdowns";
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
  const records = [...getIntegratedModuleRecords(module.id, tenantId), ...getModuleRecords(module.id)];
  const dashboardData = getModuleDashboardData(module.id, records);
  const tenantQuery = tenantId ? `?tenantId=${tenantId}` : "";

  return (
    <main className="appShell">
      <AppSidebar />
      <section className="modulePage">
      <header className="moduleHero" style={{ "--module": module.color, "--tint": module.accent } as React.CSSProperties}>
        <div>
          <div className="moduleHeroTitle">
            <div className="moduleIcon">
              <Icon size={26} />
            </div>
            <div>
              <h1>{module.name}</h1>
            </div>
          </div>
        </div>
        <div className="moduleHeroActions">
          <CockpitFiltersBar />
          <ModuleHeaderDropdowns moduleId={module.id} moduleName={module.name} tenantId={tenantId} />
        </div>
      </header>

      {dashboardData ? <ModuleDashboardCharts data={dashboardData} accent={module.color} records={records} /> : null}

      {operationalKpi ? (
        <DecisionPilotagePanel
          moduleId={module.id}
          alertLabel={operationalKpi.alertLabel}
          usefulAction={operationalKpi.usefulAction}
        />
      ) : null}

      {module.id === "indicators"   ? <IndicateursTFTGDashboard />     : null}
      {module.id === "actions"      ? <ActionsPriorityPanel />          : null}
      {module.id === "events"       ? <EventsSeverityPanel records={records} /> : null}
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

