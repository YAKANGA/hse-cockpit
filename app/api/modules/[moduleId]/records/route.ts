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
    const { getImportRecordsByModule } = await import("@/lib/db-auto");
    const { rowToModuleRecord } = await import("@/lib/import-store-server");
    const rawRows = await getImportRecordsByModule(moduleId, tenantId);
    dbRecords = rawRows
      .map((row, i) => rowToModuleRecord(moduleId, tenantId, row, i))
      .filter((r) => !inMemoryIds.has(r.id));
  } catch {
    // SQLite unavailable — fall back to in-memory only
  }

  const dbAndMemIds = new Set([...inMemory.map((r) => r.id), ...dbRecords.map((r) => r.id)]);
  const seedRecords = getModuleRecords(moduleId).filter(
    (r) => !dbAndMemIds.has(r.id) && (!tenantId || r.tenantId === tenantId),
  );
  const records = [...inMemory, ...dbRecords, ...seedRecords];
  return Response.json({ moduleId, records, count: records.length });
}
