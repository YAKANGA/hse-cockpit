"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import type { AlertThreshold } from "@/lib/alert-engine";

const SEV_CLASS: Record<string, string> = {
  Critique: "status danger",
  Haute: "status warn",
  Moyenne: "status ok",
};

export function AlertThresholdsPanel() {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/alerts/thresholds");
    if (res.ok) {
      const data = await res.json();
      setThresholds(data.thresholds ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string) {
    const res = await fetch("/api/alerts/thresholds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle" }),
    });
    if (res.ok) {
      const data = await res.json();
      setThresholds((prev) => prev.map((t) => t.id === id ? data.threshold : t));
    }
  }

  async function saveThreshold(id: string) {
    const val = parseFloat(editValue);
    if (isNaN(val)) return;
    const res = await fetch("/api/alerts/thresholds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, threshold: val }),
    });
    if (res.ok) {
      const data = await res.json();
      setThresholds((prev) => prev.map((t) => t.id === id ? data.threshold : t));
    }
    setEditing(null);
  }

  const active = thresholds.filter((t) => t.enabled).length;

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>Seuils d&apos;alerte automatiques</h2>
          <p>{active} seuil{active !== 1 ? "s" : ""} actif{active !== 1 ? "s" : ""} sur {thresholds.length} — les alertes sont generees automatiquement a chaque depassement.</p>
        </div>
        <button className="secondaryButton" onClick={load} type="button" disabled={loading}>
          <RefreshCw size={15} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
          Actualiser
        </button>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Condition</th>
              <th>Seuil</th>
              <th>Severite</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {thresholds.map((t) => (
              <tr key={t.id} style={{ opacity: t.enabled ? 1 : 0.5 }}>
                <td><strong>{t.moduleName}</strong></td>
                <td style={{ fontSize: 13 }}>{t.label}</td>
                <td>
                  {editing === t.id ? (
                    <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{ width: 64, padding: "2px 6px", borderRadius: 5, border: "1px solid var(--line)" }}
                        autoFocus
                      />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{t.unit}</span>
                      <button className="primaryButton" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => saveThreshold(t.id)} type="button">OK</button>
                      <button className="secondaryButton" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => setEditing(null)} type="button">✕</button>
                    </span>
                  ) : (
                    <button
                      onClick={() => { setEditing(t.id); setEditValue(String(t.threshold)); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                      type="button"
                      title="Cliquer pour modifier"
                    >
                      {t.threshold} <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>{t.unit}</span>
                    </button>
                  )}
                </td>
                <td><span className={SEV_CLASS[t.severity] ?? "status ok"}>{t.severity}</span></td>
                <td>
                  <span className={t.enabled ? "status ok" : "status warn"}>
                    {t.enabled ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td>
                  <button
                    className="secondaryButton"
                    style={{ padding: "3px 10px", gap: 5, fontSize: 12 }}
                    onClick={() => toggle(t.id)}
                    type="button"
                  >
                    {t.enabled
                      ? <><ToggleRight size={14} style={{ color: "#0f766e" }} /> Desactiver</>
                      : <><ToggleLeft size={14} /> Activer</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
