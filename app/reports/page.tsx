import { AccessGate } from "@/components/AccessGate";
import { AppSidebar } from "@/components/AppSidebar";
import { ReportConclusionsPanel } from "@/components/ReportConclusionsPanel";
import { ReportsCenter } from "@/components/ReportsCenter";
import "../globals.css";

export default function ReportsPage() {
  return (
    <main className="appShell">
      <AppSidebar />
      <AccessGate anyOf={["module:export"]} label="Centre de generation documentaire">
      <section className="workspace">
        <section className="adminHeader">
          <p className="eyebrow">Rapports</p>
          <h1>Centre de generation documentaire</h1>
          <p>Exports Word, PDF et modeles Excel limites a l'entreprise active et a ses modules autorises.</p>
        </section>

        <ReportsCenter />
        <div style={{ marginTop: 24 }}>
          <ReportConclusionsPanel />
        </div>
      </section>
      </AccessGate>
    </main>
  );
}
