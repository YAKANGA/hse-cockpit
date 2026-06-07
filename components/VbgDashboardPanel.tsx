"use client";

import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  AlertTriangle, BookOpen, CheckCircle2, ClipboardList,
  FileText, HandshakeIcon, Shield, Users,
} from "lucide-react";
import {
  getVbgBySite, getVbgByType, getVbgFormationBySite, getVbgSummary,
  vbgCodeConduite, vbgFormations, vbgIncidents, vbgPlanAction, vbgPlaintes,
} from "@/lib/vbg-data";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";

const COULEURS_STATUT: Record<string, string> = {
  "Clôturé":         "#16a34a",
  "Résolu":          "#22c55e",
  "En investigation":"#d97706",
  "Signalé":         "#dc2626",
  "Non fondé":       "#94a3b8",
  "Référé":          "#7c3aed",
};

const COULEURS_GRAVITE: Record<string, string> = {
  "Mineur":     "#22c55e",
  "Modéré":     "#d97706",
  "Grave":      "#dc2626",
  "Très grave": "#7f1d1d",
};

const COULEURS_PLAN: Record<string, string> = {
  "Réalisé":   "#16a34a",
  "En cours":  "#d97706",
  "Planifié":  "#2563eb",
  "En retard": "#dc2626",
};

type Tab = "incidents" | "formations" | "plaintes" | "plan" | "code";

