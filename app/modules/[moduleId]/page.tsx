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
import { getPpeSummary, ppeRecords } from "@/lib/ppe-data";
import { getTenant } from "@/lib/tenant-analytics";
import { ActionsPriorityPanel } from "@/components/ActionsPriorityPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { EpiDashboardPanel } from "@/components/EpiDashboardPanel";
import { EventsSeverityPanel } from "@/components/EventsSeverityPanel";
import { IndicateursTFTGDashboard } from "@/components/IndicateursTFTGDashboard";
import { InspectionsConformitePanel } from "@/components/InspectionsConformitePanel";
import { EnvironmentImpactsPanel } from "@/components/EnvironmentImpactsPanel";
import { PermisStatusPanel } from "@/components/PermisStatusPanel";
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

      {dashboardData ? <ModuleDashboardCharts data={dashboardData} accent={module.color} /> : null}

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
        <section className="moduleOperationalPanel">
          <article className="panel">
            <div className="panelHeader">
              <div>
                <h2>Decision de pilotage</h2>
                <p>Action prioritaire issue des indicateurs du module.</p>
              </div>
            </div>
            <div className="decisionBox">
              <strong>{operationalKpi.usefulAction}</strong>
              <span>{operationalKpi.alertValue} {operationalKpi.alertLabel}</span>
            </div>
          </article>
        </section>
      ) : null}

      {module.id === "indicators"   ? <IndicateursTFTGDashboard />     : null}
      {module.id === "actions"      ? <ActionsPriorityPanel />          : null}
      {module.id === "events"       ? <EventsSeverityPanel />           : null}
      {module.id === "inspections"  ? <InspectionsConformitePanel />    : null}
      {module.id === "permits"      ? <PermisStatusPanel />             : null}
      {module.id === "ppe"          ? <EpiDashboardPanel />             : null}
      {module.id === "environment"  ? <EnvironmentImpactsPanel />       : null}

      <ModuleRecordsExplorer moduleId={module.id} records={records} tenantId={tenantId} />

      {module.id === "ppe" ? <PpeModuleSection /> : null}
      </section>
    </main>
  );
}

function PpeModuleSection() {
  const summary = getPpeSummary();

  return (
    <section className="sectionBlock">
      <div className="epiGrid">
        <article className="panel epiSummary">
          <div className="epiMetric">
            <span>Stock total</span>
            <strong>{summary.totalStock}</strong>
          </div>
          <div className="epiMetric">
            <span>Attribue</span>
            <strong>{summary.totalAttributed}</strong>
          </div>
          <div className="epiMetric">
            <span>Disponible</span>
            <strong>{summary.totalAvailable}</strong>
          </div>
          <div className="epiMetric">
            <span>Valeur stock</span>
            <strong>{summary.inventoryValue.toLocaleString("fr-FR")} FCFA</strong>
          </div>
        </article>

        <article className="panel epiAlerts">
          <div className="panelHeader">
            <div>
              <h2>Alertes EPI</h2>
              <p>Expiration, disponibilite et coherence des quantites.</p>
            </div>
          </div>
          <div className="alertRows">
            <span><strong>{summary.expired}</strong> expire(s)</span>
            <span><strong>{summary.lowStock}</strong> stock critique</span>
            <span><strong>{summary.expiringSoon}</strong> expiration proche</span>
            <span><strong>{summary.anomalies}</strong> anomalie</span>
          </div>
        </article>
      </div>

      <article className="panel epiTablePanel">
        <div className="panelHeader">
          <div>
            <h2>Registre EPI</h2>
            <p>Inventaire et controles periodiques des EPI et equipements de securite.</p>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Designation</th>
                <th>Categorie</th>
                <th>Stock</th>
                <th>Attribue</th>
                <th>Disponible</th>
                <th>Expiration</th>
                <th>Fournisseur</th>
              </tr>
            </thead>
            <tbody>
              {ppeRecords.map((item) => (
                <tr key={item.reference}>
                  <td>{item.reference}</td>
                  <td>{item.designation}</td>
                  <td>{item.categorie}</td>
                  <td>{item.quantiteStock}</td>
                  <td>{item.quantiteAttribuee}</td>
                  <td>
                    <span className={item.quantiteDisponible <= 5 ? "status warn" : "status ok"}>
                      {item.quantiteDisponible}
                    </span>
                  </td>
                  <td>{item.dateExpiration}</td>
                  <td>{item.fournisseur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
