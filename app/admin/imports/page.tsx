import { AccessGate } from "@/components/AccessGate";
import { AppSidebar } from "@/components/AppSidebar";
import { ImportHistoryExplorer } from "@/components/ImportHistoryExplorer";
import { importHistory } from "@/lib/operations-data";
import "../../globals.css";

export default function ImportHistoryPage() {
  return (
    <main className="appShell">
      <AppSidebar />
      <AccessGate anyOf={["module:import", "tenant:manage-settings"]} label="Historique des imports Excel">
      <section className="workspace">
        <section className="adminHeader">
          <p className="eyebrow">Administration</p>
          <h1>Historique des imports Excel</h1>
          <p>Suivi des fichiers .xlsx importes, controles, rejets et corrections attendues.</p>
        </section>

        <ImportHistoryExplorer imports={importHistory} />
      </section>
      </AccessGate>
    </main>
  );
}
