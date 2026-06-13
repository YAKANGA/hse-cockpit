import { moduleRecords } from "@/lib/module-records-data";
import { modules, siteBreakdown, monthlyTrend } from "@/lib/hse-data";
import { dateInRange } from "@/lib/date-utils";

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

export function getFilteredCockpitStats(
  villes: string[],
  projets: string[],
  dateDebut?: string,
  dateFin?: string,
  tenantId?: string,
): FilteredCockpitStats {
  const isFiltered = villes.length > 0 || projets.length > 0 || !!dateDebut || !!dateFin || !!tenantId;

  const filtered = moduleRecords.filter((r) => {
    if (tenantId && r.tenantId !== tenantId)               return false;
    if (villes.length  && !villes.includes(r.site))        return false;
    if (projets.length && !projets.includes(r.projectId))  return false;
    if (!dateInRange(r.date, dateDebut, dateFin))          return false;
    return true;
  });

  const openStatuses = ["Ouvert", "En cours", "A corriger"];
  const totalRecords   = isFiltered ? filtered.length : modules.reduce((s, m) => s + m.records, 0);
  const totalOpenItems = isFiltered
    ? filtered.filter((r) => openStatuses.includes(r.status)).length
    : modules.reduce((s, m) => s + m.pendingItems, 0);
  const closedCount = filtered.filter((r) => ["Clos", "Valide"].includes(r.status)).length;
  const averageCompliance = !isFiltered
    ? Math.round(modules.reduce((s, m) => s + m.compliance, 0) / modules.length)
    : filtered.length > 0
    ? Math.round((closedCount / filtered.length) * 100)
    : 0;
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

  const filteredSites = (() => {
    if (projets.length > 0 || dateDebut || dateFin) {
      const recordSites = [...new Set(filtered.map((r) => r.site))];
      const sitesToShow = villes.length ? villes : recordSites;
      return sitesToShow.map((site) => {
        const siteRecs = filtered.filter((r) => r.site === site);
        const closed = siteRecs.filter((r) => ["Clos", "Valide"].includes(r.status)).length;
        return {
          site,
          conformite: siteRecs.length > 0 ? Math.round((closed / siteRecs.length) * 100) : 0,
          evenements: siteRecs.filter((r) => r.moduleId === "events").length,
        };
      });
    }
    return villes.length ? siteBreakdown.filter((s) => villes.includes(s.site)) : siteBreakdown;
  })();

  const MONTH_ISO: Record<string, string> = {
    "Jan": "01", "Fev": "02", "Mar": "03", "Avr": "04",
    "Mai": "05", "Juin": "06", "Juil": "07", "Aout": "08",
    "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
  };

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

  // Filter trend to months overlapping the selected date range
  if (dateDebut || dateFin) {
    const year = (dateDebut ?? dateFin)!.slice(0, 4);
    filteredTrend = filteredTrend.filter((entry) => {
      const num = MONTH_ISO[entry.month];
      if (!num) return true;
      const monthStart = `${year}-${num}-01`;
      const monthEnd   = `${year}-${num}-31`;
      if (dateFin   && monthStart > dateFin)   return false;
      if (dateDebut && monthEnd   < dateDebut) return false;
      return true;
    });
  }

  return { totalRecords, totalOpenItems, totalImports, averageCompliance, criticalCount, modulesAtRisk, moduleStats, filteredSites, filteredTrend, isFiltered };
}
