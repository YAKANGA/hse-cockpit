import { getSessionFromRequest, requirePermission, requireTenantAccess } from "@/lib/api-auth";
import { getAuditEvents } from "@/lib/audit-data";

export function getAuthorizedAuditScope(request: Request) {
  const authorization = requirePermission(request, "audit:view");
  if (authorization.response) {
    return { events: [], tenantId: null, session: authorization.session, response: authorization.response };
  }

  const url = new URL(request.url);
  const session = getSessionFromRequest(request);
  const requestedTenantId = url.searchParams.get("tenantId");
  const tenantId = session.role === "SUPER_ADMIN" ? requestedTenantId : session.tenantId;

  if (requestedTenantId) {
    const tenantAuthorization = requireTenantAccess(request, requestedTenantId);
    if (tenantAuthorization.response) {
      return { events: [], tenantId, session, response: tenantAuthorization.response };
    }
  }

  const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const severity = url.searchParams.get("severity");
  const events = getAuditEvents(tenantId).filter((event) => {
    const matchesSeverity = !severity || severity === "Tous" || event.severity === severity;
    const matchesQuery = query
      ? [event.date, event.tenant, event.actor, event.action, event.target, event.severity]
          .join(" ")
          .toLowerCase()
          .includes(query)
      : true;

    return matchesSeverity && matchesQuery;
  });

  return {
    events,
    tenantId,
    session,
    response: null,
  };
}
