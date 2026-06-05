import { getAuthorizedAuditScope } from "@/lib/audit-api";
import { generateAuditReportXlsx } from "@/lib/hse-file-generators";

function escapecsv(value: string) {
  return value.includes(",") || value.includes('"') || value.includes("\n")
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

export async function GET(request: Request) {
  const { events, tenantId, response } = getAuthorizedAuditScope(request);
  if (response) return response;

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const perimeter = tenantId ?? "plateforme";

  if (format === "csv") {
    const header = ["Date", "Entreprise", "Acteur", "Action", "Cible", "Niveau"].map(escapecsv).join(",");
    const rows = events.map((e) =>
      [e.date, e.tenant, e.actor, e.action, e.target, e.severity].map(escapecsv).join(","),
    );
    const csv = [header, ...rows].join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="journal_audit_${perimeter}.csv"`,
      },
    });
  }

  const report = generateAuditReportXlsx(events, perimeter);

  return new Response(new Uint8Array(report), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="journal_audit_${perimeter}.xlsx"`,
    },
  });
}
