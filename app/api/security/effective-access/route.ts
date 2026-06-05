import { getSessionFromRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");
  const session = getSessionFromRequest(request);
  const canAccessTenant = tenantId ? session.role === "SUPER_ADMIN" || session.tenantId === tenantId : true;

  return Response.json({
    session,
    requestedTenantId: tenantId,
    canAccessTenant,
  });
}
