import { getAuthorizedAuditScope } from "@/lib/audit-api";
import { generateAuditReportPdf } from "@/lib/hse-file-generators";

export async function GET(request: Request) {
  const { events, tenantId, response } = getAuthorizedAuditScope(request);
  if (response) {
    return response;
  }

  const perimeter = tenantId ?? "plateforme";
  const report = await generateAuditReportPdf(events, perimeter);

  return new Response(new Uint8Array(report), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="journal_audit_${perimeter}.pdf"`,
    },
  });
}
