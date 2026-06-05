"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, Send, Trash2, X } from "lucide-react";

type Status = { success: boolean; error?: string; messageId?: string } | null;

export function EmailNotificationsPanel() {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [configured, setConfigured] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/email")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setRecipients(data.recipients ?? []);
          setConfigured(data.configured ?? false);
        }
      })
      .catch(() => {});
  }, []);

  async function save(newList: string[]) {
    const res = await fetch("/api/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: newList }),
    });
    if (res.ok) setRecipients(newList);
  }

  function addEmail() {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed.includes("@") || recipients.includes(trimmed)) return;
    const updated = [...recipients, trimmed];
    setRecipients(updated);
    setNewEmail("");
    save(updated);
  }

  function removeEmail(email: string) {
    const updated = recipients.filter((e) => e !== email);
    setRecipients(updated);
    save(updated);
  }

  async function trigger(action: "test" | "send") {
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json() as Status;
    setStatus(data);
    setLoading(false);
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>Notifications email — alertes HSE</h2>
          <p>
            Envoyez automatiquement les alertes de seuil dépassé par email.
            {!configured && <span style={{ color: "#d97706", marginLeft: 8, fontSize: 12 }}>⚠ Configurez SMTP_HOST/SMTP_USER/SMTP_PASS (ou RESEND_API_KEY) dans .env.local</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="secondaryButton"
            onClick={() => trigger("test")}
            disabled={loading || !recipients.length}
            type="button"
          >
            <Send size={14} /> Email test
          </button>
          <button
            className="primaryButton"
            onClick={() => trigger("send")}
            disabled={loading || !recipients.length || !configured}
            type="button"
          >
            <Bell size={14} /> Envoyer alertes
          </button>
        </div>
      </div>

      {status && (
        <div className={`importResult ${status.success ? "ok" : "warn"}`} style={{ marginBottom: 14 }}>
          <strong>{status.success ? "Envoyé avec succès" : "Échec d'envoi"}</strong>
          <span>{status.success ? `ID: ${status.messageId}` : status.error}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEmail()}
          placeholder="Ajouter un destinataire (email@exemple.ci)"
          style={{ flex: 1, padding: "7px 12px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13 }}
        />
        <button className="primaryButton" onClick={addEmail} disabled={!newEmail.includes("@")} type="button">
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {recipients.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13, padding: "12px 0" }}>Aucun destinataire configuré.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {recipients.map((email) => (
            <div
              key={email}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: "var(--hover)", border: "1px solid var(--line)", fontSize: 13 }}
            >
              {email}
              <button onClick={() => removeEmail(email)} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 14 }}>
        Compatible SMTP (Gmail, Outlook…), Resend et SendGrid. Priorité : SMTP → Resend → SendGrid. Les alertes correspondent aux seuils actifs ci-dessus.
      </p>
    </section>
  );
}
