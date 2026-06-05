import { requirePermission } from "@/lib/api-auth";
import { getThresholds, toggleThreshold, updateThreshold } from "@/lib/alert-engine";

export async function GET(request: Request) {
  const auth = requirePermission(request, "module:view");
  if (auth.response) return auth.response;
  return Response.json({ thresholds: getThresholds() });
}

export async function PATCH(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;

  const body = await request.json() as { id: string; action?: "toggle"; threshold?: number; severity?: string; enabled?: boolean };

  if (body.action === "toggle") {
    const updated = toggleThreshold(body.id);
    if (!updated) return Response.json({ error: "Seuil introuvable" }, { status: 404 });
    return Response.json({ threshold: updated });
  }

  const updated = updateThreshold(body.id, {
    ...(body.threshold !== undefined ? { threshold: body.threshold } : {}),
    ...(body.severity !== undefined ? { severity: body.severity as "Critique" | "Haute" | "Moyenne" } : {}),
    ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
  });

  if (!updated) return Response.json({ error: "Seuil introuvable" }, { status: 404 });
  return Response.json({ threshold: updated });
}
