"use client";

import { useEffect, useState } from "react";
import { Check, FileText, Loader2, Save } from "lucide-react";

const SCOPES = [
  { id: "global", label: "Rapport global" },
  { id: "events", label: "Module Événements" },
  { id: "inspections", label: "Module Inspections" },
  { id: "permits", label: "Module Permis" },
  { id: "actions", label: "Module Actions" },
  { id: "indicators", label: "Module Indicateurs" },
  { id: "ppe", label: "Module EPI" },
  { id: "environment", label: "Module Environnement" },
];

type Conclusion = { id?: string; scope: string; title: string; body: string };

export function ReportConclusionsPanel() {
  const [conclusions, setConclusions] = useState<Record<string, Conclusion>>(
    Object.fromEntries(SCOPES.map((s) => [s.id, { scope: s.id, title: "", body: "" }]))
  );
  const [activeScope, setActiveScope] = useState("global");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/conclusions")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { conclusions?: Conclusion[] } | null) => {
        if (!data?.conclusions) return;
        const map: Record<string, Conclusion> = { ...conclusions };
        for (const c of data.conclusions) {
          map[c.scope] = c;
        }
        setConclusions(map);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const current = conclusions[activeScope];
    await fetch("/api/admin/conclusions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: activeScope, title: current.title, body: current.body }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const current = conclusions[activeScope];

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>Conclusions &amp; recommandations des rapports</h2>
          <p>Textes personnalisés intégrés dans vos rapports PDF et Word par périmètre.</p>
        </div>
        <button className="primaryButton" onClick={save} disabled={saving} type="button">
          {saving ? <Loader2 size={14} className="spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Enregistré" : "Sauvegarder"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        <aside style={{ width: 200, flexShrink: 0 }}>
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveScope(s.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 12px", border: "none", borderRadius: 8, cursor: "pointer",
                background: activeScope === s.id ? "var(--primary-faint)" : "transparent",
                color: activeScope === s.id ? "var(--primary)" : "var(--ink)",
                fontWeight: activeScope === s.id ? 600 : 400, fontSize: 13, textAlign: "left",
                marginBottom: 2,
              }}
            >
              <FileText size={13} />
              {s.label}
            </button>
          ))}
        </aside>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="loginField">
            <label>Titre de la section conclusions</label>
            <input
              type="text"
              value={current?.title ?? ""}
              onChange={(e) => setConclusions((prev) => ({ ...prev, [activeScope]: { ...prev[activeScope], title: e.target.value } }))}
              placeholder="Ex : Conclusions et recommandations du rapport mensuel"
            />
          </div>
          <div className="loginField">
            <label>Corps du texte (conclusions, recommandations, commentaires)</label>
            <textarea
              value={current?.body ?? ""}
              onChange={(e) => setConclusions((prev) => ({ ...prev, [activeScope]: { ...prev[activeScope], body: e.target.value } }))}
              placeholder="Saisissez ici vos conclusions et recommandations standardisées pour ce périmètre de rapport..."
              rows={10}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--line)", background: "var(--surface)", fontSize: 13, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)" }}>
            Ce texte sera automatiquement intégré dans la section &quot;Conclusions&quot; de vos rapports PDF et Word pour le périmètre sélectionné.
          </p>
        </div>
      </div>
    </section>
  );
}
