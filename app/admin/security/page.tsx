import { AccessGate } from "@/components/AccessGate";
import { AppSidebar } from "@/components/AppSidebar";
import { AccessControlSimulator } from "@/components/AccessControlSimulator";
import { PermissionsMatrixPanel } from "@/components/PermissionsMatrixPanel";
import { demoSessions, rolePermissions } from "@/lib/permissions";
import { tenantIsolationRules, tenants } from "@/lib/tenant-data";
import "../../globals.css";

const permissions = Array.from(new Set(Object.values(rolePermissions).flat()));

export default function SecurityPage() {
  return (
    <main className="appShell">
      <AppSidebar />
      <AccessGate anyOf={["tenant:manage-roles"]} label="Securite, roles et cloisonnement">
      <section className="workspace">
        <section className="adminHeader">
          <p className="eyebrow">Administration</p>
          <h1>Securite, roles et cloisonnement</h1>
          <p>Controle des profils, droits applicatifs et separation stricte entre entreprises.</p>
        </section>

        <section className="adminStats">
          <article>
            <span>Profils demo</span>
            <strong>{demoSessions.length}</strong>
          </article>
          <article>
            <span>Permissions</span>
            <strong>{permissions.length}</strong>
          </article>
          <article>
            <span>Entreprises</span>
            <strong>{tenants.length}</strong>
          </article>
          <article>
            <span>Regles isolation</span>
            <strong>{tenantIsolationRules.length}</strong>
          </article>
        </section>

        <AccessControlSimulator sessions={demoSessions} tenants={tenants} permissions={permissions} />
        <div style={{ marginTop: 24 }}>
          <PermissionsMatrixPanel />
        </div>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2>Regles de cloisonnement</h2>
              <p>Principes appliques aux donnees, exports, roles et preferences.</p>
            </div>
          </div>
          <div className="ruleGrid">
            {tenantIsolationRules.map((rule) => (
              <span key={rule}>{rule}</span>
            ))}
          </div>
        </section>
      </section>
      </AccessGate>
    </main>
  );
}
