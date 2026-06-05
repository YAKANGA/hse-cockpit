import { getSessionFromRequest, requirePermission } from "@/lib/api-auth";
import { generateGlobalReportDocx, generateTenantReportDocx } from "@/lib/hse-file-generators";

export async function GET(request: Request) {
  const authorization = requirePermission(request, "module:export");
  if (authorization.response) {
    return authorization.response;
  }

  const session = getSessionFromRequest(request);
  const report = session.tenantId
    ? await generateTenantReportDocx(session.tenantId)
    : await generateGlobalReportDocx();

  if (!report) {
    return Response.json({ error: "Entreprise introuvable" }, { status: 404 });
  }

  return new Response(new Uint8Array(report), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${session.tenantId ? `rapport_entreprise_${session.tenantId}` : "rapport_global_hse"}.docx"`,
    },
  });
}
