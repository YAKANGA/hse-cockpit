"use client";

import { useEffect, useMemo, useState } from "react";
import { AccessGate } from "@/components/AccessGate";
import { AlertsExplorer } from "@/components/AlertsExplorer";
import { AlertThresholdsPanel } from "@/components/AlertThresholdsPanel";
import { EmailNotificationsPanel } from "@/components/EmailNotificationsPanel";
import { getAlertsForTenant } from "@/lib/alerts-data";
import { demoSessions } from "@/lib/permissions";
import { tenants } from "@/lib/tenant-data";

export function TenantAlertsPage() {
  const [tenantId, setTenantId] = useState("acme-btp");
  const [userId, setUserId] = useState("tenant-admin-acme");
  const session = useMemo(
    () => demoSessions.find((item) => item.userId === userId) ?? demoSessions[1] ?? demoSessions[0],
    [userId],
  );
  const effectiveTenantId = session.role === "SUPER_ADMIN" ? tenantId : session.tenantId ?? tenantId;
  const tenant = tenants.find((item) => item.id === effectiveTenantId);
  const alerts = getAlertsForTenant(session.role === "SUPER_ADMIN" ? tenantId : session.tenantId);
  const exportTenantId = session.role === "SUPER_ADMIN" ? tenantId : session.tenantId;
  const exportHref = `/api/alerts/export?userId=${userId}${exportTenantId ? `&tenantId=${exportTenantId}` : ""}`;
  const docxHref = `/api/alerts/docx?userId=${userId}${exportTenantId ? `&tenantId=${exportTenantId}` : ""}`;
  const pdfHref = `/api/alerts/pdf?userId=${userId}${exportTenantId ? `&tenantId=${exportTenantId}` : ""}`;

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
      const detail = event instanceof CustomEvent ? String(event.detail) : "";
      const nextTenantId = detail || (window.localStorage.getItem("hse-active-tenant") ?? "");
      const nextUserId = detail || (window.localStorage.getItem("hse-active-user") ?? "");

      if (tenants.some((item) => item.id === nextTenantId)) {
        setTenantId(nextTenantId);
      }
      if (demoSessions.some((item) => item.userId === nextUserId)) {
        setUserId(nextUserId);
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
    <AccessGate anyOf={["module:view"]} label="Alertes HSE">
      <section className="workspace">
        <section className="adminHeader">
          <p className="eyebrow">Pilotage HSE</p>
          <h1>Centre d'alertes HSE</h1>
          <p>
            Alertes consolidees pour {tenant?.name ?? "l'entreprise active"}: risques critiques,
            echeances proches et actions prioritaires.
          </p>
        </section>
        <AlertsExplorer alerts={alerts} exportHref={exportHref} docxHref={docxHref} pdfHref={pdfHref} />
        <div style={{ marginTop: 24 }}>
          <AlertThresholdsPanel />
        </div>
        <div style={{ marginTop: 18 }}>
          <EmailNotificationsPanel />
        </div>
      </section>
    </AccessGate>
  );
}
