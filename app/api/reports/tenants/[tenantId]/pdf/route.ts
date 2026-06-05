import { requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { generateTenantReportPdf } from "@/lib/hse-file-generators";

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const authorization = requirePermission(request, "module:export");
  if (authorization.response) {
    return authorization.response;
  }

  const tenantAuthorization = requireTenantAccess(request, tenantId);
  if (tenantAuthorization.response) {
    return tenantAuthorization.response;
  }

  const report = await generateTenantReportPdf(tenantId);

  if (!report) {
    return Response.json({ error: "Entreprise introuvable" }, { status: 404 });
  }

  return new Response(new Uint8Array(report), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport_entreprise_${tenantId}.pdf"`,
    },
  });
}
