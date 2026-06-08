"use client";

import { useMemo } from "react";
import { getPpeSummary, ppeRecords } from "@/lib/ppe-data";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";

export function PpeModuleSection() {
  const globalFilter = useCockpitFilter();
  const activeSites = useMemo(() => getActiveSites(globalFilter), [globalFilter]);
  const { dateDebut, dateFin } = globalFilter;

  const filteredRecords = useMemo(() =>
    ppeRecords.filter((r) =>
      (!activeSites || activeSites.includes(r.site)) &&
      isoDateInRange(r.dateAchat, dateDebut, dateFin)
    ),
  [activeSites, dateDebut, dateFin]);

  const summary = useMemo(() => getPpeSummary(filteredRecords), [filteredRecords]);

  return (
    <section className="sectionBlock">
      <div className="epiGrid">
        <article className="panel epiSummary">
          <div className="epiMetric">
            <span>Stock total</span>
            <strong>{summary.totalStock}</strong>
          </div>
          <div className="epiMetric">
            <span>Attribue</span>
            <strong>{summary.totalAttributed}</strong>
          </div>
          <div className="epiMetric">
            <span>Disponible</span>
            <strong>{summary.totalAvailable}</strong>
          </div>
          <div className="epiMetric">
            <span>Valeur stock</span>
            <strong>{summary.inventoryValue.toLocaleString("fr-FR")} FCFA</strong>
          </div>
        </article>

        <article className="panel epiAlerts">
          <div className="panelHeader">
            <div>
              <h2>Alertes EPI</h2>
              <p>Expiration, disponibilite et coherence des quantites.</p>
            </div>
          </div>
          <div className="alertRows">
            <span><strong>{summary.expired}</strong> expire(s)</span>
            <span><strong>{summary.lowStock}</strong> stock critique</span>
            <span><strong>{summary.expiringSoon}</strong> expiration proche</span>
            <span><strong>{summary.anomalies}</strong> anomalie</span>
          </div>
        </article>
      </div>

      <article className="panel epiTablePanel">
        <div className="panelHeader">
          <div>
            <h2>Registre EPI</h2>
            <p>Inventaire et controles periodiques des EPI et equipements de securite.</p>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Designation</th>
                <th>Categorie</th>
                <th>Stock</th>
                <th>Attribue</th>
                <th>Disponible</th>
                <th>Expiration</th>
                <th>Fournisseur</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item) => (
                <tr key={item.reference}>
                  <td>{item.reference}</td>
                  <td>{item.designation}</td>
                  <td>{item.categorie}</td>
                  <td>{item.quantiteStock}</td>
                  <td>{item.quantiteAttribuee}</td>
                  <td>
                    <span className={item.quantiteDisponible <= 5 ? "status warn" : "status ok"}>
                      {item.quantiteDisponible}
                    </span>
                  </td>
                  <td>{item.dateExpiration}</td>
                  <td>{item.fournisseur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