export function VbgDashboardPanel() {
  const [tab, setTab] = useState<Tab>("incidents");
  const summary = useMemo(() => getVbgSummary(), []);
  const byType  = useMemo(() => getVbgByType(), []);
  const bySite  = useMemo(() => getVbgBySite(), []);
  const formBySite = useMemo(() => getVbgFormationBySite(), []);
  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);

  const filteredIncidents = useMemo(() =>
    vbgIncidents.filter((i) =>
      (!activeSites || activeSites.includes(i.site)) &&
      isoDateInRange(i.date, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const pieStatut = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncidents.forEach((i) => { map[i.statut] = (map[i.statut] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredIncidents]);

  const planByStatut = useMemo(() => {
    const map: Record<string, number> = {};
    vbgPlanAction.forEach((p) => { map[p.statut] = (map[p.statut] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  return (
    <section className="cockpitBlock">
      {/* ── Normes banner ── */}
      <div style={{ background: "linear-gradient(135deg,#be185d,#9d174d)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <Shield size={20} style={{ color: "#fbcfe8", flexShrink: 0 }} />
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0 }}>Module VBG / EAS / HS — Conformité internationale</p>
          <p style={{ color: "#fbcfe8", fontSize: 11, margin: 0 }}>World Bank ESS2 · ESS4 · IFC PS2 · ILO C190 · WB Good Practice Note on GBV (2018) · UN Women Standards</p>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="kpiGridCompact" style={{ marginBottom: 20 }}>
        {[
          { label: "Incidents signalés", value: summary.total, icon: AlertTriangle, color: "#dc2626", bg: "#fee2e2", sub: `${summary.graves} graves` },
          { label: "En investigation", value: summary.ouverts, icon: ClipboardList, color: "#d97706", bg: "#fef3c7", sub: "Délai cible: 30j (WB)" },
          { label: "Taux formation VBG", value: `${summary.tauxFormation}%`, icon: BookOpen, color: "#2563eb", bg: "#eff6ff", sub: `${summary.totalFormes} personnes formées` },
          { label: "Code de conduite signé", value: `${summary.tauxSignature}%`, icon: FileText, color: "#7c3aed", bg: "#f5f3ff", sub: `${summary.signataires}/${summary.totalPersonnel} travailleurs` },
          { label: "Taux résolution plaintes", value: `${summary.tauxResolution}%`, icon: CheckCircle2, color: "#16a34a", bg: "#dcfce7", sub: `Délai moyen: ${summary.delaiMoyen}j` },
          { label: "Plan d'action VBG", value: `${summary.tauxPlanAction}%`, icon: HandshakeIcon, color: "#be185d", bg: "#fdf2f8", sub: `${summary.planRealise}/${vbgPlanAction.length} mesures réalisées` },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <article key={k.label} className="kpiCard" style={{ background: k.bg, border: `1px solid ${k.bg}` }}>
              <div className="kpiCardHeader">
                <Icon size={18} style={{ color: k.color }} />
              </div>
              <strong className="kpiCardValue" style={{ color: k.color }}>{k.value}</strong>
              <p className="kpiCardLabel">{k.label}</p>
              <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{k.sub}</p>
            </article>
          );
        })}
      </div>

      {/* ── Graphiques ── */}
      <div className="dashboardGrid" style={{ marginBottom: 20 }}>
        <article className="panel">
          <div className="panelHeader"><div><h2>Incidents par type</h2><p>Répartition selon la classification OMS/WB</p></div></div>
          <div className="chart compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="type" width={180} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Incidents" fill="#be185d" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader"><div><h2>Statut des incidents</h2><p>Suivi du traitement (cible: 0 ouvert)</p></div></div>
          <div className="chart compact" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={pieStatut} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => percent ? `${Math.round(percent * 100)}%` : ""} labelLine={false}>
                  {pieStatut.map((entry) => (
                    <Cell key={entry.name} fill={COULEURS_STATUT[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {pieStatut.map((e) => (
                <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: COULEURS_STATUT[e.name] ?? "#94a3b8", flexShrink: 0 }} />
                  <span>{e.name}</span>
                  <strong style={{ marginLeft: "auto", color: COULEURS_STATUT[e.name] }}>{e.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* ── Onglets détail ── */}
      <div className="panel">
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: 16, paddingBottom: 0 }}>
          {([
            ["incidents", "Registre incidents", AlertTriangle],
            ["formations", "Formations VBG", BookOpen],
            ["plaintes", "Mécanisme plaintes", ClipboardList],
            ["plan", "Plan d'action", HandshakeIcon],
            ["code", "Code de conduite", Users],
          ] as [Tab, string, React.ElementType][]).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", border: "none", borderBottom: tab === id ? "2px solid #be185d" : "2px solid transparent",
                background: "none", cursor: "pointer", fontSize: 12,
                fontWeight: tab === id ? 700 : 400,
                color: tab === id ? "#be185d" : "var(--muted)",
                marginBottom: -1,
              }}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Incidents */}
        {tab === "incidents" && (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Référence</th><th>Date</th><th>Site</th><th>Type VBG</th>
                  <th>Gravité</th><th>Statut</th><th>Délai (j)</th><th>Mesures prises</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((i) => (
                  <tr key={i.id}>
                    <td><strong>{i.reference}</strong></td>
                    <td>{i.date}</td>
                    <td>{i.site}</td>
                    <td style={{ fontSize: 11 }}>{i.type}</td>
                    <td><span className="status" style={{ background: COULEURS_GRAVITE[i.gravite] + "22", color: COULEURS_GRAVITE[i.gravite], border: `1px solid ${COULEURS_GRAVITE[i.gravite]}44` }}>{i.gravite}</span></td>
                    <td><span className="status" style={{ background: COULEURS_STATUT[i.statut] + "22", color: COULEURS_STATUT[i.statut] }}>{i.statut}</span></td>
                    <td style={{ textAlign: "center" }}>{i.delaiResolution ?? "—"}</td>
                    <td style={{ fontSize: 10, maxWidth: 280, color: "var(--muted)" }}>{i.mesuresPrises}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 8, padding: "0 4px" }}>
              * Toutes les références sont anonymisées conformément aux exigences de confidentialité WB Good Practice Note GBV §6.2.
            </p>
          </div>
        )}

        {/* Formations */}
        {tab === "formations" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div className="chart" style={{ height: 180 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Participants par site</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formBySite}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="site" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="participants" name="Participants" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Total formés", value: summary.totalFormes, color: "#2563eb" },
                  { label: "Sessions réalisées", value: vbgFormations.length, color: "#0f766e" },
                  { label: "Taux couverture", value: `${summary.tauxFormation}%`, color: summary.tauxFormation >= 80 ? "#16a34a" : "#d97706" },
                  { label: "Score satisfaction moy.", value: `${(vbgFormations.reduce((s, f) => s + (f.scoreSatisfaction ?? 4), 0) / vbgFormations.length).toFixed(1)}/5`, color: "#7c3aed" },
                ].map((k) => (
                  <div key={k.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--hover)", borderRadius: 8 }}>
                    <span style={{ fontSize: 12 }}>{k.label}</span>
                    <strong style={{ fontSize: 14, color: k.color }}>{k.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="tableWrap">
              <table>
                <thead><tr><th>Date</th><th>Site</th><th>Thème</th><th>Participants</th><th>Formateur</th><th>Durée (h)</th><th>Satisfaction</th></tr></thead>
                <tbody>
                  {vbgFormations.map((f) => (
                    <tr key={f.id}>
                      <td>{f.date}</td><td>{f.site}</td>
                      <td style={{ fontSize: 11 }}>{f.theme}</td>
                      <td style={{ textAlign: "center" }}><strong>{f.participants}</strong></td>
                      <td style={{ fontSize: 11 }}>{f.formateur}</td>
                      <td style={{ textAlign: "center" }}>{f.duree}h</td>
                      <td style={{ textAlign: "center" }}>
                        {f.scoreSatisfaction ? (
                          <span style={{ color: f.scoreSatisfaction >= 4 ? "#16a34a" : "#d97706", fontWeight: 700 }}>{f.scoreSatisfaction}/5</span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Plaintes MGP */}
        {tab === "plaintes" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Plaintes totales", v: vbgPlaintes.length, c: "#be185d" },
                { label: "Clôturées (WB ≤30j)", v: summary.plaintesCloturees, c: "#16a34a" },
                { label: "En cours", v: vbgPlaintes.filter((p) => p.statut === "En investigation").length, c: "#d97706" },
                { label: "Délai moyen (j)", v: summary.delaiMoyen, c: summary.delaiMoyen <= 30 ? "#16a34a" : "#dc2626" },
              ].map((k) => (
                <div key={k.label} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--hover)", textAlign: "center" }}>
                  <strong style={{ fontSize: 22, color: k.c, display: "block" }}>{k.v}</strong>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{k.label}</span>
                </div>
              ))}
            </div>
            <div className="tableWrap">
              <table>
                <thead><tr><th>Référence</th><th>Date dépôt</th><th>Canal</th><th>Type</th><th>Statut</th><th>Délai (j)</th><th>Résolution</th></tr></thead>
                <tbody>
                  {vbgPlaintes.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.reference}</strong></td>
                      <td>{p.dateDepot}</td>
                      <td style={{ fontSize: 11 }}>{p.canal}</td>
                      <td style={{ fontSize: 11 }}>{p.typePlainte}</td>
                      <td><span className="status" style={{ background: COULEURS_STATUT[p.statut] + "22", color: COULEURS_STATUT[p.statut] }}>{p.statut}</span></td>
                      <td style={{ textAlign: "center" }}>
                        {p.delaiTraitement ? (
                          <span style={{ color: p.delaiTraitement <= 30 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{p.delaiTraitement}</span>
                        ) : "En cours"}
                      </td>
                      <td style={{ fontSize: 10, color: "var(--muted)", maxWidth: 220 }}>{p.resolution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 8, padding: "0 4px" }}>
                Délai cible: 30 jours maximum (World Bank ESS2 §26). Toutes les plaintes sont traitées de manière confidentielle.
              </p>
            </div>
          </>
        )}

        {/* Plan d'action */}
        {tab === "plan" && (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                {[
                  { label: "Prévention", items: vbgPlanAction.filter((p) => p.categorie === "Prévention") },
                  { label: "Réponse", items: vbgPlanAction.filter((p) => p.categorie === "Réponse") },
                  { label: "Atténuation", items: vbgPlanAction.filter((p) => p.categorie === "Atténuation") },
                  { label: "Suivi", items: vbgPlanAction.filter((p) => p.categorie === "Suivi") },
                ].map((cat) => (
                  <div key={cat.label} style={{ marginBottom: 14 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: "#be185d", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{cat.label}</h4>
                    {cat.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: item.statut === "En retard" ? "#fee2e2" : "var(--hover)" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: COULEURS_PLAN[item.statut], flexShrink: 0, marginTop: 4 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, margin: "0 0 2px", fontWeight: 600 }}>{item.mesure}</p>
                          <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>
                            {item.responsable} — Échéance: {item.echeance} — <em>{item.norme}</em>
                          </p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: COULEURS_PLAN[item.statut], flexShrink: 0, whiteSpace: "nowrap" }}>{item.statut}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ width: 180 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>Avancement</p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={planByStatut} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ percent }) => percent ? `${Math.round(percent * 100)}%` : ""} labelLine={false}>
                      {planByStatut.map((e) => <Cell key={e.name} fill={COULEURS_PLAN[e.name] ?? "#94a3b8"} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {planByStatut.map((e) => (
                  <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, marginBottom: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: COULEURS_PLAN[e.name] ?? "#94a3b8", flexShrink: 0 }} />
                    <span>{e.name}</span><strong style={{ marginLeft: "auto" }}>{e.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Code de conduite */}
        {tab === "code" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#15803d", margin: "0 0 4px" }}>Conformité IFC/WB</p>
                <p style={{ fontSize: 11, color: "#166534", margin: 0 }}>
                  Le Code de Conduite couvre: harcèlement sexuel, EAS/HS, discrimination, violence — signé individuellement par chaque travailleur et sous-traitant.
                  Référence: WB Good Practice Note GBV (2018) §3.1 — IFC PS2 — ILO C190.
                </p>
              </div>
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr><th>Site</th><th>Personnel total</th><th>Signataires</th><th>Taux signature</th><th>Date MAJ</th><th>Validité</th></tr>
                </thead>
                <tbody>
                  {vbgCodeConduite.map((c) => {
                    const taux = Math.round((c.signataires / c.totalPersonnel) * 100);
                    return (
                      <tr key={c.site}>
                        <td><strong>{c.site}</strong></td>
                        <td style={{ textAlign: "center" }}>{c.totalPersonnel}</td>
                        <td style={{ textAlign: "center" }}>{c.signataires}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e5e7eb" }}>
                              <div style={{ width: `${taux}%`, height: "100%", borderRadius: 4, background: taux >= 95 ? "#16a34a" : taux >= 80 ? "#d97706" : "#dc2626" }} />
                            </div>
                            <strong style={{ fontSize: 12, color: taux >= 95 ? "#16a34a" : taux >= 80 ? "#d97706" : "#dc2626", width: 40 }}>{taux}%</strong>
                          </div>
                        </td>
                        <td>{c.dateMAJ}</td>
                        <td>
                          <span className="status" style={{ background: c.valide ? "#dcfce7" : "#fee2e2", color: c.valide ? "#16a34a" : "#dc2626" }}>
                            {c.valide ? "Valide" : "À renouveler"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, border: "1px solid #fde68a" }}>
              <p style={{ fontSize: 11, color: "#92400e", margin: 0, fontWeight: 600 }}>
                Action requise: {vbgCodeConduite.find((c) => !c.valide)?.site} — Renouvellement du Code de Conduite requis. Objectif: 100% signatures avant la prochaine mission de supervision WB.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
