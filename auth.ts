import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface User {
    role: import("@/lib/permissions").AppRole;
    tenantId: string | null;
    tenantName: string | null;
    permissions: import("@/lib/permissions").Permission[];
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: import("@/lib/permissions").AppRole;
      tenantId: string | null;
      tenantName: string | null;
      permissions: import("@/lib/permissions").Permission[];
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",        type: "email"    },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Dynamic import keeps native modules out of the Edge bundle.
        // db-auto selects PostgreSQL (DATABASE_URL set) or SQLite automatically.
        const { findUserByEmail } = await import("@/lib/db-auto");
        const { rolePermissions }  = await import("@/lib/permissions");

        const user = await findUserByEmail(String(credentials.email));
        if (!user) return null;

        const valid = await bcrypt.compare(String(credentials.password), user.password);
        if (!valid) return null;

        const role = user.role as import("@/lib/permissions").AppRole;
        return {
          id:          user.id,
          email:       user.email,
          name:        user.name,
          role,
          tenantId:    user.tenant_id,
          tenantName:  user.tenant_name,
          permissions: rolePermissions[role] ?? [],
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
});
