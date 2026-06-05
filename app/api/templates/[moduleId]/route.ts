import { requireModuleTenantAccess } from "@/lib/api-auth";
import { generateTemplateXlsx } from "@/lib/hse-file-generators";
import { getTemplate } from "@/lib/hse-templates";

export async function GET(request: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const authorization = requireModuleTenantAccess(request, moduleId);
  if (authorization.response) {
    return authorization.response;
  }

  const template = getTemplate(moduleId);

  if (!template) {
    return Response.json({ error: "Module inconnu" }, { status: 404 });
  }

  const workbook = generateTemplateXlsx(template);

  return new Response(new Uint8Array(workbook), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${template.filename}"`,
    },
  });
}
