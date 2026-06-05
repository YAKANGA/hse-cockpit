"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import type { ValidationRule } from "@/lib/operations-data";

const MODULES = ["Tous", "EPI", "Evenements", "Inspections", "Permis", "Actions", "Indicateurs"];
const SEVERITIES: ValidationRule["severity"][] = ["Bloquante", "Alerte", "Information"];

const SEV_CLASS: Record<string, string> = {
  Bloquante: "status warn",
  Alerte: "status ok",
  Information: "status ok",
};

const EMPTY_FORM = { module: "EPI", field: "", rule: "", severity: "Alerte" as ValidationRule["severity"] };

export function ValidationRulesManager() {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("Tous");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/validation-rules");
    if (res.ok) {
      const data = await res.json();
      setRules(data.validationRules ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string) {
    const res = await fetch("/api/admin/validation-rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle" }),
    });
    if (res.ok) {
      const data = await res.json();
      setRules((prev) => prev.map((r) => r.id === id ? data.rule : r));
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette règle ?")) return;
    const res = await fetch("/api/admin/validation-rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setRules((prev) => prev.filter((r) => r.id !== id));
  }

  async function create() {
    if (!form.field.trim() || !form.rule.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/validation-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setRules((prev) => [data.rule, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    }
    setSaving(false);
  }

  const displayed = moduleFilter === "Tous" ? rules : rules.filter((r) => r.module === moduleFilter);
  const active = rules.filter((r) => r.status === "Active").length;
  const blocking = rules.filter((r) => r.severity === "Bloquante").length;

  return (
    <>
      <section className="adminStats">
        <article><span>Regles actives</span><strong>{active}</strong></article>
        <article><span>Bloquantes</span><strong>{blocking}</strong></article>
        <article><span>Modules controles</span><strong>{new Set(rules.map((r) => r.module)).size}</strong></article>
        <article><span>Moteur</span><strong style={{ color: "#0f766e" }}>OK</strong></article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Matrice de controle</h2>
            <p>Regles appliquees avant integration definitive — cliquer sur le statut pour activer/desactiver.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13 }}
            >
              {MODULES.map((m) => <option key={m}>{m}</option>)}
            </select>
            <button className="secondaryButton" onClick={load} type="button" disabled={loading}>
              <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
            </button>
            <button className="primaryButton" onClick={() => setShowForm((v) => !v)} type="button">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{ padding: "14px 16px", background: "var(--hover)", borderRadius: 8, margin: "0 0 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--muted)" }}>
              Module
              <select value={form.module} onChange={(e) => setForm((f) => ({ ...f, module: e.target.value }))} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)" }}>
                {MODULES.filter((m) => m !== "Tous").map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--muted)", flex: 1, minWidth: 120 }}>
              Champ
              <input value={form.field} onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))} placeholder="ex: date_expiration" style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--muted)", flex: 2, minWidth: 160 }}>
              Regle
              <input value={form.rule} onChange={(e) => setForm((f) => ({ ...f, rule: e.target.value }))} placeholder="ex: Date obligatoire au format JJ/MM/AAAA" style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--muted)" }}>
              Severite
              <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as ValidationRule["severity"] }))} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)" }}>
                {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <button className="primaryButton" onClick={create} disabled={saving || !form.field.trim() || !form.rule.trim()} type="button">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button className="secondaryButton" onClick={() => setShowForm(false)} type="button">Annuler</button>
          </div>
        )}

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Module</th><th>Champ</th><th>Regle</th><th>Severite</th><th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r) => (
                <tr key={r.id} style={{ opacity: r.status === "Active" ? 1 : 0.5 }}>
                  <td><strong>{r.module}</strong></td>
                  <td><code style={{ fontSize: 12 }}>{r.field}</code></td>
                  <td style={{ fontSize: 13 }}>{r.rule}</td>
                  <td><span className={SEV_CLASS[r.severity] ?? "status ok"}>{r.severity}</span></td>
                  <td>
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: r.status === "Active" ? "#0f766e" : "#94a3b8" }}
                      onClick={() => toggle(r.id)}
                      type="button"
                    >
                      {r.status === "Active"
                        ? <><ToggleRight size={15} /> Active</>
                        : <><ToggleLeft size={15} /> Brouillon</>}
                    </button>
                  </td>
                  <td>
                    <button className="secondaryButton" style={{ padding: "3px 8px" }} onClick={() => remove(r.id)} type="button">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>Aucune regle pour ce filtre</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
