"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type ModuleState = { id: string; name: string; shortName: string; active: boolean };

export function TenantModulesPanel({ tenantId }: { tenantId?: string }) {
  const [modules, setModules] = useState<ModuleState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const url = tenantId ? `/api/admin/modules?tenantId=${tenantId}` : "/api/admin/modules";
    fetch(url)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { modules?: ModuleState[] } | null) => {
        if (data?.modules) setModules(data.modules);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantId]);

  async function toggle(moduleId: string, current: boolean) {
    setSaving(moduleId);
    const res = await fetch("/api/admin/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, moduleId, active: !current }),
    });
    if (res.ok) {
      setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, active: !current } : m));
    }
    setSaving(null);
  }

  if (loading) return <div className="panel" style={{ padding: 24 }}><Loader2 size={18} className="spin" /> Chargement des modules…</div>;

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>Activation des modules</h2>
          <p>Activez ou désactivez les modules HSE disponibles pour cette entreprise.</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginTop: 8 }}>
        {modules.map((mod) => (
          <div
            key={mod.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 10,
              border: `1.5px solid ${mod.active ? "var(--primary)" : "var(--line)"}`,
              background: mod.active ? "var(--primary-faint)" : "var(--surface)",
              opacity: saving === mod.id ? 0.6 : 1,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{mod.shortName}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{mod.active ? "Actif" : "Inactif"}</div>
            </div>
            <button
              type="button"
              onClick={() => toggle(mod.id, mod.active)}
              disabled={saving === mod.id}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
              aria-label={`${mod.active ? "Désactiver" : "Activer"} ${mod.name}`}
            >
              {saving === mod.id
                ? <Loader2 size={20} className="spin" />
                : mod.active
                  ? <CheckCircle2 size={20} style={{ color: "var(--primary)" }} />
                  : <XCircle size={20} style={{ color: "var(--muted)" }} />
              }
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
