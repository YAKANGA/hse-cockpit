import { moduleRecords } from "@/lib/module-records-data";
import { hseAlerts } from "@/lib/alerts-data";
import { projects, type Project } from "@/lib/projects-data";
import { dateInRange } from "@/lib/date-utils";

export type SiteKpi = {
  site: string;
  totalRecords: number;
  openItems: number;
  criticalItems: number;
  overdueItems: number;
  closedItems: number;
  conformite: number;
};

export type ProjectKpi = SiteKpi & {
  projectId: string;
  projectName: string;
  projectType: string;
  workforce: number;
  status: string;
  color: string;
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

function computeKpi(records: typeof moduleRecords) {
  const open = records.filter((r) => r.status === "Ouvert" || r.status === "En cours" || r.status === "A corriger");
  const critical = records.filter((r) => r.priority === "Critique");
  const closed = records.filter((r) => r.status === "Clos" || r.status === "Valide");
  const overdue = open.filter((r) => isOverdue(r.dueDate));
  const conformite = records.length > 0 ? Math.round((closed.length / records.length) * 100) : 0;
  return { totalRecords: records.length, openItems: open.length, criticalItems: critical.length, overdueItems: overdue.length, closedItems: closed.length, conformite };
}

export function getSiteKpis(): SiteKpi[] {
  return SITES.map((site) => ({
    site,
    ...computeKpi(moduleRecords.filter((r) => r.site === site)),
  }));
}

export function getProjectKpis(): ProjectKpi[] {
  return projects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    projectType: p.type,
    workforce: p.workforce,
    status: p.status,
    color: p.color,
    site: p.city,
    ...computeKpi(moduleRecords.filter((r) => r.projectId === p.id)),
  }));
}

export function getProjectKpisForCity(city: string): ProjectKpi[] {
  return getProjectKpis().filter((p) => p.site === city);
}

/** KPIs de sites filtrés par ville, projet et/ou plage de dates (sur le champ `date` du record). */
export function getSiteKpisFiltered(
  villes: string[],
  projets: string[],
  dateDebut?: string,
  dateFin?: string,
): SiteKpi[] {
  const hasDateFilter = !!dateDebut || !!dateFin;
  if (!villes.length && !projets.length && !hasDateFilter) return getSiteKpis();

  let sitesToShow: string[];
  if (projets.length > 0) {
    const projectCities = projects.filter((p) => projets.includes(p.id)).map((p) => p.city);
    const uniqueCities = [...new Set(projectCities)];
    sitesToShow = villes.length ? villes.filter((v) => uniqueCities.includes(v)) : uniqueCities;
  } else {
    sitesToShow = villes.length ? villes : [...SITES];
  }

  return sitesToShow.map((site) => {
    const records = moduleRecords.filter((r) => {
      if (r.site !== site) return false;
      if (projets.length && !projets.includes(r.projectId)) return false;
      if (!dateInRange(r.date, dateDebut, dateFin)) return false;
      return true;
    });
    return { site, ...computeKpi(records) };
  });
}

// ── Echéancier ──────────────────────────────────────────────────

export type EcheanceItem = {
  id: string;
  label: string;
  site: string;
  projectId: string;
  projectName: string;
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
  events:       "Evenements",
  inspections:  "Inspections",
  permits:      "Permis",
  actions:      "Actions",
  indicators:   "Indicateurs",
  ppe:          "EPI",
  environment:  "Environnement",
  training:     "Formations",
  causeries:    "Causeries",
  duerp:        "DUERP",
  medical:      "Medical",
  acr:          "ACR",
  consumption:  "Consommations",
  planification:"Planification",
  vbg:          "VBG",
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
      projectId: r.projectId,
      projectName: r.projectName,
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
      projectId: a.projectId,
      projectName: a.projectName,
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
