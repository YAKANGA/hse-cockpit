import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

type EmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[EMAIL DEV] To: ${opts.to} | Subject: ${opts.subject}`);
    }
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"HSE Cockpit" <noreply@hse.ci>`,
      to:   Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? opts.subject,
    });
    return true;
  } catch (err) {
    console.error("[EMAIL] Echec envoi:", err);
    return false;
  }
}

// ─── Templates métier ────────────────────────────────────────

export function emailAccidentGrave(data: {
  site: string;
  description: string;
  gravite: string;
  date: string;
  responsable: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <div style="background:#dc2626;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:20px">⚠️ ALERTE ACCIDENT GRAVE — HSE Cockpit</h1>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;width:130px">Site</td><td style="font-weight:600">${data.site}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Date</td><td>${data.date}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Gravité</td><td style="color:#dc2626;font-weight:700">${data.gravite}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Description</td><td>${data.description}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Responsable</td><td>${data.responsable}</td></tr>
        </table>
        <div style="margin-top:20px;padding:12px;background:#fef2f2;border-radius:6px;font-size:14px;color:#991b1b">
          <strong>Action requise immédiatement :</strong> Déclencher la procédure d'enquête et notifier la direction.
        </div>
        <div style="margin-top:16px">
          <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/modules/events" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Voir dans HSE Cockpit →</a>
        </div>
        <p style="margin-top:20px;font-size:12px;color:#9ca3af">Cet email a été envoyé automatiquement par HSE Cockpit. Ne pas répondre à cet email.</p>
      </div>
    </div>
  `;
}

export function emailActionEnRetard(data: {
  nbActions: number;
  actions: { label: string; responsable: string; echeance: string }[];
}) {
  const rows = data.actions.slice(0, 10).map((a) =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #f3f4f6">${a.label}</td><td style="padding:6px 8px;border-bottom:1px solid #f3f4f6">${a.responsable}</td><td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;color:#dc2626">${a.echeance}</td></tr>`
  ).join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <div style="background:#d97706;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:20px">⏰ ${data.nbActions} actions HSE en retard</h1>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f9fafb"><th style="padding:8px;text-align:left">Action</th><th style="padding:8px;text-align:left">Responsable</th><th style="padding:8px;text-align:left">Échéance</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:16px">
          <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/modules/actions" style="background:#d97706;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Voir les actions →</a>
        </div>
      </div>
    </div>
  `;
}

export function emailImportValide(data: {
  module: string;
  filename: string;
  rows: number;
  author: string;
  errors: number;
}) {
  const ok = data.errors === 0;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <div style="background:${ok ? "#0f766e" : "#dc2626"};color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:18px">${ok ? "✅" : "❌"} Import Excel — ${data.module}</h1>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <p>Fichier : <strong>${data.filename}</strong></p>
        <p>Lignes traitées : <strong>${data.rows}</strong></p>
        <p>Statut : <strong style="color:${ok ? "#0f766e" : "#dc2626"}">${ok ? "Validé" : `${data.errors} erreur(s)`}</strong></p>
        <p style="color:#6b7280">Importé par : ${data.author}</p>
      </div>
    </div>
  `;
}
