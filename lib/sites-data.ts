import { moduleRecords } from "@/lib/module-records-data";
import { hseAlerts } from "@/lib/alerts-data";

export type SiteKpi = {
  site: string;
  totalRecords: number;
  openItems: number;
  criticalItems: number;
  overdueItems: number;
  closedItems: number;
  conformite: number;
};

export const SITES = ["Abidjan", "Bouake", "San Pedro", "Yamoussoukro"] as const;
export type SiteName = (typeof SITES)[number];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

const TODAY = new Date(2026, 5, 5);

function isOverdue(dueDate: string): boolean {
  return parseDate(dueDate) < TODAY;
}

export function getSiteKpis(): SiteKpi[] {
  return SITES.map((site) => {
    const records = moduleRecords.filter((r) => r.site === site);
    const open = records.filter((r) => r.status === "Ouvert" || r.status === "En cours" || r.status === "A corriger");
    const critical = records.filter((r) => r.priority === "Critique");
    const closed = records.filter((r) => r.status === "Clos" || r.status === "Valide");
    const overdue = open.filter((r) => isOverdue(r.dueDate));
    const conformite = records.length > 0 ? Math.round((closed.length / records.length) * 100) : 0;

    return {
      site,
      totalRecords: records.length,
      openItems: open.length,
      criticalItems: critical.length,
      overdueItems: overdue.length,
      closedItems: closed.length,
      conformite,
    };
  });
}

export type EcheanceItem = {
  id: string;
  label: string;
  site: string;
  owner: string;
  moduleId: string;
  moduleName: string;
  dueDate: string;
  daysLeft: number;
  urgency: "overdue" | "urgent" | "week" | "soon";
  priority: string;
  href: string;
};

function diffDays(dueDate: string): number {
  const due = parseDate(dueDate);
  return Math.floor((due.getTime() - TODAY.getTime()) / 86400000);
}

function classifyUrgency(days: number): "overdue" | "urgent" | "week" | "soon" | null {
  if (days < 0) return "overdue";
  if (days <= 2) return "urgent";
  if (days <= 7) return "week";
  if (days <= 21) return "soon";
  return null;
}

const MODULE_LABELS: Record<string, string> = {
  events: "Evenements",
  inspections: "Inspections",
  permits: "Permis",
  actions: "Actions",
  indicators: "Indicateurs",
  ppe: "EPI",
};

export function getUpcomingEcheances(): EcheanceItem[] {
  const items: EcheanceItem[] = [];

  for (const r of moduleRecords) {
    if (r.status === "Clos" || r.status === "Valide") continue;
    const days = diffDays(r.dueDate);
    const urgency = classifyUrgency(days);
    if (!urgency) continue;

    items.push({
      id: r.id,
      label: r.label,
      site: r.site,
      owner: r.owner,
      moduleId: r.moduleId,
      moduleName: MODULE_LABELS[r.moduleId] ?? r.moduleId,
      dueDate: r.dueDate,
      daysLeft: days,
      urgency,
      priority: r.priority,
      href: `/modules/${r.moduleId}`,
    });
  }

  for (const a of hseAlerts) {
    const days = diffDays(a.dueDate);
    const urgency = classifyUrgency(days);
    if (!urgency) continue;

    items.push({
      id: `alt-${a.id}`,
      label: a.title,
      site: a.site,
      owner: a.owner,
      moduleId: a.moduleId,
      moduleName: a.moduleName,
      dueDate: a.dueDate,
      daysLeft: days,
      urgency,
      priority: a.severity === "Critique" ? "Critique" : a.severity === "Haute" ? "Haute" : "Normale",
      href: "/alerts",
    });
  }

  return items.sort((a, b) => a.daysLeft - b.daysLeft);
}
