/**
 * Unified async database interface.
 * Selects PostgreSQL when DATABASE_URL is set (Vercel production),
 * falls back to SQLite (better-sqlite3) for local development.
 *
 * Import this module from server-side code instead of db.ts or db-postgres.ts.
 * All functions are async regardless of backend so callers are portable.
 */

import type { DbUser, DbImportHistory, DbReportConclusion } from "@/lib/db";

const usePostgres = !!process.env.DATABASE_URL;

// ─── Bootstrap ───────────────────────────────────────────────────────────────

export async function initDb(): Promise<void> {
  if (usePostgres) {
    const { initPostgresSchema } = await import("@/lib/db-postgres");
    await initPostgresSchema();
  } else {
    const { getDb } = await import("@/lib/db");
    getDb(); // triggers SQLite schema init synchronously
  }
}

// ─── User helpers ─────────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  if (usePostgres) {
    const { pgFindUserByEmail } = await import("@/lib/db-postgres");
    return pgFindUserByEmail(email);
  }
  const { findUserByEmail: sqliteFn } = await import("@/lib/db");
  return sqliteFn(email);
}

export async function listUsers(): Promise<Omit<DbUser, "password">[]> {
  if (usePostgres) {
    const { pgListUsers } = await import("@/lib/db-postgres");
    return pgListUsers();
  }
  const { listUsers: sqliteFn } = await import("@/lib/db");
  return sqliteFn();
}

export async function listUsersByTenant(tenantId: string): Promise<Omit<DbUser, "password">[]> {
  if (usePostgres) {
    const { pgListUsers } = await import("@/lib/db-postgres");
    const all = await pgListUsers();
    return all.filter((u) => u.tenant_id === tenantId);
  }
  const { listUsersByTenant: sqliteFn } = await import("@/lib/db");
  return sqliteFn(tenantId);
}

export async function createUser(user: {
  email: string;
  name: string;
  password: string;
  role: string;
  tenant_id?: string;
  tenant_name?: string;
}): Promise<string> {
  if (usePostgres) {
    const { pgCreateUser } = await import("@/lib/db-postgres");
    return pgCreateUser(user);
  }
  const { createUser: sqliteFn } = await import("@/lib/db");
  return sqliteFn(user);
}

export async function deactivateUser(userId: string): Promise<void> {
  if (usePostgres) {
    const { pgUpdateUser } = await import("@/lib/db-postgres");
    await pgUpdateUser(userId, { active: 0 });
    return;
  }
  const { deactivateUser: sqliteFn } = await import("@/lib/db");
  sqliteFn(userId);
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  if (usePostgres) {
    const { pgUpdateUser } = await import("@/lib/db-postgres");
    await pgUpdateUser(userId, { role });
    return;
  }
  const { updateUserRole: sqliteFn } = await import("@/lib/db");
  sqliteFn(userId, role);
}

// ─── Import history helpers ───────────────────────────────────────────────────

export async function insertImportHistory(item: Omit<DbImportHistory, "created_at">): Promise<void> {
  if (usePostgres) {
    const { pgInsertImportHistory } = await import("@/lib/db-postgres");
    await pgInsertImportHistory(item);
    return;
  }
  const { insertImportHistory: sqliteFn } = await import("@/lib/db");
  sqliteFn(item);
}

export async function getImportHistoryFromDb(limit = 100): Promise<DbImportHistory[]> {
  if (usePostgres) {
    const { pgGetImportHistory } = await import("@/lib/db-postgres");
    return pgGetImportHistory(limit);
  }
  const { getImportHistoryFromDb: sqliteFn } = await import("@/lib/db");
  return sqliteFn(limit);
}

// ─── Audit log helpers ────────────────────────────────────────────────────────

export async function insertAuditLog(entry: {
  user_id?: string;
  user_email?: string;
  action: string;
  resource?: string;
  details?: string;
  ip?: string;
}): Promise<void> {
  if (usePostgres) {
    const { pgInsertAuditLog } = await import("@/lib/db-postgres");
    await pgInsertAuditLog(entry);
    return;
  }
  const { insertAuditLog: sqliteFn } = await import("@/lib/db");
  sqliteFn(entry);
}

