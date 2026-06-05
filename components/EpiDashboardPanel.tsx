"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ppeRecords } from "@/lib/ppe-data";

const TODAY = new Date("2026-06-04");

function daysDiff(dateStr: string) {
  const [d, m, y] = dateStr.split("/").map(Number);
  const date = new Date(y, m - 1, d);
  return Math.floor((date.getTime() - TODAY.getTime()) / 86_400_000);
}

const ALL_CATS = ["Toutes", ...Array.from(new Set(ppeRecords.map((r) => r.categorie))).sort()];

export function EpiDashboardPanel() {
  const [mounted, setMounted] = useState(false);
  const [catFilter, setCatFilter] = useState("Toutes");
  useEffect(() => { setMounted(true); }, []);

  const enriched = useMemo(
    () =>
      ppeRecords
        .filter((r) => catFilter === "Toutes" || r.categorie === catFilter)
        .map((r) => ({
          ...r,
          daysLeft: daysDiff(r.dateExpiration),
          tauxDispo: r.quantiteStock > 0 ? Math.round((r.quantiteDisponible / r.quantiteStock) * 100) : 0,
        })),
    [catFilter],
  );

  const expired       = enriched.filter((r) => r.daysLeft < 0);
  const expiringSoon  = enriched.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 30);
  const critical      = enriched.filter((r) => r.quantiteDisponible <= 5);
  const wellStocked   = enriched.filter((r) => r.tauxDispo >= 40);

  const byCat = useMemo(() => {
    const map: Record<string, { stock: number; dispo: number; attribue: number }> = {};
    enriched.forEach((r) => {
      if (!map[r.categorie]) map[r.categorie] = { stock: 0, dispo: 0, attribue: 0 };
      map[r.categorie].stock    += r.quantiteStock;
      map[r.categorie].dispo    += r.quantiteDisponible;
      map[r.categorie].attribue += r.quantiteAttribuee;
    });
    return Object.entries(map).map(([categorie, v]) => ({ categorie, ...v }));
  }, [enriched]);

  const radarData = useMemo(
    () =>
      byCat.slice(0, 7).map((c) => ({
        subject: c.categorie.length > 16 ? c.categorie.slice(0, 14) + "…" : c.categorie,
        dispo: c.stock > 0 ? Math.round((c.dispo / c.stock) * 100) : 0,
      })),
    [byCat],
  );

  const alertItems = [...expired, ...expiringSoon, ...critical]
    .filter((v, i, a) => a.findIndex((x) => x.reference === v.reference) === i)
    .slice(0, 10);

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Tableau de bord EPI et equipements de securite</h2>
          <p>
            {expired.length} expire{expired.length > 1 ? "s" : ""} — {expiringSoon.length} expirant sous 30j — {critical.length} stock critique.
          </p>
        </div>
        <div className="periodToggle">
          <label style={{ fontSize: 13, color: "var(--muted)" }}>Categorie :</label>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13 }}
          >
            {ALL_CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="epiAlertKpis">
        {[
          { label: "EPI expires",          value: expired.length,      color: "#dc2626", bg: "#fee2e2" },
          { label: "Expiration < 30 jours", value: expiringSoon.length, color: "#d97706", bg: "#fef3c7" },
          { label: "Stock critique (≤5)",   value: critical.length,     color: "#7c3aed", bg: "#ede9fe" },
          { label: "Bien approvisionnes",   value: wellStocked.length,  color: "#0f766e", bg: "#ccfbf1" },
        ].map((k) => (
          <div
            className="epiAlertKpiCard"
            key={k.label}
            style={{ "--epi-color": k.color, "--epi-bg": k.bg } as React.CSSProperties}
          >
            <span>{k.label}</span>
            <strong>{k.value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Stock par categorie</h2>
              <p>Stock total, attribue et disponible par type d&apos;EPI.</p>
            </div>
          </div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCat} layout="vertical" barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="categorie" width={130} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stock"    name="Stock total" fill="#0f766e" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="attribue" name="Attribue"    fill="#2563eb" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="dispo"    name="Disponible"  fill="#a7f3d0" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Disponibilite par categorie</h2>
              <p>Taux de disponibilite (%  disponible / stock).</p>
            </div>
          </div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--line)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar name="Disponibilite %" dataKey="dispo" stroke="#0f766e" fill="#0f766e" fillOpacity={0.22} strokeWidth={2} />
                  <Tooltip formatter={(v) => [`${v}%`, "Disponibilite"]} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>

      {alertItems.length > 0 && (
        <article className="panel" style={{ marginTop: 18, borderLeft: "3px solid #dc2626" }}>
          <div className="panelHeader">
            <div>
              <h2>Alertes EPI prioritaires</h2>
              <p>EPI expires, expirant bientot ou en stock critique — action immediate requise.</p>
            </div>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>Reference</th><th>Designation</th><th>Categorie</th><th>Stock</th><th>Disponible</th><th>Expiration</th><th>Alerte</th></tr>
              </thead>
              <tbody>
                {alertItems.map((r) => (
                  <tr key={r.reference}>
                    <td><code style={{ fontSize: 12 }}>{r.reference}</code></td>
                    <td><strong>{r.designation}</strong></td>
                    <td>{r.categorie}</td>
                    <td>{r.quantiteStock}</td>
                    <td>
                      <span className={r.quantiteDisponible <= 0 ? "status danger" : r.quantiteDisponible <= 5 ? "status warn" : "status ok"}>
                        {r.quantiteDisponible}
                      </span>
                    </td>
                    <td style={{ color: r.daysLeft < 0 ? "#dc2626" : r.daysLeft <= 30 ? "#d97706" : "inherit" }}>
                      {r.dateExpiration}
                    </td>
                    <td>
                      {r.daysLeft < 0
                        ? <span className="status danger">Expire</span>
                        : r.daysLeft <= 30
                          ? <span className="status warn">Expire dans {r.daysLeft}j</span>
                          : r.quantiteDisponible <= 5
                            ? <span className="status warn">Stock critique</span>
                            : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
}
