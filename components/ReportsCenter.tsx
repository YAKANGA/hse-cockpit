"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileDown } from "lucide-react";
import { modules } from "@/lib/hse-data";
import { demoSessions } from "@/lib/permissions";
import { tenants } from "@/lib/tenant-data";

type Period = "mensuel" | "trimestriel" | "annuel";

const PERIOD_LABELS: Record<Period, string> = {
  mensuel: "Mensuel (juin 2026)",
  trimestriel: "Trimestriel (avr–juin 2026)",
  annuel: "Annuel (2026)",
};

const PERIOD_DESC: Record<Period, string> = {
  mensuel: "Donnees du mois de juin 2026",
  trimestriel: "Donnees du 2e trimestre 2026",
  annuel: "Donnees de l'exercice 2026",
};

export function ReportsCenter() {
  const [tenantId, setTenantId] = useState("acme-btp");
  const [userId, setUserId] = useState("tenant-admin-acme");
  const [period, setPeriod] = useState<Period>("mensuel");
  const tenant = useMemo(
    () => tenants.find((item) => item.id === tenantId) ?? tenants[0],
    [tenantId],
  );
  const activeModules = useMemo(() => {
    const activeModuleIds = new Set(tenant.modules);
    return modules.filter((module) => activeModuleIds.has(module.id));
  }, [tenant]);
  const query = `userId=${userId}&period=${period}`;

  useEffect(() => {
    const storedTenantId = window.localStorage.getItem("hse-active-tenant");
    const storedUserId = window.localStorage.getItem("hse-active-user");

    if (storedTenantId && tenants.some((item) => item.id === storedTenantId)) {
      setTenantId(storedTenantId);
    }

    if (storedUserId && demoSessions.some((item) => item.userId === storedUserId)) {
      setUserId(storedUserId);
    }

    function syncContext(event: Event) {
      if (event instanceof CustomEvent && typeof event.detail === "string") {
        if (tenants.some((item) => item.id === event.detail)) {
          setTenantId(event.detail);
        }
        if (demoSessions.some((item) => item.userId === event.detail)) {
          setUserId(event.detail);
        }
      } else {
        const nextTenantId = window.localStorage.getItem("hse-active-tenant");
        const nextUserId = window.localStorage.getItem("hse-active-user");
        if (nextTenantId && tenants.some((item) => item.id === nextTenantId)) {
          setTenantId(nextTenantId);
        }
        if (nextUserId && demoSessions.some((item) => item.userId === nextUserId)) {
          setUserId(nextUserId);
        }
      }
    }

    window.addEventListener("hse-active-tenant-change", syncContext);
    window.addEventListener("hse-active-user-change", syncContext);
    window.addEventListener("storage", syncContext);

    return () => {
      window.removeEventListener("hse-active-tenant-change", syncContext);
      window.removeEventListener("hse-active-user-change", syncContext);
      window.removeEventListener("storage", syncContext);
    };
  }, []);

  return (
    <>
      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="panelHeader">
          <div>
            <h2>Periode des rapports</h2>
            <p>{PERIOD_DESC[period]} — inclus dans l&apos;en-tete de chaque rapport genere.</p>
          </div>
          <div className="periodToggle">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                className={period === p ? "periodBtn active" : "periodBtn"}
                onClick={() => setPeriod(p)}
                type="button"
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "4px 0 8px" }}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <span
              key={p}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                background: period === p ? "var(--brand)" : "var(--hover)",
                color: period === p ? "#fff" : "var(--muted)",
                fontWeight: period === p ? 600 : 400,
              }}
            >
              {PERIOD_LABELS[p]}
            </span>
          ))}
        </div>
      </section>

      <section className="adminStats">
        <article>
          <span>Entreprise active</span>
          <strong>{tenant.preferences.logoText}</strong>
        </article>
        <article>
          <span>Modules exportables</span>
          <strong>{activeModules.length}</strong>
        </article>
        <article>
          <span>Formats</span>
          <strong>3</strong>
        </article>
        <article>
          <span>Generation</span>
          <strong>API</strong>
        </article>
      </section>

      <section className="splitGrid">
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Rapports entreprise</h2>
              <p>Sorties consolidees strictement limitees a {tenant.name}.</p>
            </div>
          </div>
          <div className="reportList">
            <a className="reportItem" href={`/api/reports/tenants/${tenant.id}/docx?${query}`}>
              <span>
                Rapport entreprise Word
                <small>{tenant.name} - {activeModules.length} module(s) actif(s)</small>
              </span>
              <FileDown size={16} />
            </a>
            <a className="reportItem" href={`/api/reports/tenants/${tenant.id}/pdf?${query}`}>
              <span>
                Rapport entreprise PDF
                <small>{tenant.name} - KPI, modules et alertes consolides</small>
              </span>
              <FileDown size={16} />
            </a>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Rapports module</h2>
              <p>Exports par module actif de l'entreprise.</p>
            </div>
          </div>
          <div className="reportList">
            {activeModules.map((module) => (
              <a className="reportItem" href={`/api/reports/modules/${module.id}/pdf?tenantId=${tenant.id}&${query}`} key={module.id}>
                <span>
                  {module.shortName}
                  <small>Rapport PDF module - {tenant.name}</small>
                </span>
                <FileDown size={16} />
              </a>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Modeles Excel par module actif</h2>
            <p>Fichiers .xlsx standards avec dictionnaire et referentiels integres.</p>
          </div>
        </div>
        <div className="reportList twoColumns">
          {activeModules.map((module) => (
            <a className="reportItem" href={`/api/templates/${module.id}?tenantId=${tenant.id}&${query}`} key={module.id}>
              <span>{module.shortName}</span>
              <Download size={16} />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
