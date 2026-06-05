"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import type { Tenant } from "@/lib/tenant-data";

type TenantSwitcherProps = {
  tenants: Tenant[];
};

export function TenantSwitcher({ tenants }: TenantSwitcherProps) {
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === tenantId) ?? tenants[0],
    [tenantId, tenants],
  );

  useEffect(() => {
    const storedTenantId = window.localStorage.getItem("hse-active-tenant");
    if (storedTenantId && tenants.some((tenant) => tenant.id === storedTenantId)) {
      setTenantId(storedTenantId);
    }
  }, [tenants]);

  function changeTenant(nextTenantId: string) {
    setTenantId(nextTenantId);
    window.localStorage.setItem("hse-active-tenant", nextTenantId);
    window.dispatchEvent(new CustomEvent("hse-active-tenant-change", { detail: nextTenantId }));
  }

  if (!selectedTenant) {
    return null;
  }

  return (
    <div className="tenantSwitcher">
      <div className="tenantSwitcherHeader">
        <Building2 size={16} />
        <span>Entreprise active</span>
      </div>
      <div className="tenantSwitcherCurrent">
        <span style={{ background: selectedTenant.preferences.primaryColor }}>
          {selectedTenant.preferences.logoText}
        </span>
        <div>
          <strong>{selectedTenant.name}</strong>
          <small>{selectedTenant.modules.length} modules actifs</small>
        </div>
      </div>
      <select value={tenantId} onChange={(event) => changeTenant(event.target.value)}>
        {tenants.map((tenant) => (
          <option value={tenant.id} key={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
      <a className="tenantDashboardLink" href={`/enterprise/${selectedTenant.id}`}>
        Ouvrir dashboard entreprise
      </a>
    </div>
  );
}
