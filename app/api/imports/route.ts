import { getSessionFromRequest, requireModuleTenantAccess, requirePermission } from "@/lib/api-auth";
import { recordAuditEvent } from "@/lib/audit-data";
import { getTemplate } from "@/lib/hse-templates";
import { modules } from "@/lib/hse-data";
import { recordValidatedImport } from "@/lib/import-store";
import { getTenant } from "@/lib/tenant-analytics";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

type ImportPayload = {
  moduleId?: string;
  rows?: Record<string, unknown>[];
  missingColumns?: string[];
  validationErrors?: string[];
  filename?: string;
};

export async function POST(request: Request) {
  const authorization = requirePermission(request, "module:import");
  if (authorization.response) {
    return authorization.response;
  }

  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("multipart/form-data")
    ? await parseMultipartImport(request)
    : ((await request.json()) as ImportPayload);

  const template = payload.moduleId ? getTemplate(payload.moduleId) : undefined;

  if (!template) {
    return Response.json({ status: "rejected", errors: ["Module inconnu ou absent"] }, { status: 400 });
  }

  const moduleAuthorization = requireModuleTenantAccess(request, template.moduleId);
  if (moduleAuthorization.response) {
    return moduleAuthorization.response;
  }

  const rows = payload.rows ?? [];
  const requiredColumns = template.columns.filter((column) => column.required);
  const rowErrors: string[] = [];
  const structuralErrors: string[] = [
    ...(payload.validationErrors ?? []),
    ...(payload.missingColumns ?? []).map((label) => `Colonne obligatoire absente: ${label}`),
  ];
  const seenReferences = new Set<string>();
  const seenKeys = new Set<string>();
  const MAX_ROW_ERRORS = 50;

  if (!rows.length) {
    structuralErrors.push("Le fichier ne contient aucune ligne de donnees dans la feuille Saisie.");
  }

  rows.forEach((row, index) => {
    if (rowErrors.length >= MAX_ROW_ERRORS) return;

    requiredColumns.forEach((column) => {
      const value = row[column.key];
      if (value === undefined || value === null || value === "") {
        rowErrors.push(`Ligne ${index + 1}: champ obligatoire manquant — ${column.label}`);
      }
    });

    template.columns.forEach((column) => {
      const value = row[column.key];
      if (value === undefined || value === null || value === "") return;

      if (column.type === "liste" && column.values?.length && !column.values.includes(String(value))) {
        rowErrors.push(`Ligne ${index + 1}: valeur non autorisee pour ${column.label} — "${String(value)}" (valeurs: ${column.values.join(", ")})`);
      }
      if (column.type === "nombre" && !isNumericValue(value)) {
        rowErrors.push(`Ligne ${index + 1}: format nombre invalide pour ${column.label} — "${String(value)}"`);
      }
      if (column.type === "date" && !isDateValue(value)) {
        rowErrors.push(`Ligne ${index + 1}: format date invalide pour ${column.label} — "${String(value)}" (attendu JJ/MM/AAAA ou AAAA-MM-JJ)`);
      }
    });

    // Détection de doublons par clé composite (date + site + premier champ requis)
    const dupKey = [
      String(row.date ?? row.mois ?? ""),
      String(row.site ?? ""),
      String(row[requiredColumns[0]?.key ?? ""] ?? ""),
    ].join("|");
    if (dupKey !== "||" && seenKeys.has(dupKey)) {
      rowErrors.push(`Ligne ${index + 1}: doublon detecte — meme date, site et valeur principale qu'une ligne precedente`);
    }
    seenKeys.add(dupKey);

    // Cohérence de dates (debut < fin)
    if (row.date_debut && row.date_fin && isDateValue(row.date_debut) && isDateValue(row.date_fin)) {
      if (String(row.date_debut) > String(row.date_fin)) {
        rowErrors.push(`Ligne ${index + 1}: date de debut posterieure a la date de fin`);
      }
    }

    // Validations croisées par module
    if (template.moduleId === "ppe") validatePpeRow(row, index, rowErrors, seenReferences);
    if (template.moduleId === "inspections") validateInspectionRow(row, index, rowErrors);
    if (template.moduleId === "permits") validatePermitRow(row, index, rowErrors);
    if (template.moduleId === "actions") validateActionRow(row, index, rowErrors);
  });

  if (rowErrors.length >= MAX_ROW_ERRORS) {
    rowErrors.push(`... et d'autres erreurs non affichees. Corrigez les ${MAX_ROW_ERRORS} premieres erreurs puis relancez.`);
  }

  const errors = [...structuralErrors, ...rowErrors];

  const url = new URL(request.url);
  const session = getSessionFromRequest(request);
  const tenantId = url.searchParams.get("tenantId") ?? session.tenantId;
  const tenant = tenantId ? getTenant(tenantId) : null;
  const module = modules.find((item) => item.id === template.moduleId);
  const integration = errors.length
    ? null
    : recordValidatedImport({
        tenantId,
        tenantName: tenant?.name ?? session.tenantName ?? "Plateforme",
        moduleId: template.moduleId,
        moduleName: module?.shortName ?? template.moduleId,
        filename: payload.filename,
        rows,
        author: session.name,
      });

  if (integration) {
    recordAuditEvent({
      tenantId,
      tenant: tenant?.name ?? session.tenantName ?? "Plateforme",
      actor: session.name,
      action: "Import Excel integre",
      target: `${module?.shortName ?? template.moduleId} - ${payload.filename ?? "fichier Excel"}`,
      severity: "Info",
    });

    // Persist to SQLite — dynamic import keeps better-sqlite3 out of client bundles
    try {
      const { insertImportHistory, insertImportRecords } = await import("@/lib/db");
      const importId = integration.historyItem.id;
      insertImportHistory({
        id: importId,
        tenant_id: tenantId,
        tenant_name: tenant?.name ?? session.tenantName ?? "Plateforme",
        module_id: template.moduleId,
        module_name: module?.shortName ?? template.moduleId,
        filename: payload.filename ?? "import.xlsx",
        rows: rows.length,
        accepted_rows: integration.records.length,
        rejected_rows: rows.length - integration.records.length,
        status: "Valide",
        author: session.name,
        errors: "[]",
      });
      insertImportRecords(importId, template.moduleId, tenantId, rows);
    } catch {
      // Non-fatal — in-memory store already updated
    }
  }

  const errorSummary = errors.length
    ? {
        total: errors.length,
        structural: structuralErrors.length,
        rowLevel: rowErrors.length,
        duplicates: rowErrors.filter((e) => e.includes("doublon")).length,
        missingFields: rowErrors.filter((e) => e.includes("obligatoire manquant")).length,
        invalidValues: rowErrors.filter((e) => e.includes("non autorisee") || e.includes("invalide")).length,
      }
    : null;

  return Response.json({
    status: errors.length ? "needs_correction" : "validated",
    moduleId: template.moduleId,
    filename: payload.filename,
    rows: rows.length,
    integratedRows: integration?.records.length ?? 0,
    errors,
    errorSummary,
    nextStep: errors.length
      ? `${errors.length} erreur(s) detectee(s). Corriger le fichier puis relancer l'import.`
      : "Donnees integrees au module. Actualiser la page pour voir les tableaux et exports mis a jour.",
  });
}

