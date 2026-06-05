import { requireModuleTenantAccess, requirePermission } from "@/lib/api-auth";
import { generateModuleReportDocx } from "@/lib/hse-file-generators";

export async function GET(request: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const authorization = requirePermission(request, "module:export");
  if (authorization.response) {
    return authorization.response;
  }

  const moduleAuthorization = requireModuleTenantAccess(request, moduleId);
  if (moduleAuthorization.response) {
    return moduleAuthorization.response;
  }

  const report = await generateModuleReportDocx(moduleId);

  if (!report) {
    return Response.json({ error: "Module introuvable" }, { status: 404 });
  }

  return new Response(new Uint8Array(report), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="rapport_module_${moduleId}.docx"`,
    },
  });
}
