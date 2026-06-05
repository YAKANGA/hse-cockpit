import { AppSidebar } from "@/components/AppSidebar";
import { TenantAuditPage } from "@/components/TenantAuditPage";
import "../../globals.css";

export default function AuditPage() {
  return (
    <main className="appShell">
      <AppSidebar />
      <TenantAuditPage />
    </main>
  );
}
