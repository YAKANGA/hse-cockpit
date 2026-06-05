"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tenant } from "@/lib/tenant-data";

type TenantBrandProps = {
  tenants: Tenant[];
};

export function TenantBrand({ tenants }: TenantBrandProps) {
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [tenantOverrides, setTenantOverrides] = useState<Record<string, Tenant>>({});
  const selectedTenant = useMemo(
    () => tenantOverrides[tenantId] ?? tenants.find((tenant) => tenant.id === tenantId) ?? tenants[0],
    [tenantId, tenantOverrides, tenants],
  );

  useEffect(() => {
    const storedTenantId = window.localStorage.getItem("hse-active-tenant");
    if (storedTenantId && tenants.some((tenant) => tenant.id === storedTenantId)) {
      setTenantId(storedTenantId);
    }

    function syncTenant(event: Event) {
      const nextTenantId = event instanceof CustomEvent
        ? String(event.detail)
        : window.localStorage.getItem("hse-active-tenant") ?? "";

      if (tenants.some((tenant) => tenant.id === nextTenantId)) {
        setTenantId(nextTenantId);
      }
    }

    function syncTenantConfig(event: Event) {
      const tenant = event instanceof CustomEvent && event.detail?.tenant ? event.detail.tenant as Tenant : null;
      if (!tenant) {
        return;
      }

      setTenantOverrides((current) => ({ ...current, [tenant.id]: tenant }));
    }

    window.addEventListener("hse-active-tenant-change", syncTenant);
    window.addEventListener("hse-tenant-config-change", syncTenantConfig);
    window.addEventListener("storage", syncTenant);

    return () => {
      window.removeEventListener("hse-active-tenant-change", syncTenant);
      window.removeEventListener("hse-tenant-config-change", syncTenantConfig);
      window.removeEventListener("storage", syncTenant);
    };
  }, [tenants]);

  if (!selectedTenant) {
    return (
      <div className="brand">
        <div className="brandMark">HSE</div>
        <div>
          <strong>Cockpit HSE</strong>
          <span>Gouvernance & tableaux de bord</span>
        </div>
      </div>
    );
  }

  return (
    <div className="brand">
      <div className="brandMark tenantBrandMark">{selectedTenant.preferences.logoText}</div>
      <div>
        <strong>{selectedTenant.name}</strong>
        <span>Cockpit HSE - {selectedTenant.preferences.dashboardDensity}</span>
      </div>
    </div>
  );
}
