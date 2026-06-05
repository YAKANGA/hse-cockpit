"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { getUpcomingEcheances } from "@/lib/sites-data";
import { SITES } from "@/lib/sites-data";

const URGENCY_LABEL: Record<string, string> = {
  overdue: "En retard",
  urgent: "Urgent (≤2j)",
  week: "Cette semaine",
  soon: "Bientot (≤21j)",
};

const URGENCY_COLOR: Record<string, string> = {
  overdue: "#dc2626",
  urgent: "#ea580c",
  week: "#d97706",
  soon: "#2563eb",
};

const URGENCY_BG: Record<string, string> = {
  overdue: "#fee2e2",
  urgent: "#fff2e8",
  week: "#fef3c7",
  soon: "#eff6ff",
};

export function CalendrierHSE() {
  const [siteFilter, setSiteFilter] = useState("Tous");
  const [moduleFilter, setModuleFilter] = useState("Tous");
  const [urgencyFilter, setUrgencyFilter] = useState("Tous");

  const all = useMemo(() => getUpcomingEcheances(), []);

  const modules = useMemo(() => ["Tous", ...Array.from(new Set(all.map((e) => e.moduleName)))], [all]);

  const filtered = useMemo(() => {
    return all.filter((e) => {
      if (siteFilter !== "Tous" && e.site !== siteFilter) return false;
      if (moduleFilter !== "Tous" && e.moduleName !== moduleFilter) return false;
      if (urgencyFilter !== "Tous" && e.urgency !== urgencyFilter) return false;
      return true;
    });
  }, [all, siteFilter, moduleFilter, urgencyFilter]);

  const overdue  = filtered.filter((e) => e.urgency === "overdue").length;
  const urgent   = filtered.filter((e) => e.urgency === "urgent").length;
  const week     = filtered.filter((e) => e.urgency === "week").length;
  const soon     = filtered.filter((e) => e.urgency === "soon").length;

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>Calendrier HSE — Echéances et alertes</h2>
          <p>
            {overdue > 0 && <span style={{ color: "#dc2626", fontWeight: 600 }}>{overdue} en retard · </span>}
            {urgent > 0 && <span style={{ color: "#ea580c", fontWeight: 600 }}>{urgent} urgent · </span>}
            {week} cette semaine · {soon} bientot
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13 }}
          >
            {["Tous", ...SITES].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13 }}
          >
            {modules.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13 }}
          >
            <option value="Tous">Toutes urgences</option>
            {Object.entries(URGENCY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Bandes urgence */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {(["overdue", "urgent", "week", "soon"] as const).map((u) => {
          const count = all.filter((e) => e.urgency === u).length;
          return (
            <button
              key={u}
              type="button"
              onClick={() => setUrgencyFilter(urgencyFilter === u ? "Tous" : u)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: URGENCY_COLOR[u],
                background: urgencyFilter === u ? URGENCY_BG[u] : "transparent",
                color: URGENCY_COLOR[u],
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {u === "overdue" || u === "urgent" ? <AlertTriangle size={12} /> : <Clock size={12} />}
              {URGENCY_LABEL[u]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
          Aucune echéance correspondant aux filtres sélectionnés.
        </div>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Urgence</th>
                <th>Module</th>
                <th>Element</th>
                <th>Site</th>
                <th>Responsable</th>
                <th>Priorité</th>
                <th>Echeance</th>
                <th>Délai</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: URGENCY_BG[e.urgency],
                        color: URGENCY_COLOR[e.urgency],
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {URGENCY_LABEL[e.urgency]}
                    </span>
                  </td>
                  <td><strong>{e.moduleName}</strong></td>
                  <td style={{ fontSize: 13, maxWidth: 200 }}>{e.label}</td>
                  <td>{e.site}</td>
                  <td>{e.owner}</td>
                  <td>
                    <span className={e.priority === "Critique" ? "status danger" : e.priority === "Haute" ? "status warn" : "status ok"}>
                      {e.priority}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: URGENCY_COLOR[e.urgency], whiteSpace: "nowrap" }}>
                    {e.dueDate}
                  </td>
                  <td style={{ fontSize: 12, color: URGENCY_COLOR[e.urgency], fontWeight: 600 }}>
                    {e.daysLeft < 0 ? `+${Math.abs(e.daysLeft)}j` : `J-${e.daysLeft}`}
                  </td>
                  <td>
                    <a className="secondaryButton" href={e.href} style={{ fontSize: 12, padding: "3px 10px" }}>
                      Voir →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, padding: "0 4px" }}>
        Echéances calculées sur tous les enregistrements ouverts et alertes HSE — horizon 21 jours.
      </p>
    </section>
  );
}
