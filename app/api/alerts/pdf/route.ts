import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { generateAlertsReportPdf } from "@/lib/hse-file-generators";

export async function GET(request: Request) {
  const authorization = requirePermission(request, "module:export");
  if (authorization.response) {
    return authorization.response;
  }

  const url = new URL(request.url);
  const requestedTenantId = url.searchParams.get("tenantId");
  const session = getSessionFromRequest(request);
  const tenantId = requestedTenantId ?? session.tenantId;

  if (tenantId) {
    const tenantAuthorization = requireTenantAccess(request, tenantId);
    if (tenantAuthorization.response) {
      return tenantAuthorization.response;
    }
  }

  const report = await generateAlertsReportPdf(tenantId);

  return new Response(new Uint8Array(report), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport_alertes_hse_${tenantId ?? "plateforme"}.pdf"`,
    },
  });
}
