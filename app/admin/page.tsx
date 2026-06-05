import { AccessGate } from "@/components/AccessGate";
import { AppSidebar } from "@/components/AppSidebar";
import { TenantAdminWorkspace } from "@/components/TenantAdminWorkspace";
import "../globals.css";

export default function AdminPage() {
  return (
    <main className="appShell">
      <AppSidebar />

      <AccessGate anyOf={["tenant:manage-settings", "tenant:manage-users", "tenant:manage-roles"]} label="Administration entreprise">
      <section className="workspace">
        <TenantAdminWorkspace />
      </section>
      </AccessGate>
    </main>
  );
}
