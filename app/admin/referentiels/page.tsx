import { AccessGate } from "@/components/AccessGate";
import { AppSidebar } from "@/components/AppSidebar";
import { TenantModulesPanel } from "@/components/TenantModulesPanel";
import { referentials } from "@/lib/operations-data";
import "../../globals.css";

export default function ReferentialsPage() {
  const valueCount = referentials.reduce((sum, referential) => sum + referential.values.length, 0);

  return (
    <main className="appShell">
      <AppSidebar />
      <AccessGate anyOf={["tenant:manage-settings"]} label="Referentiels metier">
      <section className="workspace">
        <section className="adminHeader">
          <p className="eyebrow">Administration</p>
          <h1>Referentiels metier</h1>
          <p>Listes de valeurs controlees utilisees par les modeles Excel et les validations serveur.</p>
        </section>

        <section className="adminStats">
          <article>
            <span>Referentiels</span>
            <strong>{referentials.length}</strong>
          </article>
          <article>
            <span>Valeurs controlees</span>
            <strong>{valueCount}</strong>
          </article>
          <article>
            <span>Modules couverts</span>
            <strong>{new Set(referentials.map((item) => item.module)).size}</strong>
          </article>
          <article>
            <span>Derniere mise a jour</span>
            <strong>02/06</strong>
          </article>
        </section>

        <TenantModulesPanel />

        <section className="splitGrid">
          {referentials.map((referential) => (
            <article className="panel" key={referential.id}>
              <div className="panelHeader">
                <div>
                  <h2>{referential.name}</h2>
                  <p>{referential.module} - {referential.owner}</p>
                </div>
                <span className="status ok">{referential.lastUpdate}</span>
              </div>
              <div className="tagList">
                {referential.values.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
      </AccessGate>
    </main>
  );
}