async function parseMultipartImport(request: Request): Promise<ImportPayload> {
  const formData = await request.formData();
  const moduleId = String(formData.get("moduleId") ?? "");
  const template = getTemplate(moduleId);
  const file = formData.get("file");

  if (!template || !(file instanceof File)) {
    return { moduleId, rows: [] };
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return {
      moduleId,
      filename: file.name,
      rows: [],
      validationErrors: ["Le fichier doit etre au format .xlsx."],
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames.includes("Saisie") ? "Saisie" : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return { moduleId, filename: file.name, rows: [] };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headerRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false });
  const headers = (headerRows[0] ?? []).map((header) => normalizeHeader(String(header)));
  const labelToKey = new Map(template.columns.map((column) => [normalizeHeader(column.label), column.key]));
  const missingColumns = template.columns
    .filter((column) => column.required)
    .filter((column) => !headers.includes(normalizeHeader(column.label)))
    .map((column) => column.label);

  const rows = rawRows
    .map((rawRow) => {
      const row: Record<string, unknown> = {};
      Object.entries(rawRow).forEach(([label, value]) => {
        const key = labelToKey.get(normalizeHeader(label));
        if (key) {
          row[key] = value instanceof Date ? value.toISOString().slice(0, 10) : value;
        }
      });
      return row;
    })
    .filter((row) => Object.values(row).some((value) => value !== undefined && value !== null && value !== ""));

  return { moduleId, filename: file.name, rows, missingColumns };
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function isNumericValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "string") {
    const normalized = value.replace(/\s/g, "").replace(",", ".");
    return normalized !== "" && Number.isFinite(Number(normalized));
  }

  return false;
}

