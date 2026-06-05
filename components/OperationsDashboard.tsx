import { Activity, ServerCog } from "lucide-react";
import {
  getOperationsSummary,
  platformIncidents,
  serviceHealth,
  sloMetrics,
  vercelReadiness,
} from "@/lib/operations-monitoring-data";

export function OperationsDashboard() {
  const summary = getOperationsSummary();

  return (
    <section className="workspace">
      <section className="adminHeader superAdminHeader">
        <p className="eyebrow">Super Admin</p>
        <h1>Exploitation, monitoring et readiness Vercel</h1>
        <p>Suivi de la sante applicative, des objectifs de performance, des incidents et des pre-requis de production.</p>
      </section>

      <section className="adminStats">
        <article>
          <span>Services OK</span>
          <strong>{summary.servicesOk}</strong>
        </article>
        <article>
          <span>Services surveilles</span>
          <strong>{summary.servicesWatched}</strong>
        </article>
        <article>
          <span>Latence moyenne</span>
          <strong>{summary.averageLatency} ms</strong>
        </article>
        <article>
          <span>Incidents ouverts</span>
          <strong>{summary.openIncidents}</strong>
        </article>
      </section>

      <section className="splitGrid">
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Sante des services</h2>
              <p>Etat des fonctions applicatives critiques.</p>
            </div>
            <Activity size={22} />
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Cible</th>
                  <th>Latence</th>
                  <th>Erreur</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {serviceHealth.map((service) => (
                  <tr key={service.id}>
                    <td>{service.service}<span>{service.lastCheck}</span></td>
                    <td>{service.target}</td>
                    <td>{service.latencyMs} ms</td>
                    <td>{service.errorRate}</td>
                    <td>
                      <span className={service.status === "OK" ? "status ok" : "status warn"}>{service.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Objectifs SLO</h2>
              <p>Seuils issus du cahier de charge.</p>
            </div>
            <ServerCog size={22} />
          </div>
          <div className="sloGrid">
            {sloMetrics.map((metric) => (
              <article key={metric.id}>
                <span>{metric.label}</span>
                <strong>{metric.current}</strong>
                <small>Cible {metric.target}</small>
                <em className={metric.status === "OK" ? "ok" : "warn"}>{metric.status}</em>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="splitGrid">
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Incidents et controles</h2>
              <p>Evenements d'exploitation a suivre par le Super Admin.</p>
            </div>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Perimetre</th>
                  <th>Synthese</th>
                  <th>Responsable</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {platformIncidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>{incident.date}</td>
                    <td>{incident.scope}</td>
                    <td>{incident.summary}</td>
                    <td>{incident.owner}</td>
                    <td>
                      <span className={incident.status === "Clos" ? "status ok" : "status warn"}>{incident.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Readiness Vercel</h2>
              <p>Points de production a configurer ou surveiller.</p>
            </div>
          </div>
          <div className="readinessList">
            {vercelReadiness.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.area}</strong>
                  <span>{item.requirement}</span>
                  <p>{item.evidence}</p>
                </div>
                <span className={item.status === "Pret" ? "status ok" : "status warn"}>{item.status}</span>
              </article>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
