// Unified DB client — switches between SQLite (local dev) and Postgres (production)
// Import this file instead of lib/db.ts or lib/db-postgres.ts directly.

const isPostgres = !!process.env.DATABASE_URL?.startsWith("postgresql");

export async function dbFindUserByEmail(email: string) {
  if (isPostgres) {
    const { pgFindUserByEmail } = await import("@/lib/db-postgres");
    return pgFindUserByEmail(email);
  }
  const { findUserByEmail } = await import("@/lib/db");
  return findUserByEmail(email);
}

export async function dbListUsers() {
  if (isPostgres) {
    const { pgListUsers } = await import("@/lib/db-postgres");
    return pgListUsers();
  }
  const { listUsers } = await import("@/lib/db");
  return listUsers();
}

export async function dbCreateUser(user: { email:string; name:string; password:string; role:string; tenant_id?:string|null; tenant_name?:string|null }) {
  if (isPostgres) {
    const { pgCreateUser } = await import("@/lib/db-postgres");
    return pgCreateUser(user);
  }
  const { createUser } = await import("@/lib/db");
  return createUser({ ...user, tenant_id: user.tenant_id ?? undefined, tenant_name: user.tenant_name ?? undefined });
}

export async function dbInsertImportHistory(item: Parameters<typeof import("@/lib/db").insertImportHistory>[0]) {
  if (isPostgres) {
    const { pgInsertImportHistory } = await import("@/lib/db-postgres");
    return pgInsertImportHistory(item);
  }
  const { insertImportHistory } = await import("@/lib/db");
  insertImportHistory(item);
}

export async function dbGetImportHistory(limit = 100) {
  if (isPostgres) {
    const { pgGetImportHistory } = await import("@/lib/db-postgres");
    return pgGetImportHistory(limit);
  }
  const { getImportHistoryFromDb } = await import("@/lib/db");
  return getImportHistoryFromDb(limit);
}

export async function dbInsertAuditLog(entry: { user_id?:string; user_email?:string; action:string; resource?:string; details?:string; ip?:string }) {
  if (isPostgres) {
    const { pgInsertAuditLog } = await import("@/lib/db-postgres");
    return pgInsertAuditLog(entry);
  }
  const { insertAuditLog } = await import("@/lib/db");
  insertAuditLog(entry);
}

export async function dbInit() {
  if (isPostgres) {
    const { initPostgresSchema } = await import("@/lib/db-postgres");
    await initPostgresSchema();
    return;
  }
  const { getDb } = await import("@/lib/db");
  getDb();
}
