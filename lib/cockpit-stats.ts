import { moduleRecords } from "@/lib/module-records-data";
import { modules, siteBreakdown, monthlyTrend } from "@/lib/hse-data";

export type FilteredCockpitStats = {
  totalRecords: number;
  totalOpenItems: number;
  totalImports: number;
  averageCompliance: number;
  criticalCount: number;
  modulesAtRisk: number;
  moduleStats: typeof modules;
  filteredSites: typeof siteBreakdown;
  filteredTrend: typeof monthlyTrend;
  isFiltered: boolean;
};

export function getFilteredCockpitStats(villes: string[], projets: string[]): FilteredCockpitStats {
  const isFiltered = villes.length > 0 || projets.length > 0;

  const filtered = moduleRecords.filter((r) => {
    if (villes.length  && !villes.includes(r.site))      return false;
    if (projets.length && !projets.includes(r.projectId)) return false;
    return true;
  });

  const openStatuses = ["Ouvert", "En cours", "A corriger"];
  const totalRecords   = isFiltered ? filtered.length : modules.reduce((s, m) => s + m.records, 0);
  const totalOpenItems = isFiltered
    ? filtered.filter((r) => openStatuses.includes(r.status)).length
    : modules.reduce((s, m) => s + m.pendingItems, 0);
  const closedCount = filtered.filter((r) => ["Clos", "Valide"].includes(r.status)).length;
  const averageCompliance = isFiltered && filtered.length > 0
    ? Math.round((closedCount / filtered.length) * 100)
    : Math.round(modules.reduce((s, m) => s + m.compliance, 0) / modules.length);
  const criticalCount = isFiltered
    ? filtered.filter((r) => r.priority === "Critique").length
    : modules.reduce((s, m) => s + (m.pendingItems > 10 ? 3 : 0), 0);
  const totalImports = modules.reduce((s, m) => s + m.validatedImports, 0);

  const moduleStats = modules.map((m) => {
    if (!isFiltered) return m;
    const recs = filtered.filter((r) => r.moduleId === m.id);
    if (recs.length === 0) return { ...m, records: 0, pendingItems: 0, compliance: 0 };
    const pending    = recs.filter((r) => openStatuses.includes(r.status)).length;
    const closedMod  = recs.filter((r) => ["Clos", "Valide"].includes(r.status)).length;
    return { ...m, records: recs.length, pendingItems: pending, compliance: Math.round((closedMod / recs.length) * 100) };
  });

  const modulesAtRisk = moduleStats.filter((m) => m.compliance < 80 || m.pendingItems > 25).length;

  const filteredSites = villes.length
    ? siteBreakdown.filter((s) => villes.includes(s.site))
    : siteBreakdown;

  // Scale monthly trend by the cumulative share of selected cities
  let filteredTrend = monthlyTrend;
  if (villes.length && villes.length < siteBreakdown.length) {
    const totalEv  = siteBreakdown.reduce((sum, s) => sum + s.evenements, 0);
    const selEv    = siteBreakdown.filter((s) => villes.includes(s.site)).reduce((sum, s) => sum + s.evenements, 0);
    const factor   = totalEv > 0 ? selEv / totalEv : 1;
    filteredTrend  = monthlyTrend.map((m) => ({
      ...m,
      accidents:   Math.max(0, Math.round(m.accidents   * factor)),
      inspections: Math.max(0, Math.round(m.inspections * factor)),
      actions:     Math.max(0, Math.round(m.actions     * factor)),
      accN1:       Math.max(0, Math.round((m.accN1  ?? m.accidents)   * factor)),
      inspN1:      Math.max(0, Math.round((m.inspN1 ?? m.inspections) * factor)),
      actN1:       Math.max(0, Math.round((m.actN1  ?? m.actions)     * factor)),
    }));
  }

  return { totalRecords, totalOpenItems, totalImports, averageCompliance, criticalCount, modulesAtRisk, moduleStats, filteredSites, filteredTrend, isFiltered };
}
