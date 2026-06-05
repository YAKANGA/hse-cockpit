import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { getAlertsForTenant, getAlertSummary } from "@/lib/alerts-data";

export async function GET(request: Request) {
  const authorization = requirePermission(request, "module:view");
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

  return Response.json({
    tenantId,
    summary: getAlertSummary(alerts),
    alerts,
  });
}
