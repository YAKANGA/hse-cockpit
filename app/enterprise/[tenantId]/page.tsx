import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { moduleOperationalKpis } from "@/lib/hse-data";
import { hseAlerts } from "@/lib/alerts-data";
import { getTenant, getTenantActiveModules, getTenantSummary } from "@/lib/tenant-analytics";
import { tenants } from "@/lib/tenant-data";
import "../../globals.css";

export function generateStaticParams() {
  return tenants.map((tenant) => ({ tenantId: tenant.id }));
}

export default async function EnterprisePage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = getTenant(tenantId);

  if (!tenant) {
    notFound();
  }

  const activeModules = getTenantActiveModules(tenant.id);
  const summary = getTenantSummary(tenant.id);
  const activeModuleIds = new Set(tenant.modules);
  const operational = moduleOperationalKpis.filter((kpi) => activeModuleIds.has(kpi.moduleId));

  return (
    <main className="appShell">
      <AppSidebar />

      <section className="workspace">
        <section
          className="tenantDashboardHero"
          style={
            {
              "--tenant-primary": tenant.preferences.primaryColor,
              "--tenant-secondary": tenant.preferences.secondaryColor,
            } as React.CSSProperties
          }
        >
          <div className="tenantDashboardLogo">{tenant.preferences.logoText}</div>
          <div>
            <p className="eyebrow">Entreprise</p>
            <h1>{tenant.name}</h1>
            <p>{tenant.sector} - {tenant.country} - {tenant.modules.length} modules actifs</p>
          </div>
        </section>

        <section className="globalSummaryGrid">
          <article>
            <span>Lignes consolidees</span>
            <strong>{summary.totalRecords}</strong>
          </article>
          <article>
            <span>Imports valides</span>
            <strong>{summary.totalImports}</strong>
          </article>
          <article>
            <span>Elements ouverts</span>
            <strong>{summary.totalOpenItems}</strong>
          </article>
          <article>
            <span>Conformite moyenne</span>
            <strong>{summary.averageCompliance}%</strong>
          </article>
          <article>
            <span>Alertes</span>
            <strong>{summary.totalAlerts}</strong>
          </article>
        </section>

        <section className="sectionBlock">
          <div className="sectionTitle">
            <div>
              <h2>Modules disponibles pour {tenant.name}</h2>
              <p>Seuls les modules actives par le Super Admin sont visibles dans cette entreprise.</p>
            </div>
          </div>
          <div className="moduleSynthesisList">
            {activeModules.map((module) => {
              const Icon = module.icon;
              const kpi = operational.find((item) => item.moduleId === module.id);

              return (
                <article className="moduleSynthesisRow" key={module.id}>
                  <div className="moduleSynthesisTitle" style={{ "--module": module.color, "--tint": module.accent } as React.CSSProperties}>
                    <div className="moduleIcon">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3>{module.shortName}</h3>
                      <span>{module.name}</span>
                    </div>
                  </div>
                  <div className="moduleSynthesisMetrics">
                    <span><strong>{module.records}</strong> lignes</span>
                    <span><strong>{module.compliance}%</strong> conformite</span>
                    <span><strong>{module.pendingItems}</strong> ouverts</span>
                    <span><strong>{hseAlerts.filter(a => a.moduleId === module.id).length}</strong> alertes</span>
                  </div>
                  <div className="moduleSynthesisAction">
                    <p>{kpi?.usefulAction}</p>
                    <div>
                      <a className="secondaryButton" href={`/api/templates/${module.id}`}>
                        Modele
                      </a>
                      <a className="primaryButton" href={`/modules/${module.id}?tenantId=${tenant.id}`}>
                        Dashboard
                      </a>
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
