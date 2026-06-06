import { getImportHistory } from "@/lib/import-store";
import { apiLimiter, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rl = apiLimiter(getClientIp(request));
  if (!rl.ok) return rateLimitResponse(rl);

  const url   = new URL(request.url);
  const page  = Math.max(1, Number(url.searchParams.get("page")  ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  const moduleFilter = url.searchParams.get("module") ?? "";

  // Merge persistent DB records with current in-memory session records
  let dbItems: {id:string;date:string;tenant:string;entity:string;module:string;filename:string;rows:number;acceptedRows:number;rejectedRows:number;status:string;author:string;errors:string[];source:"db"}[] = [];
  try {
    const { getImportHistoryFromDb } = await import("@/lib/db-auto");
    dbItems = (await getImportHistoryFromDb(500)).map((row) => ({
      id:           row.id,
      date:         row.created_at.slice(0, 16).replace("T", " "),
      tenant:       row.tenant_name,
      entity:       row.tenant_name,
      module:       row.module_name,
      filename:     row.filename,
      rows:         row.rows,
      acceptedRows: row.accepted_rows,
      rejectedRows: row.rejected_rows,
      status:       row.status,
      author:       row.author,
      errors:       JSON.parse(row.errors ?? "[]") as string[],
      source:       "db" as const,
    }));
  } catch { /* DB unavailable */ }

  const memItems = getImportHistory().map((i) => ({ ...i, source: "mem" as const }));

  const dbIds = new Set(dbItems.map((i) => i.id));
  let merged = [
    ...dbItems,
    ...memItems.filter((i) => !dbIds.has(i.id)),
  ].sort((a, b) => b.date.localeCompare(a.date));

  if (moduleFilter) {
    merged = merged.filter((i) => i.module.toLowerCase().includes(moduleFilter.toLowerCase()));
  }

  const total = merged.length;
  const pages = Math.ceil(total / limit);
  const items = merged.slice((page - 1) * limit, page * limit);

  return Response.json({
    imports: items,
    count:   items.length,
    total,
    page,
    pages,
    limit,
  });
}
