import { getImportHistory } from "@/lib/import-store";
import { getImportHistoryFromDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  // Merge persistent DB records with current in-memory session records
  const dbItems = getImportHistoryFromDb(200).map((row) => ({
    id: row.id,
    date: row.created_at.slice(0, 16).replace("T", " "),
    tenant: row.tenant_name,
    entity: row.tenant_name,
    module: row.module_name,
    filename: row.filename,
    rows: row.rows,
    acceptedRows: row.accepted_rows,
    rejectedRows: row.rejected_rows,
    status: row.status,
    author: row.author,
    errors: JSON.parse(row.errors ?? "[]") as string[],
    source: "db" as const,
  }));

  const memItems = getImportHistory().map((i) => ({ ...i, source: "mem" as const }));

  // Deduplicate: prefer DB record if id exists in both
  const dbIds = new Set(dbItems.map((i) => i.id));
  const merged = [
    ...dbItems,
    ...memItems.filter((i) => !dbIds.has(i.id)),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return Response.json({ imports: merged, count: merged.length });
}
