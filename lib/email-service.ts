import nodemailer from "nodemailer";

export type EmailPayload = {
  to: string[];
  subject: string;
  html: string;
  text?: string;
};

export type EmailResult = { success: true; messageId: string } | { success: false; error: string };

function buildAlertHtml(alerts: { title: string; module: string; site: string; severity: string }[]): string {
  const rows = alerts.map((a) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${a.severity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${a.module}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${a.site}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${a.title}</td>
    </tr>`).join("");

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Alertes HSE</title></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:24px;margin:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#0f766e;padding:24px 28px">
      <h1 style="color:#fff;margin:0;font-size:20px">HSE Cockpit — Alertes automatiques</h1>
      <p style="color:#a7f3d0;margin:6px 0 0;font-size:13px">${alerts.length} alerte(s) dépassant les seuils configurés</p>
    </div>
    <div style="padding:24px 28px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px 12px;text-align:left;color:#374151">Sévérité</th>
            <th style="padding:8px 12px;text-align:left;color:#374151">Module</th>
            <th style="padding:8px 12px;text-align:left;color:#374151">Site</th>
            <th style="padding:8px 12px;text-align:left;color:#374151">Alerte</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
      Ce message est généré automatiquement par HSE Cockpit. Ne pas répondre à cet email.
    </div>
  </div>
</body>
</html>`;
}

// ─── SMTP via nodemailer (fonctionne avec Gmail, Outlook, serveur local) ───
export async function sendEmailViaSmtp(payload: EmailPayload): Promise<EmailResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return { success: false, error: "SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS requis dans .env.local)" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `HSE Cockpit <${user}>`,
      to: payload.to.join(", "),
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return { success: true, messageId: info.messageId };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Resend (API managée) ───────────────────────────────────────────────────
export async function sendEmailViaResend(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY manquant" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "HSE Cockpit <noreply@hse-cockpit.ci>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Resend API error ${res.status}: ${err}` };
    }

    const data = await res.json() as { id: string };
    return { success: true, messageId: data.id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── SendGrid (API managée) ────────────────────────────────────────────────
export async function sendEmailViaSendGrid(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return { success: false, error: "SENDGRID_API_KEY manquant" };

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        personalizations: [{ to: payload.to.map((e) => ({ email: e })) }],
        from: { email: process.env.EMAIL_FROM ?? "noreply@hse-cockpit.ci", name: "HSE Cockpit" },
        subject: payload.subject,
        content: [
          { type: "text/html", value: payload.html },
          ...(payload.text ? [{ type: "text/plain", value: payload.text }] : []),
        ],
      }),
    });

    if (!res.ok) {
      return { success: false, error: `SendGrid error ${res.status}` };
    }

    return { success: true, messageId: res.headers.get("X-Message-Id") ?? "sent" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Sélection automatique du fournisseur ─────────────────────────────────
export async function sendAlertEmail(
  recipients: string[],
  alerts: { title: string; module: string; site: string; severity: string }[],
): Promise<EmailResult> {
  if (!recipients.length) return { success: false, error: "Aucun destinataire configuré" };

  const payload: EmailPayload = {
    to: recipients,
    subject: `[HSE Cockpit] ${alerts.length} alerte(s) HSE — action requise`,
    html: buildAlertHtml(alerts),
    text: alerts.map((a) => `[${a.severity}] ${a.module} — ${a.site} : ${a.title}`).join("\n"),
  };

  // Priorité : SMTP local (gratuit) → Resend → SendGrid
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return sendEmailViaSmtp(payload);
  }
  if (process.env.RESEND_API_KEY) return sendEmailViaResend(payload);
  if (process.env.SENDGRID_API_KEY) return sendEmailViaSendGrid(payload);

  return { success: false, error: "Aucun fournisseur email configuré. Ajoutez SMTP_HOST/SMTP_USER/SMTP_PASS dans .env.local" };
}

export function isEmailConfigured(): boolean {
  return !!(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    process.env.RESEND_API_KEY ||
    process.env.SENDGRID_API_KEY
  );
}
