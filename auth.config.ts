import type { NextAuthConfig } from "next-auth";
import type { AppRole, Permission } from "@/lib/permissions";
import { rolePermissions } from "@/lib/permissions";

// Edge-compatible config — NO Node.js native imports (no better-sqlite3, no bcrypt)
// Used by proxy.ts (Edge Runtime) for JWT verification only.
// Full config with Credentials provider lives in auth.ts (Node.js only).

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role        = (user as { role?: AppRole }).role;
        token.tenantId    = (user as { tenantId?: string | null }).tenantId ?? null;
        token.tenantName  = (user as { tenantName?: string | null }).tenantName ?? null;
        token.permissions = (user as { permissions?: Permission[] }).permissions ?? [];
      }
      return token;
    },
    session({ session, token }) {
      const u = session.user as unknown as Record<string, unknown>;
      u.role        = token.role;
      u.tenantId    = token.tenantId;
      u.tenantName  = token.tenantName;
      u.permissions = token.permissions ?? rolePermissions[(token.role as AppRole) ?? "VIEWER"] ?? [];
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
