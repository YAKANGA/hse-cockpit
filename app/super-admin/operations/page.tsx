import { AccessGate } from "@/components/AccessGate";
import { AppSidebar } from "@/components/AppSidebar";
import { SuperAdminPortBadge } from "@/components/SuperAdminPortBadge";
import { OperationsDashboard } from "@/components/OperationsDashboard";
import "../../globals.css";

export default function SuperAdminOperationsPage() {
  return (
    <main className="appShell">
      <AppSidebar />
      <AccessGate anyOf={["platform:manage-tenants"]} label="Exploitation Super Admin">
        <section className="workspace">
          <SuperAdminPortBadge />
          <OperationsDashboard />
        </section>
      </AccessGate>
    </main>
  );
}
