import postgres from "postgres";
import bcrypt from "bcryptjs";
import type { DbUser, DbImportHistory } from "@/lib/db";

// Singleton connection pool — shared across hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

export function getSql() {
  if (global.__pg) return global.__pg;
  const url = process.env.DATABASE_URL!;
  global.__pg = postgres(url, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: process.env.NODE_ENV === "production" ? "require" : false,
  });
  return global.__pg;
}

// ─── Schema init ────────────────────────────────────────────
export async function initPostgresSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'VIEWER',
      tenant_id   TEXT,
      tenant_name TEXT,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
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
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT,
      user_email  TEXT,
      action      TEXT NOT NULL,
      resource    TEXT,
      details     TEXT,
      ip          TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS import_records (
      id          TEXT PRIMARY KEY,
      import_id   TEXT NOT NULL,
      module_id   TEXT NOT NULL,
      tenant_id   TEXT,
      data        TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS tenant_modules (
      tenant_id   TEXT NOT NULL,
      module_id   TEXT NOT NULL,
      active      INTEGER NOT NULL DEFAULT 1,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (tenant_id, module_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS report_conclusions (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT,
      scope       TEXT NOT NULL DEFAULT 'global',
      title       TEXT NOT NULL DEFAULT '',
      body        TEXT NOT NULL DEFAULT '',
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ih_tenant  ON import_history(tenant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ih_module  ON import_history(module_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_al_user    ON audit_logs(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ir_module  ON import_records(module_id, tenant_id)`;
  await seedPostgresUsers(sql);
}

async function seedPostgresUsers(sql: ReturnType<typeof getSql>) {
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM users`;
  if (n > 0) return;

  const users = [
    { id:"super-admin",       email:"superadmin@platform.local", name:"Super Admin",  password:"Admin@2026",  role:"SUPER_ADMIN",  tenant_id:null,       tenant_name:null },
    { id:"tenant-admin-acme", email:"a.kouadio@acme.local",      name:"A. Kouadio",   password:"Acme@2026",   role:"TENANT_ADMIN", tenant_id:"acme-btp", tenant_name:"ACME BTP" },
    { id:"hse-group-acme",    email:"s.traore@acme.local",       name:"S. Traore",    password:"Hse@2026",    role:"HSE_GROUP",    tenant_id:"acme-btp", tenant_name:"ACME BTP" },
    { id:"viewer-medlog",     email:"n.kone@medlog.local",       name:"N. Kone",      password:"Viewer@2026", role:"VIEWER",       tenant_id:"medlog-ci",tenant_name:"Medlog CI" },
    { id:"import-user-acme",  email:"m.diallo@acme.local",       name:"M. Diallo",    password:"Import@2026", role:"IMPORT_USER",  tenant_id:"acme-btp", tenant_name:"ACME BTP" },
  ];
  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    await sql`INSERT INTO users (id,email,name,password,role,tenant_id,tenant_name) VALUES (${u.id},${u.email},${u.name},${hash},${u.role},${u.tenant_id ?? null},${u.tenant_name ?? null}) ON CONFLICT DO NOTHING`;
  }
}

// ─── User helpers ────────────────────────────────────────────
export async function pgFindUserByEmail(email: string): Promise<DbUser | null> {
  const sql = getSql();
  const rows = await sql<DbUser[]>`SELECT * FROM users WHERE email=${email} AND active=1 LIMIT 1`;
  return rows[0] ?? null;
}

export async function pgListUsers(): Promise<Omit<DbUser, "password">[]> {
  const sql = getSql();
  return sql`SELECT id,email,name,role,tenant_id,tenant_name,active,created_at FROM users ORDER BY created_at DESC`;
}

export async function pgCreateUser(user: { email:string; name:string; password:string; role:string; tenant_id?:string|null; tenant_name?:string|null }) {
  const sql  = getSql();
  const id   = `user-${Date.now()}`;
  const hash = bcrypt.hashSync(user.password, 10);
  await sql`INSERT INTO users (id,email,name,password,role,tenant_id,tenant_name) VALUES (${id},${user.email},${user.name},${hash},${user.role},${user.tenant_id ?? null},${user.tenant_name ?? null})`;
  return id;
}

export async function pgUpdateUser(id: string, fields: { name?:string; role?:string; active?:number; tenant_id?:string|null; tenant_name?:string|null }) {
  const sql = getSql();
  if (fields.name       !== undefined) await sql`UPDATE users SET name=${fields.name}             WHERE id=${id}`;
  if (fields.role       !== undefined) await sql`UPDATE users SET role=${fields.role}             WHERE id=${id}`;
  if (fields.active     !== undefined) await sql`UPDATE users SET active=${fields.active}         WHERE id=${id}`;
  if (fields.tenant_id  !== undefined) await sql`UPDATE users SET tenant_id=${fields.tenant_id}   WHERE id=${id}`;
}

// ─── Import history helpers ───────────────────────────────────
export async function pgInsertImportHistory(item: Omit<DbImportHistory, "created_at">) {
  const sql = getSql();
  await sql`
    INSERT INTO import_history (id,tenant_id,tenant_name,module_id,module_name,filename,rows,accepted_rows,rejected_rows,status,author,errors)
    VALUES (${item.id},${item.tenant_id ?? null},${item.tenant_name},${item.module_id},${item.module_name},${item.filename},${item.rows},${item.accepted_rows},${item.rejected_rows},${item.status},${item.author},${item.errors})
    ON CONFLICT DO NOTHING
  `;
}

export async function pgGetImportHistory(limit = 100): Promise<DbImportHistory[]> {
  const sql = getSql();
  return sql`SELECT * FROM import_history ORDER BY created_at DESC LIMIT ${limit}`;
}

// ─── Audit log helpers ────────────────────────────────────────
export async function pgInsertAuditLog(entry: { user_id?:string; user_email?:string; action:string; resource?:string; details?:string; ip?:string }) {
  const sql = getSql();
  const id  = `audit-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  await sql`INSERT INTO audit_logs (id,user_id,user_email,action,resource,details,ip) VALUES (${id},${entry.user_id??null},${entry.user_email??null},${entry.action},${entry.resource??null},${entry.details??null},${entry.ip??null})`;
}