export async function getAuditLogs(limit = 200): Promise<Record<string, unknown>[]> {
  if (usePostgres) {
    const sql = (await import("@/lib/db-postgres")).getSql();
    const rows = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ${limit}`;
    return rows as Record<string, unknown>[];
  }
  const { getAuditLogs: sqliteFn } = await import("@/lib/db");
  return sqliteFn(limit) as unknown as Record<string, unknown>[];
}

// ─── Import records helpers ───────────────────────────────────────────────────

export async function insertImportRecords(
  importId: string,
  moduleId: string,
  tenantId: string | null,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (usePostgres) {
    const sql = (await import("@/lib/db-postgres")).getSql();
    for (let i = 0; i < rows.length; i++) {
      const id = `${importId}-r${i}`;
      const data = JSON.stringify(rows[i]);
      await sql`INSERT INTO import_records (id, import_id, module_id, tenant_id, data, created_at)
                VALUES (${id}, ${importId}, ${moduleId}, ${tenantId ?? null}, ${data}, NOW())
                ON CONFLICT DO NOTHING`;
    }
    return;
  }
  const { insertImportRecords: sqliteFn } = await import("@/lib/db");
  sqliteFn(importId, moduleId, tenantId, rows);
}

export async function getImportRecordsByModule(
  moduleId: string,
  tenantId?: string | null,
  limit = 2000,
): Promise<Record<string, unknown>[]> {
  if (usePostgres) {
    const sql = (await import("@/lib/db-postgres")).getSql();
    const rows = tenantId
      ? await sql`SELECT data FROM import_records WHERE module_id=${moduleId} AND tenant_id=${tenantId} ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT data FROM import_records WHERE module_id=${moduleId} ORDER BY created_at DESC LIMIT ${limit}`;
    return (rows as unknown as { data: string }[]).map((r) => JSON.parse(r.data) as Record<string, unknown>);
  }
  const { getImportRecordsByModule: sqliteFn } = await import("@/lib/db");
  return sqliteFn(moduleId, tenantId, limit);
}

// ─── Tenant modules helpers ───────────────────────────────────────────────────

export async function getTenantModules(tenantId: string): Promise<Record<string, boolean>> {
  if (usePostgres) {
    const sql = (await import("@/lib/db-postgres")).getSql();
    const rows = await sql<{ module_id: string; active: number }[]>`
      SELECT module_id, active FROM tenant_modules WHERE tenant_id=${tenantId}
    `;
    return Object.fromEntries(rows.map((r) => [r.module_id, r.active === 1]));
  }
  const { getTenantModules: sqliteFn } = await import("@/lib/db");
  return sqliteFn(tenantId);
}

export async function setTenantModuleActive(tenantId: string, moduleId: string, active: boolean): Promise<void> {
  if (usePostgres) {
    const sql = (await import("@/lib/db-postgres")).getSql();
    await sql`
      INSERT INTO tenant_modules (tenant_id, module_id, active, updated_at)
      VALUES (${tenantId}, ${moduleId}, ${active ? 1 : 0}, NOW())
      ON CONFLICT (tenant_id, module_id) DO UPDATE SET active=EXCLUDED.active, updated_at=NOW()
    `;
    return;
  }
  const { setTenantModuleActive: sqliteFn } = await import("@/lib/db");
  sqliteFn(tenantId, moduleId, active);
}

// ─── Report conclusions helpers ───────────────────────────────────────────────

export async function getReportConclusions(tenantId: string | null): Promise<DbReportConclusion[]> {
  if (usePostgres) {
    const sql = (await import("@/lib/db-postgres")).getSql();
    const rows = tenantId
      ? await sql<DbReportConclusion[]>`SELECT * FROM report_conclusions WHERE tenant_id=${tenantId} OR tenant_id IS NULL ORDER BY scope`
      : await sql<DbReportConclusion[]>`SELECT * FROM report_conclusions WHERE tenant_id IS NULL ORDER BY scope`;
    return rows;
  }
  const { getReportConclusions: sqliteFn } = await import("@/lib/db");
  return sqliteFn(tenantId);
}

export async function upsertReportConclusion(
  tenantId: string | null,
  scope: string,
  title: string,
  body: string,
): Promise<string> {
  if (usePostgres) {
    const sql = (await import("@/lib/db-postgres")).getSql();
    const id = `concl-${tenantId ?? "global"}-${scope}`;
    await sql`
      INSERT INTO report_conclusions (id, tenant_id, scope, title, body, updated_at)
      VALUES (${id}, ${tenantId ?? null}, ${scope}, ${title}, ${body}, NOW())
      ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, body=EXCLUDED.body, updated_at=NOW()
    `;
    return id;
  }
  const { upsertReportConclusion: sqliteFn } = await import("@/lib/db");
  return sqliteFn(tenantId, scope, title, body);
}

export { usePostgres };