function isDateValue(value: unknown) {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === "number") {
    return value > 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) || /^\d{2}\/\d{2}\/\d{4}$/.test(normalized);
  }

  return false;
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value.replace(/\s/g, "").replace(",", "."));
  }

  return Number.NaN;
}

function validateInspectionRow(row: Record<string, unknown>, index: number, errors: string[]) {
  const conformite = String(row.conformite ?? "").trim();
  const ecart = String(row.ecart ?? "").trim();
  if (conformite === "Non conforme" && !ecart) {
    errors.push(`Ligne ${index + 1}: champ "ecart" obligatoire quand la conformite est "Non conforme"`);
  }
  const realises = toNumber(row.nb_inspections_realisees);
  const conformes = toNumber(row.nb_conformes);
  if (Number.isFinite(realises) && Number.isFinite(conformes) && conformes > realises) {
    errors.push(`Ligne ${index + 1}: nombre de conformes (${conformes}) superieur aux inspections realisees (${realises})`);
  }
}

function validatePermitRow(row: Record<string, unknown>, index: number, errors: string[]) {
  const debut = String(row.date_debut ?? "").trim();
  const fin = String(row.date_fin ?? "").trim();
  if (debut && fin && isDateValue(debut) && isDateValue(fin) && debut > fin) {
    errors.push(`Ligne ${index + 1}: date de debut du permis posterieure a la date de fin`);
  }
  const validation = String(row.validation_hse ?? "").trim().toLowerCase();
  const statut = String(row.statut ?? "").trim();
  if (validation === "non" && statut === "Actif") {
    errors.push(`Ligne ${index + 1}: permis marque "Actif" sans validation HSE — blocage requis`);
  }
}

function validateActionRow(row: Record<string, unknown>, index: number, errors: string[]) {
  const statut = String(row.statut ?? "").trim();
  const responsable = String(row.responsable ?? "").trim();
  if (statut === "En cours" && !responsable) {
    errors.push(`Ligne ${index + 1}: action "En cours" sans responsable assigne`);
  }
  const echeance = String(row.echeance ?? "").trim();
  if (!echeance && statut !== "Clos") {
    errors.push(`Ligne ${index + 1}: echeance manquante pour une action non cloturee`);
  }
}

function validatePpeRow(row: Record<string, unknown>, index: number, errors: string[], seenReferences: Set<string>) {
  const reference = String(row.reference ?? "").trim();
  if (reference) {
    if (seenReferences.has(reference)) {
      errors.push(`Ligne ${index + 1}: reference EPI en doublon - ${reference}`);
    }
    seenReferences.add(reference);
  }

  const stock = toNumber(row.quantite_stock);
  const attributed = toNumber(row.quantite_attribuee);
  const available = toNumber(row.quantite_disponible);

  if ([stock, attributed, available].every(Number.isFinite)) {
    if (attributed > stock) {
      errors.push(`Ligne ${index + 1}: quantite attribuee superieure au stock.`);
    }

    if (stock - attributed !== available) {
      errors.push(`Ligne ${index + 1}: quantite disponible incoherente. Attendu: ${stock - attributed}.`);
    }
  }
}
