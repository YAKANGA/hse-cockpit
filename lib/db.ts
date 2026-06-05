import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "hse.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'VIEWER',
      tenant_id   TEXT,
      tenant_name TEXT,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS import_history (
      id            TEXT PRIMARY KEY,
      tenant_id     TEXT,
      tenant_name   TEXT NOT NULL,
      module_id     TEXT NOT NULL,
      module_name   TEXT NOT NULL,
      filename      TEXT NOT NULL,
      rows          INTEGER NOT NULL DEFAULT 0,
      accepted_rows INTEGER NOT NULL DEFAULT 0,
      rejected_rows INTEGER NOT NULL DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'Valide',
      author        TEXT NOT NULL,
      errors        TEXT NOT NULL DEFAULT '[]',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS import_records (
      id          TEXT PRIMARY KEY,
      import_id   TEXT NOT NULL,
      module_id   TEXT NOT NULL,
      tenant_id   TEXT,
      data        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT,
      user_email  TEXT,
      action      TEXT NOT NULL,
      resource    TEXT,
      details     TEXT,
      ip          TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tenant_modules (
      tenant_id   TEXT NOT NULL,
      module_id   TEXT NOT NULL,
      active      INTEGER NOT NULL DEFAULT 1,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (tenant_id, module_id)
    );

    CREATE TABLE IF NOT EXISTS report_conclusions (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT,
      scope       TEXT NOT NULL DEFAULT 'global',
      title       TEXT NOT NULL DEFAULT '',
      body        TEXT NOT NULL DEFAULT '',
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_import_history_tenant   ON import_history(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_import_history_module   ON import_history(module_id);
    CREATE INDEX IF NOT EXISTS idx_import_records_module   ON import_records(module_id, tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user         ON audit_logs(user_id);
  `);
}

function seedUsers(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
  if (count > 0) return;

  const users = [
    { id: "super-admin",       email: "superadmin@platform.local",  name: "Super Admin",    password: "Admin@2026",    role: "SUPER_ADMIN",  tenant_id: null,       tenant_name: null },
    { id: "tenant-admin-acme", email: "a.kouadio@acme.local",       name: "A. Kouadio",     password: "Acme@2026",     role: "TENANT_ADMIN", tenant_id: "acme-btp", tenant_name: "ACME BTP" },
    { id: "hse-group-acme",    email: "s.traore@acme.local",        name: "S. Traore",      password: "Hse@2026",      role: "HSE_GROUP",    tenant_id: "acme-btp", tenant_name: "ACME BTP" },
    { id: "viewer-medlog",     email: "n.kone@medlog.local",        name: "N. Kone",        password: "Viewer@2026",   role: "VIEWER",       tenant_id: "medlog-ci", tenant_name: "Medlog CI" },
    { id: "import-user-acme",  email: "m.diallo@acme.local",        name: "M. Diallo",      password: "Import@2026",   role: "IMPORT_USER",  tenant_id: "acme-btp", tenant_name: "ACME BTP" },
  ];

  const insert = db.prepare(
    "INSERT INTO users (id, email, name, password, role, tenant_id, tenant_name) VALUES (?,?,?,?,?,?,?)"
  );

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    insert.run(u.id, u.email, u.name, hash, u.role, u.tenant_id, u.tenant_name);
  }
}

export function getDb(): Database.Database {
  if (global.__db) return global.__db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initSchema(db);
  seedUsers(db);

  global.__db = db;
  return db;
}

// ─── User helpers ────────────────────────────────────────────
export type DbUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  tenant_id: string | null;
  tenant_name: string | null;
  active: number;
};

export function findUserByEmail(email: string): DbUser | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM users WHERE email = ? AND active = 1").get(email) as DbUser) ?? null;
}

export function listUsers(): Omit<DbUser, "password">[] {
  const db = getDb();
  return db.prepare("SELECT id, email, name, role, tenant_id, tenant_name, active, created_at FROM users").all() as Omit<DbUser, "password">[];
}

export function createUser(user: { email: string; name: string; password: string; role: string; tenant_id?: string; tenant_name?: string }) {
  const db = getDb();
  const id = `user-${Date.now()}`;
  const hash = bcrypt.hashSync(user.password, 10);
  db.prepare("INSERT INTO users (id, email, name, password, role, tenant_id, tenant_name) VALUES (?,?,?,?,?,?,?)")
    .run(id, user.email, user.name, hash, user.role, user.tenant_id ?? null, user.tenant_name ?? null);
  return id;
}

// ─── Import history helpers ───────────────────────────────────
export type DbImportHistory = {
  id: string;
  tenant_id: string | null;
  tenant_name: string;
  module_id: string;
  module_name: string;
  filename: string;
  rows: number;
  accepted_rows: number;
  rejected_rows: number;
  status: string;
  author: string;
  errors: string;
  created_at: string;
};

export function insertImportHistory(item: Omit<DbImportHistory, "created_at">) {
  const db = getDb();
  db.prepare(`
    INSERT INTO import_history (id, tenant_id, tenant_name, module_id, module_name, filename, rows, accepted_rows, rejected_rows, status, author, errors)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(item.id, item.tenant_id, item.tenant_name, item.module_id, item.module_name, item.filename, item.rows, item.accepted_rows, item.rejected_rows, item.status, item.author, item.errors);
}

export function getImportHistoryFromDb(limit = 100): DbImportHistory[] {
  const db = getDb();
  return db.prepare("SELECT * FROM import_history ORDER BY created_at DESC LIMIT ?").all(limit) as DbImportHistory[];
}

// ─── Audit log helpers ────────────────────────────────────────
export function insertAuditLog(entry: { user_id?: string; user_email?: string; action: string; resource?: string; details?: string; ip?: string }) {
  const db = getDb();
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  db.prepare("INSERT INTO audit_logs (id, user_id, user_email, action, resource, details, ip) VALUES (?,?,?,?,?,?,?)")
    .run(id, entry.user_id ?? null, entry.user_email ?? null, entry.action, entry.resource ?? null, entry.details ?? null, entry.ip ?? null);
}

export function getAuditLogs(limit = 200): (DbImportHistory & { user_email: string; action: string })[] {
  const db = getDb();
  return db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").all(limit) as (DbImportHistory & { user_email: string; action: string })[];
}

// ─── Import records helpers ───────────────────────────────────
export function insertImportRecords(importId: string, moduleId: string, tenantId: string | null, rows: Record<string, unknown>[]) {
  const db = getDb();
  const insert = db.prepare(
    "INSERT OR IGNORE INTO import_records (id, import_id, module_id, tenant_id, data) VALUES (?,?,?,?,?)"
  );
  const insertMany = db.transaction((items: { id: string; data: string }[]) => {
    for (const item of items) {
      insert.run(item.id, importId, moduleId, tenantId, item.data);
    }
  });
  insertMany(
    rows.map((row, i) => ({
      id: `${importId}-r${i}`,
      data: JSON.stringify(row),
    }))
  );
}

export function getImportRecordsByModule(moduleId: string, tenantId?: string | null, limit = 2000): Record<string, unknown>[] {
  const db = getDb();
  const rows = tenantId
    ? db.prepare("SELECT data FROM import_records WHERE module_id = ? AND tenant_id = ? ORDER BY created_at DESC LIMIT ?").all(moduleId, tenantId, limit)
    : db.prepare("SELECT data FROM import_records WHERE module_id = ? ORDER BY created_at DESC LIMIT ?").all(moduleId, limit);
  return (rows as { data: string }[]).map((r) => JSON.parse(r.data) as Record<string, unknown>);
}

// ─── Tenant modules helpers ───────────────────────────────────
export function getTenantModules(tenantId: string): Record<string, boolean> {
  const db = getDb();
  const rows = db.prepare("SELECT module_id, active FROM tenant_modules WHERE tenant_id = ?").all(tenantId) as { module_id: string; active: number }[];
  return Object.fromEntries(rows.map((r) => [r.module_id, r.active === 1]));
}

export function setTenantModuleActive(tenantId: string, moduleId: string, active: boolean) {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO tenant_modules (tenant_id, module_id, active, updated_at) VALUES (?,?,?,datetime('now'))").run(tenantId, moduleId, active ? 1 : 0);
}

// ─── Report conclusions helpers ───────────────────────────────
export type DbReportConclusion = { id: string; tenant_id: string | null; scope: string; title: string; body: string; updated_at: string };

export function getReportConclusions(tenantId: string | null): DbReportConclusion[] {
  const db = getDb();
  return tenantId
    ? db.prepare("SELECT * FROM report_conclusions WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY scope").all(tenantId) as DbReportConclusion[]
    : db.prepare("SELECT * FROM report_conclusions WHERE tenant_id IS NULL ORDER BY scope").all() as DbReportConclusion[];
}

export function upsertReportConclusion(tenantId: string | null, scope: string, title: string, body: string) {
  const db = getDb();
  const id = `concl-${tenantId ?? "global"}-${scope}`;
  db.prepare("INSERT OR REPLACE INTO report_conclusions (id, tenant_id, scope, title, body, updated_at) VALUES (?,?,?,?,?,datetime('now'))").run(id, tenantId, scope, title, body);
  return id;
}

// ─── Admin users helpers (DB-backed) ─────────────────────────
export function listUsersByTenant(tenantId: string): Omit<DbUser, "password">[] {
  const db = getDb();
  return db.prepare("SELECT id, email, name, role, tenant_id, tenant_name, active, created_at FROM users WHERE tenant_id = ?").all(tenantId) as Omit<DbUser, "password">[];
}

export function deactivateUser(userId: string) {
  const db = getDb();
  db.prepare("UPDATE users SET active = 0 WHERE id = ?").run(userId);
}

export function updateUserRole(userId: string, role: string) {
  const db = getDb();
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
}
