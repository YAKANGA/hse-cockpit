import { moduleOperationalKpis, modules } from "@/lib/hse-data";
import { getTenantById } from "@/lib/tenant-store";

export function getTenant(tenantId: string) {
  return getTenantById(tenantId);
}

export function getTenantActiveModules(tenantId: string) {
  const tenant = getTenant(tenantId);
  if (!tenant) {
    return [];
  }

  return modules.filter((module) => tenant.modules.includes(module.id));
}

export function getTenantSummary(tenantId: string) {
  const activeModules = getTenantActiveModules(tenantId);
  const activeModuleIds = new Set(activeModules.map((module) => module.id));
  const operational = moduleOperationalKpis.filter((kpi) => activeModuleIds.has(kpi.moduleId));

  return {
    totalRecords: activeModules.reduce((sum, module) => sum + module.records, 0),
    totalImports: activeModules.reduce((sum, module) => sum + module.validatedImports, 0),
    totalOpenItems: activeModules.reduce((sum, module) => sum + module.pendingItems, 0),
    averageCompliance: activeModules.length
      ? Math.round(activeModules.reduce((sum, module) => sum + module.compliance, 0) / activeModules.length)
      : 0,
    totalAlerts: operational.reduce((sum, kpi) => sum + kpi.alertValue, 0),
    modulesAtRisk: activeModules.filter((module) => module.compliance < 80 || module.pendingItems > 25).length,
  };
}
