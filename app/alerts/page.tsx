import { AppSidebar } from "@/components/AppSidebar";
import { TenantAlertsPage } from "@/components/TenantAlertsPage";
import "../globals.css";

export default function AlertsPage() {
  return (
    <main className="appShell">
      <AppSidebar />
      <TenantAlertsPage />
    </main>
  );
}
