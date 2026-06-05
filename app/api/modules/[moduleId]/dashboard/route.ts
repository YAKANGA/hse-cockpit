import { requireModuleTenantAccess } from "@/lib/api-auth";
import { modules } from "@/lib/hse-data";
import { getIntegratedModuleRecords } from "@/lib/import-store";
import { getPpeCategoryBreakdown, getPpeSummary, ppeRecords } from "@/lib/ppe-data";

export async function GET(request: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const authorization = requireModuleTenantAccess(request, moduleId);
  if (authorization.response) {
    return authorization.response;
  }

  const module = modules.find((item) => item.id === moduleId);
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");
  const integratedRecords = getIntegratedModuleRecords(moduleId, tenantId);

  if (!module) {
    return Response.json({ error: "Module inconnu" }, { status: 404 });
  }

  if (moduleId === "ppe") {
    return Response.json({
      module: {
        id: module.id,
        name: module.name,
        shortName: module.shortName,
      },
      summary: getPpeSummary(),
      categoryBreakdown: getPpeCategoryBreakdown(),
      records: ppeRecords,
    });
  }

  return Response.json({
    module: {
      id: module.id,
      name: module.name,
      shortName: module.shortName,
    },
    summary: {
      records: module.records + integratedRecords.length,
      validatedImports: module.validatedImports + (integratedRecords.length ? 1 : 0),
      pendingItems: module.pendingItems + integratedRecords.filter((record) => record.status !== "Clos" && record.status !== "Valide").length,
      compliance: module.compliance,
      lastImport: integratedRecords[0]?.date ?? module.lastImport,
      integratedRecords: integratedRecords.length,
    },
  });
}
