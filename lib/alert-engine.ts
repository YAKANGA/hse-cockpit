import type { HseAlert } from "@/lib/alerts-data";
import { hseAlerts } from "@/lib/alerts-data";
import { modules } from "@/lib/hse-data";
import { ppeRecords } from "@/lib/ppe-data";
import { getIntegratedModuleRecords } from "@/lib/import-store";

export type AlertThreshold = {
  id: string;
  moduleId: string;
  moduleName: string;
  condition: "conformite_below" | "stock_below" | "hse_validation_missing" | "actions_overdue" | "tf_above";
  label: string;
  threshold: number;
  unit: string;
  severity: "Critique" | "Haute" | "Moyenne";
  enabled: boolean;
};

const defaultThresholds: AlertThreshold[] = [
  {
    id: "thr-001",
    moduleId: "inspections",
    moduleName: "Inspections",
    condition: "conformite_below",
    label: "Conformite inspections sous seuil",
    threshold: 80,
    unit: "%",
    severity: "Haute",
    enabled: true,
  },
  {
    id: "thr-002",
    moduleId: "actions",
    moduleName: "Actions",
    condition: "conformite_below",
    label: "Conformite actions sous seuil",
    threshold: 75,
    unit: "%",
    severity: "Haute",
    enabled: true,
  },
  {
    id: "thr-003",
    moduleId: "ppe",
    moduleName: "EPI",
    condition: "stock_below",
    label: "Stock EPI en rupture critique",
    threshold: 5,
    unit: "unites",
    severity: "Critique",
    enabled: true,
  },
  {
    id: "thr-004",
    moduleId: "permits",
    moduleName: "Permis",
    condition: "hse_validation_missing",
    label: "Permis dangereux sans validation HSE",
    threshold: 0,
    unit: "permis",
    severity: "Critique",
    enabled: true,
  },
  {
    id: "thr-005",
    moduleId: "actions",
    moduleName: "Actions",
    condition: "actions_overdue",
    label: "Actions critiques en retard",
    threshold: 30,
    unit: "jours",
    severity: "Haute",
    enabled: true,
  },
  {
    id: "thr-006",
    moduleId: "events",
    moduleName: "Evenements",
    condition: "conformite_below",
    label: "Taux cloture evenements insuffisant",
    threshold: 70,
    unit: "%",
    severity: "Moyenne",
    enabled: true,
  },
  {
    id: "thr-007",
    moduleId: "indicators",
    moduleName: "Indicateurs",
    condition: "tf_above",
    label: "Taux de frequence au-dessus de l'objectif",
    threshold: 2.0,
    unit: "TF",
    severity: "Haute",
    enabled: true,
  },
];

let thresholdStore: AlertThreshold[] = [...defaultThresholds];

export function getThresholds(): AlertThreshold[] {
  return thresholdStore.map((t) => ({ ...t }));
}

export function updateThreshold(id: string, patch: Partial<AlertThreshold>): AlertThreshold | null {
  const idx = thresholdStore.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  thresholdStore[idx] = { ...thresholdStore[idx], ...patch };
  return { ...thresholdStore[idx] };
}

export function toggleThreshold(id: string): AlertThreshold | null {
  const thr = thresholdStore.find((t) => t.id === id);
  if (!thr) return null;
  return updateThreshold(id, { enabled: !thr.enabled });
}

const TODAY = new Date("2026-06-05");

function daysDiff(dateStr: string): number {
  const [d, m, y] = dateStr.split("/").map(Number);
  if (!d || !m || !y) return 999;
  const date = new Date(y, m - 1, d);
  return Math.floor((date.getTime() - TODAY.getTime()) / 86_400_000);
}

function makeAlert(
  id: string,
  tenantId: string,
  tenantName: string,
  thr: AlertThreshold,
  title: string,
  recommendation: string,
  site = "Tous sites",
): HseAlert {
  return {
    id,
    tenantId,
    tenantName,
    moduleId: thr.moduleId,
    moduleName: thr.moduleName,
    site,
    title,
    source: `Seuil automatique — ${thr.label}`,
    severity: thr.severity,
    status: "Ouvert",
    dueDate: new Date(TODAY.getTime() + 7 * 86_400_000)
      .toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/\//g, "/"),
    owner: "Responsable HSE",
    recommendation,
  };
}

