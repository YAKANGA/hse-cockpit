import { requirePermission } from "@/lib/api-auth";
import {
  createValidationRule,
  deleteValidationRule,
  getValidationRules,
  toggleValidationRule,
  updateValidationRule,
} from "@/lib/validation-rules-store";

export async function GET(request: Request) {
  const auth = requirePermission(request, "module:view");
  if (auth.response) return auth.response;
  return Response.json({ validationRules: getValidationRules() });
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;
  const body = await request.json();
  const rule = createValidationRule({
    module: String(body.module ?? ""),
    field: String(body.field ?? ""),
    rule: String(body.rule ?? ""),
    severity: body.severity ?? "Alerte",
    status: "Active",
  });
  return Response.json({ rule }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;
  const body = await request.json() as { id: string; action?: string; [k: string]: unknown };
  if (body.action === "toggle") {
    const rule = toggleValidationRule(body.id);
    if (!rule) return Response.json({ error: "Regle introuvable" }, { status: 404 });
    return Response.json({ rule });
  }
  const rule = updateValidationRule(body.id, {
    ...(body.module !== undefined ? { module: String(body.module) } : {}),
    ...(body.field !== undefined ? { field: String(body.field) } : {}),
    ...(body.rule !== undefined ? { rule: String(body.rule) } : {}),
    ...(body.severity !== undefined ? { severity: body.severity as "Bloquante" | "Alerte" | "Information" } : {}),
    ...(body.status !== undefined ? { status: body.status as "Active" | "Brouillon" } : {}),
  });
  if (!rule) return Response.json({ error: "Regle introuvable" }, { status: 404 });
  return Response.json({ rule });
}

export async function DELETE(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;
  const { id } = await request.json() as { id: string };
  const deleted = deleteValidationRule(id);
  if (!deleted) return Response.json({ error: "Regle introuvable" }, { status: 404 });
  return Response.json({ success: true });
}
