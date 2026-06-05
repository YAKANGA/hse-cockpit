import { requireModuleTenantAccess, requirePermission } from "@/lib/api-auth";
import { generateModuleRecordsXlsx } from "@/lib/hse-file-generators";
import { getIntegratedModuleRecords } from "@/lib/import-store";
import { getModuleRecords } from "@/lib/module-records-data";

function escapecsv(value: string) {
  return value.includes(",") || value.includes('"') || value.includes("\n")
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

export async function GET(request: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const authorization = requirePermission(request, "module:export");
  if (authorization.response) return authorization.response;

  const moduleAuthorization = requireModuleTenantAccess(request, moduleId);
  if (moduleAuthorization.response) return moduleAuthorization.response;

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");
  const format = url.searchParams.get("format");
  const records = [...getIntegratedModuleRecords(moduleId, tenantId), ...getModuleRecords(moduleId)];

  if (format === "csv") {
    const header = ["Date", "Site", "Entite", "Element", "Categorie", "Responsable", "Priorite", "Echeance", "Statut"]
      .map(escapecsv).join(",");
    const rows = records.map((r) =>
      [r.date, r.site, r.entity, r.label, r.category, r.owner, r.priority, r.dueDate, r.status]
        .map(escapecsv).join(","),
    );
    return new Response([header, ...rows].join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="donnees_module_${moduleId}.csv"`,
      },
    });
  }

  const workbook = generateModuleRecordsXlsx(moduleId, records);
  if (!workbook) return Response.json({ error: "Module introuvable" }, { status: 404 });

  return new Response(new Uint8Array(workbook), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="donnees_module_${moduleId}.xlsx"`,
    },
  });
}
