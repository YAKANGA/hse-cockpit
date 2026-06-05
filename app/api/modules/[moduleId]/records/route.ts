import { requireModuleTenantAccess } from "@/lib/api-auth";
import { getIntegratedModuleRecords } from "@/lib/import-store";
import { getModuleRecords } from "@/lib/module-records-data";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const authorization = requireModuleTenantAccess(request, moduleId);
  if (authorization.response) {
    return authorization.response;
  }

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");

  // Merge: in-memory (current session) + SQLite (persisted across restarts) + seed data
  const inMemory = getIntegratedModuleRecords(moduleId, tenantId);
  const inMemoryIds = new Set(inMemory.map((r) => r.id));

  let dbRecords: typeof inMemory = [];
  try {
    const { getImportRecordsByModule } = await import("@/lib/db");
    const { rowToModuleRecord } = await import("@/lib/import-store-server");
    const rawRows = getImportRecordsByModule(moduleId, tenantId);
    dbRecords = rawRows
      .map((row, i) => rowToModuleRecord(moduleId, tenantId, row, i))
      .filter((r) => !inMemoryIds.has(r.id));
  } catch {
    // SQLite unavailable — fall back to in-memory only
  }

  const records = [...inMemory, ...dbRecords, ...getModuleRecords(moduleId)];
  return Response.json({ moduleId, records, count: records.length });
}
