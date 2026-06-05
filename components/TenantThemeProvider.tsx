"use client";

import { useEffect } from "react";
import type { Tenant } from "@/lib/tenant-data";

type TenantThemeProviderProps = {
  tenants: Tenant[];
};

function resolveTenant(tenants: Tenant[], tenantId: string | null) {
  return tenants.find((tenant) => tenant.id === tenantId) ?? tenants[0];
}

export function TenantThemeProvider({ tenants }: TenantThemeProviderProps) {
  useEffect(() => {
    function applyTenantTheme(nextTenant?: string | Tenant | null) {
      const storedTenantId = typeof nextTenant === "string"
        ? nextTenant
        : window.localStorage.getItem("hse-active-tenant");
      const tenant = typeof nextTenant === "object" && nextTenant !== null
        ? nextTenant
        : resolveTenant(tenants, storedTenantId);

      if (!tenant) {
        return;
      }

      const root = document.documentElement;
      root.style.setProperty("--primary", tenant.preferences.primaryColor);
      root.style.setProperty("--primary-dark", tenant.preferences.secondaryColor);
      root.dataset.dashboardDensity = tenant.preferences.dashboardDensity;
      root.dataset.activeTenant = tenant.id;
      root.dataset.activeTenantName = tenant.name;
    }

    applyTenantTheme();

    function syncTenantTheme(event: Event) {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const tenant = detail && typeof detail === "object" && "tenant" in detail ? detail.tenant as Tenant : null;
      const nextTenantId = typeof detail === "string" ? detail : window.localStorage.getItem("hse-active-tenant");
      applyTenantTheme(tenant ?? nextTenantId);
    }

    window.addEventListener("hse-active-tenant-change", syncTenantTheme);
    window.addEventListener("hse-tenant-config-change", syncTenantTheme);
    window.addEventListener("storage", syncTenantTheme);

    return () => {
      window.removeEventListener("hse-active-tenant-change", syncTenantTheme);
      window.removeEventListener("hse-tenant-config-change", syncTenantTheme);
      window.removeEventListener("storage", syncTenantTheme);
    };
  }, [tenants]);

  return null;
}
