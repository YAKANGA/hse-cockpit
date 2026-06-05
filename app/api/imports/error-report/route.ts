import { requireModuleTenantAccess, requirePermission } from "@/lib/api-auth";
import { getTemplate } from "@/lib/hse-templates";
import * as XLSX from "xlsx";

type ErrorReportPayload = {
  moduleId?: string;
  filename?: string;
  errors?: string[];
};

export async function POST(request: Request) {
  const authorization = requirePermission(request, "module:import");
  if (authorization.response) {
    return authorization.response;
  }

  const payload = (await request.json()) as ErrorReportPayload;
  const template = payload.moduleId ? getTemplate(payload.moduleId) : undefined;

  if (!payload.moduleId || !template) {
    return Response.json({ error: "Module inconnu ou absent" }, { status: 400 });
  }

  const moduleAuthorization = requireModuleTenantAccess(request, payload.moduleId);
  if (moduleAuthorization.response) {
    return moduleAuthorization.response;
  }

  const errors = payload.errors?.length ? payload.errors : ["Aucune erreur transmise."];
  const rows = errors.map((error, index) => ({
    Numero: index + 1,
    Module: payload.moduleId,
    Fichier: payload.filename ?? "Non renseigne",
    Ligne: extractLine(error),
    Champ: extractField(error),
    Erreur: error,
    Action: recommendCorrection(error),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 16 },
    { wch: 34 },
    { wch: 12 },
    { wch: 28 },
    { wch: 70 },
    { wch: 58 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Erreurs import");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rapport_erreurs_${payload.moduleId}.xlsx"`,
    },
  });
}

function extractLine(error: string) {
  const match = error.match(/Ligne\s+(\d+)/i);
  return match?.[1] ?? "Structure";
}

function extractField(error: string) {
  if (error.includes(" - ")) {
    return error.split(" - ").at(-1) ?? "Non precise";
  }

  if (error.includes(":")) {
    return error.split(":").at(-1)?.trim() ?? "Non precise";
  }

  return "Non precise";
}

function recommendCorrection(error: string) {
  const normalized = error.toLowerCase();

  if (normalized.includes("colonne obligatoire absente")) {
    return "Reprendre le modele officiel du module ou restaurer la colonne obligatoire manquante.";
  }

  if (normalized.includes("champ obligatoire manquant")) {
    return "Completer la cellule obligatoire sur la ligne indiquee avant de relancer l'import.";
  }

  if (normalized.includes("valeur non autorisee")) {
    return "Choisir une valeur presente dans la liste autorisee du modele Excel.";
  }

  if (normalized.includes("format nombre invalide")) {
    return "Saisir une valeur numerique sans texte ni symbole non attendu.";
  }

  if (normalized.includes("format date invalide")) {
    return "Utiliser le format date attendu: AAAA-MM-JJ ou JJ/MM/AAAA.";
  }

  if (normalized.includes("doublon")) {
    return "Conserver une seule reference unique ou renommer la reference dupliquee.";
  }

  if (normalized.includes("quantite")) {
    return "Verifier la coherence stock, quantite attribuee et quantite disponible.";
  }

  return "Corriger la donnee signalee puis relancer la validation du fichier.";
}
