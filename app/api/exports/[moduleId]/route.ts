import * as XLSX from "xlsx";
import { requirePermission, getSessionFromRequest } from "@/lib/api-auth";
import { modules } from "@/lib/hse-data";
import { getModuleRecords } from "@/lib/module-records-data";
import { getIntegratedModuleRecords } from "@/lib/import-store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const authorization = requirePermission(request, "module:export");
  if (authorization.response) return authorization.response;

  const { moduleId } = await params;
  const session = getSessionFromRequest(request);
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId") ?? session.tenantId ?? undefined;

  const module = modules.find((m) => m.id === moduleId);
  if (!module) {
    return Response.json({ error: "Module inconnu" }, { status: 404 });
  }

  const seed     = getModuleRecords(moduleId);
  const imported = getIntegratedModuleRecords(moduleId, tenantId);
  const records  = [...imported, ...seed];

  const rows = records.map((r) => ({
    "ID":           r.id,
    "Module":       r.moduleId,
    "Date":         r.date,
    "Site":         r.site,
    "Entite":       r.entity,
    "Libelle":      r.label,
    "Categorie":    r.category,
    "Responsable":  r.owner,
    "Statut":       r.status,
    "Priorite":     r.priority,
    "Echeance":     r.dueDate,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws["!cols"] = [
    { wch: 24 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 20 },
    { wch: 36 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, module.shortName);

  // Feuille meta
  const metaWs = XLSX.utils.aoa_to_sheet([
    ["Export HSE Cockpit"],
    ["Module",     module.name],
    ["Total lignes", records.length],
    ["Importe le", new Date().toLocaleDateString("fr-FR")],
    ["Utilisateur", session.name],
    ["Entreprise", session.tenantName ?? "Plateforme"],
  ]);
  XLSX.utils.book_append_sheet(wb, metaWs, "Meta");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;
  const filename = `export_${moduleId}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
