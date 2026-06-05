import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { getAlertsForTenant } from "@/lib/alerts-data";
import * as XLSX from "xlsx";

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

  const alerts = getAlertsForTenant(tenantId);
  const rows = alerts.map((alert) => ({
    Entreprise: alert.tenantName,
    Module: alert.moduleName,
    Site: alert.site,
    Alerte: alert.title,
    Source: alert.source,
    Severite: alert.severity,
    Statut: alert.status,
    Echeance: alert.dueDate,
    Responsable: alert.owner,
    Recommandation: alert.recommendation,
  }));
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 42 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 64 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Alertes HSE");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="alertes_hse_${tenantId ?? "plateforme"}.xlsx"`,
    },
  });
}
