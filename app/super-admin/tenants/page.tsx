import { AppSidebar } from "@/components/AppSidebar";
import { AccessGate } from "@/components/AccessGate";
import { SuperAdminPortBadge } from "@/components/SuperAdminPortBadge";
import { SuperAdminTenantManager } from "@/components/SuperAdminTenantManager";
import { modules } from "@/lib/hse-data";
import { superAdminCapabilities, tenantIsolationRules, tenants } from "@/lib/tenant-data";
import "../../globals.css";

export default function TenantsPage() {
  return (
    <main className="appShell">
      <AppSidebar />

      <AccessGate anyOf={["platform:manage-tenants"]} label="Gestion des entreprises">
      <section className="workspace">
        <SuperAdminPortBadge />

        <section className="adminHeader superAdminHeader">
          <p className="eyebrow">Super Admin</p>
          <h1>Gestion des entreprises</h1>
          <p>
            Creation des entreprises, preferences personnalisables, activation des modules et cloisonnement total des donnees.
          </p>
        </section>

        <section className="tenantStats">
          <article>
            <span>Entreprises</span>
            <strong>{tenants.length}</strong>
          </article>
          <article>
            <span>Entreprises actives</span>
            <strong>{tenants.filter((tenant) => tenant.status === "Actif").length}</strong>
          </article>
          <article>
            <span>Utilisateurs cumules</span>
            <strong>{tenants.reduce((sum, tenant) => sum + tenant.users, 0)}</strong>
          </article>
          <article>
            <span>Modules disponibles</span>
            <strong>{modules.length}</strong>
          </article>
        </section>

        <SuperAdminTenantManager initialTenants={tenants} />

        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2>Entreprises creees</h2>
              <p>Chaque entreprise dispose de ses propres modules, roles, utilisateurs et preferences.</p>
            </div>
            <button className="primaryButton">Nouvelle entreprise</button>
          </div>
          <div className="tenantGrid">
            {tenants.map((tenant) => (
              <article className="tenantCard" key={tenant.id}>
                <div className="tenantLogo" style={{ background: tenant.preferences.primaryColor }}>
                  {tenant.preferences.logoText}
                </div>
                <div>
                  <h3>{tenant.name}</h3>
                  <span>{tenant.sector} - {tenant.country}</span>
                </div>
                <div className="tenantMeta">
                  <span><strong>{tenant.users}</strong> utilisateurs</span>
                  <span><strong>{tenant.modules.length}</strong> modules actifs</span>
                  <span className={tenant.status === "Actif" ? "status ok" : "status warn"}>{tenant.status}</span>
                </div>
                <div className="tenantModules">
                  {tenant.modules.map((moduleId) => {
                    const module = modules.find((item) => item.id === moduleId);
                    return <span key={moduleId}>{module?.shortName ?? moduleId}</span>;
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="splitGrid" id="preferences">
          <article className="panel">
            <div className="panelHeader">
              <div>
                <h2>Preferences personnalisables</h2>
                <p>Nom, logo, couleurs et densite des tableaux de bord.</p>
              </div>
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    <th>Logo</th>
                    <th>Couleur principale</th>
                    <th>Couleur secondaire</th>
                    <th>Densite</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td>{tenant.name}</td>
                      <td>{tenant.preferences.logoText}</td>
                      <td><span className="colorSwatch" style={{ background: tenant.preferences.primaryColor }} /> {tenant.preferences.primaryColor}</td>
                      <td><span className="colorSwatch" style={{ background: tenant.preferences.secondaryColor }} /> {tenant.preferences.secondaryColor}</td>
                      <td>{tenant.preferences.dashboardDensity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <h2>Capacites Super Admin</h2>
                <p>Actions reservees au niveau plateforme.</p>
              </div>
            </div>
            <ul className="adminChecklist">
              {superAdminCapabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="panel" id="isolation">
          <div className="panelHeader">
            <div>
              <h2>Cloisonnement des entreprises</h2>
              <p>Separation totale des donnees, roles, utilisateurs, preferences et rapports.</p>
            </div>
          </div>
          <div className="isolationGrid">
            {tenantIsolationRules.map((rule) => (
              <article key={rule}>{rule}</article>
            ))}
          </div>
        </section>
      </section>
      </AccessGate>
    </main>
  );
}
