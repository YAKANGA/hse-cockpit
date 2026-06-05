import { requirePermission } from "@/lib/api-auth";
import { generateAutoAlerts } from "@/lib/alert-engine";
import { sendAlertEmail, isEmailConfigured } from "@/lib/email-service";

let savedRecipients: string[] = [];

export async function GET(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;
  return Response.json({ recipients: savedRecipients, configured: isEmailConfigured() });
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "tenant:manage-settings");
  if (auth.response) return auth.response;

  const body = await request.json() as { recipients?: string[]; action?: "test" | "send"; tenantId?: string };

  if (body.recipients !== undefined) {
    savedRecipients = body.recipients.filter((e) => e.includes("@"));
    return Response.json({ recipients: savedRecipients });
  }

  if (body.action === "test") {
    const result = await sendAlertEmail(savedRecipients, [
      { title: "Email de test HSE Cockpit", module: "Tous modules", site: "Plateforme", severity: "Info" },
    ]);
    return Response.json(result);
  }

  if (body.action === "send") {
    const tenantId = body.tenantId ?? null;
    const autoAlerts = generateAutoAlerts(tenantId ?? "acme-btp", "ACME BTP");
    if (!autoAlerts.length) {
      return Response.json({ success: false, error: "Aucune alerte active à envoyer" });
    }
    const result = await sendAlertEmail(
      savedRecipients,
      autoAlerts.map((a) => ({ title: a.title, module: a.moduleName, site: a.site, severity: a.severity })),
    );
    return Response.json(result);
  }

  return Response.json({ error: "Action inconnue" }, { status: 400 });
}