export function generateAutoAlerts(tenantId: string, tenantName: string): HseAlert[] {
  const enabled = thresholdStore.filter((t) => t.enabled);
  const generated: HseAlert[] = [];
  let counter = 0;

  for (const thr of enabled) {
    const module = modules.find((m) => m.id === thr.moduleId);
    if (!module) continue;

    if (thr.condition === "conformite_below") {
      const importedRecords = getIntegratedModuleRecords(thr.moduleId, tenantId);
      const allRecords = importedRecords.length > 0 ? importedRecords : [];
      const compliance = allRecords.length > 0
        ? Math.round((allRecords.filter((r) => r.status === "Clos" || r.status === "Valide").length / allRecords.length) * 100)
        : module.compliance;

      if (compliance < thr.threshold) {
        generated.push(makeAlert(
          `auto-${tenantId}-${thr.id}-${++counter}`,
          tenantId, tenantName, thr,
          `${thr.moduleName} : conformite ${compliance}% sous le seuil de ${thr.threshold}%`,
          `Analyser les enregistrements non conformes et lancer un plan correctif.`,
        ));
      }
    }

    if (thr.condition === "stock_below") {
      const critical = ppeRecords.filter((r) => r.quantiteDisponible <= thr.threshold);
      if (critical.length > 0) {
        generated.push(makeAlert(
          `auto-${tenantId}-${thr.id}-${++counter}`,
          tenantId, tenantName, thr,
          `${critical.length} EPI avec stock critique (≤ ${thr.threshold} unites)`,
          `Commander en urgence et reverifier les dotations des postes exposes.`,
        ));
      }
    }

    if (thr.condition === "hse_validation_missing") {
      const importedPermits = getIntegratedModuleRecords("permits", tenantId);
      const missing = importedPermits.filter((r) => r.status === "A corriger");
      if (missing.length > 0) {
        generated.push(makeAlert(
          `auto-${tenantId}-${thr.id}-${++counter}`,
          tenantId, tenantName, thr,
          `${missing.length} permis sans validation HSE detecte(s)`,
          `Bloquer l'execution des travaux et obtenir la validation HSE avant reprise.`,
        ));
      }
    }

    if (thr.condition === "actions_overdue") {
      const importedActions = getIntegratedModuleRecords("actions", tenantId);
      const overdue = importedActions.filter((r) => {
        if (r.status === "Clos" || r.status === "Valide") return false;
        if (!r.dueDate) return false;
        const due = new Date(r.dueDate);
        return Math.floor((TODAY.getTime() - due.getTime()) / 86_400_000) > thr.threshold;
      });
      if (overdue.length > 0) {
        generated.push(makeAlert(
          `auto-${tenantId}-${thr.id}-${++counter}`,
          tenantId, tenantName, thr,
          `${overdue.length} action(s) critiques en retard de plus de ${thr.threshold} jours`,
          `Escalader immediatement au responsable HSE de site.`,
        ));
      }
    }

    if (thr.condition === "tf_above") {
      // Approx TF depuis données statiques si pas d'imports indicateurs
      const totalAccidents = 20;
      const totalHeures = 938000;
      const tf = Math.round((totalAccidents * 1_000_000) / totalHeures * 10) / 10;
      if (tf > thr.threshold) {
        generated.push(makeAlert(
          `auto-${tenantId}-${thr.id}-${++counter}`,
          tenantId, tenantName, thr,
          `Taux de frequence ${tf} au-dessus de l'objectif ${thr.threshold}`,
          `Renforcer les actions preventives et analyser les causes des accidents recents.`,
        ));
      }
    }
  }

  return generated;
}

export function getAllAlerts(tenantId?: string | null): HseAlert[] {
  const base = tenantId ? hseAlerts.filter((a) => a.tenantId === tenantId) : hseAlerts;
  if (!tenantId) return base;
  const tenant = { id: tenantId, name: tenantId };
  const auto = generateAutoAlerts(tenantId, tenant.name);
  const existingIds = new Set(base.map((a) => a.id));
  return [...base, ...auto.filter((a) => !existingIds.has(a.id))];
}
