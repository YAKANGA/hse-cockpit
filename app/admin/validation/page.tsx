import { AppSidebar } from "@/components/AppSidebar";
import { AccessGate } from "@/components/AccessGate";
import { ValidationRulesManager } from "@/components/ValidationRulesManager";
import "../../globals.css";

export default function ValidationRulesPage() {
  return (
    <main className="appShell">
      <AppSidebar />
      <AccessGate anyOf={["tenant:manage-settings"]} label="Regles de validation des imports">
        <section className="workspace">
          <section className="adminHeader">
            <p className="eyebrow">Administration</p>
            <h1>Regles de validation des imports</h1>
            <p>Controle des structures Excel, formats, doublons, dates, valeurs et coherences metier. Activez, desactivez ou creez des regles sans redeploi.</p>
          </section>
          <ValidationRulesManager />
        </section>
      </AccessGate>
    </main>
  );
}
