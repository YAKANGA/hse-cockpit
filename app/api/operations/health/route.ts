import { requirePermission } from "@/lib/api-auth";
import {
  getOperationsSummary,
  platformIncidents,
  serviceHealth,
  sloMetrics,
  vercelReadiness,
} from "@/lib/operations-monitoring-data";

export async function GET(request: Request) {
  const authorization = requirePermission(request, "audit:view");
  if (authorization.response) {
    return authorization.response;
  }

  return Response.json({
    summary: getOperationsSummary(),
    services: serviceHealth,
    slos: sloMetrics,
    incidents: platformIncidents,
    readiness: vercelReadiness,
  });
}
