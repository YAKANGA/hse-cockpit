"use client";

import { useEffect, useMemo, useState } from "react";
import { modules } from "@/lib/hse-data";
import { tenants } from "@/lib/tenant-data";

export function TenantModuleMenu() {
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === tenantId) ?? tenants[0],
    [tenantId],
  );
  const activeModules = useMemo(() => {
    const activeModuleIds = new Set(selectedTenant?.modules ?? []);
    return modules.filter((module) => activeModuleIds.has(module.id));
  }, [selectedTenant]);

  useEffect(() => {
    const storedTenantId = window.localStorage.getItem("hse-active-tenant");
    if (storedTenantId && tenants.some((tenant) => tenant.id === storedTenantId)) {
      setTenantId(storedTenantId);
    }

    function handleTenantChange(event: Event) {
      const nextTenantId = event instanceof CustomEvent
        ? String(event.detail)
        : window.localStorage.getItem("hse-active-tenant") ?? "";
      if (nextTenantId && tenants.some((tenant) => tenant.id === nextTenantId)) {
        setTenantId(nextTenantId);
      }
    }

    window.addEventListener("hse-active-tenant-change", handleTenantChange);
    window.addEventListener("storage", handleTenantChange);

    return () => {
      window.removeEventListener("hse-active-tenant-change", handleTenantChange);
      window.removeEventListener("storage", handleTenantChange);
    };
  }, []);

  return (
    <div className="submenu">
      {activeModules.map((module) => {
        const Icon = module.icon;
        return (
          <a href={`/modules/${module.id}?tenantId=${selectedTenant.id}`} key={module.id}>
            <Icon size={15} />
            {module.shortName}
          </a>
        );
      })}
      <span className="submenuHint">{activeModules.length} module(s) actifs pour {selectedTenant.name}</span>
    </div>
  );
}
