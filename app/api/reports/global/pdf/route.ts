import { getSessionFromRequest, requirePermission } from "@/lib/api-auth";
import { generateGlobalReportPdf, generateTenantReportPdf } from "@/lib/hse-file-generators";

export async function GET(request: Request) {
  const authorization = requirePermission(request, "module:export");
  if (authorization.response) {
    return authorization.response;
  }

  const session = getSessionFromRequest(request);
  const report = session.tenantId
    ? await generateTenantReportPdf(session.tenantId)
    : await generateGlobalReportPdf();

  if (!report) {
    return Response.json({ error: "Entreprise introuvable" }, { status: 404 });
  }

  return new Response(new Uint8Array(report), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${session.tenantId ? `rapport_entreprise_${session.tenantId}` : "rapport_global_hse"}.pdf"`,
    },
  });
}
