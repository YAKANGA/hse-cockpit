import { getDemoSession, demoSessions, rolePermissions, hasPermission, type Permission, type AppSession, type AppRole } from "@/lib/permissions";
import { getTenant } from "@/lib/tenant-analytics";

export function getSessionFromRequest(request: Request): AppSession {
  const url = new URL(request.url);

  // 1. NextAuth session forwarded by middleware via custom headers
  const role  = request.headers.get("x-user-role") as AppRole | null;
  const email = request.headers.get("x-user-email");
  const id    = request.headers.get("x-user-id");

  if (role && email && id) {
    const demo = demoSessions.find((s) => s.userId === id || s.email === email);
    if (demo) return demo;

    // Real DB user not in demo sessions — build session from headers
    return {
      userId:      id,
      name:        email.split("@")[0] ?? id,
      email,
      tenantId:    null,
      tenantName:  null,
      role,
      permissions: rolePermissions[role] ?? [],
    };
  }

  // 2. Legacy demo header / query param fallback
  const userId = request.headers.get("x-user-id") ?? url.searchParams.get("userId") ?? undefined;
  return getDemoSession(userId);
}

export function requirePermission(request: Request, permission: Permission) {
  const session = getSessionFromRequest(request);

  if (!hasPermission(session, permission)) {
    return {
      session,
      response: Response.json(
        {
          error: "Acces refuse",
          requiredPermission: permission,
          role: session.role,
        },
        { status: 403 },
      ),
    };
  }

  return { session, response: null };
}

export function requireTenantAccess(request: Request, tenantId: string) {
  const session = getSessionFromRequest(request);

  if (session.role === "SUPER_ADMIN" || session.tenantId === tenantId) {
    return { session, response: null };
  }

  return {
    session,
    response: Response.json(
      {
        error: "Acces entreprise refuse",
        requestedTenantId: tenantId,
        sessionTenantId: session.tenantId,
        role: session.role,
      },
      { status: 403 },
    ),
  };
}

export function requireModuleTenantAccess(request: Request, moduleId: string) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");

  if (!tenantId) {
    return { session: getSessionFromRequest(request), response: null };
  }

  const tenantAuthorization = requireTenantAccess(request, tenantId);
  if (tenantAuthorization.response) {
    return tenantAuthorization;
  }

  const tenant = getTenant(tenantId);
  if (!tenant || !tenant.modules.includes(moduleId)) {
    return {
      session: tenantAuthorization.session,
      response: Response.json(
        {
          error: "Module non active pour cette entreprise",
          tenantId,
          moduleId,
        },
        { status: 403 },
      ),
    };
  }

  return tenantAuthorization;
}
