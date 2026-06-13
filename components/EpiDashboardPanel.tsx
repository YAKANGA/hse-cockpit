"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, PolarAngleAxis, PolarGrid,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";
import { ppeRecords } from "@/lib/ppe-data";
import { AlertTriangle, CheckCircle2, Package, Clock } from "lucide-react";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";

const TODAY = new Date("2026-06-04");

function daysDiff(dateStr: string) {
  const [d, m, y] = dateStr.split("/").map(Number);
  return Math.floor((new Date(y, m - 1, d).getTime() - TODAY.getTime()) / 86_400_000);
}

const ALL_CATS = ["Toutes", ...Array.from(new Set(ppeRecords.map((r) => r.categorie))).sort()];

export function EpiDashboardPanel() {
  const [mounted, setMounted] = useState(false);
  const [catFilter, setCatFilter] = useState("Toutes");
  const globalFilter = useCockpitFilter();
  const { dateDebut, dateFin } = globalFilter;
  const activeSites = useMemo(() => getActiveSites(globalFilter), [globalFilter]);
  useEffect(() => { setMounted(true); }, []);

  const baseRecords = useMemo(() =>
    ppeRecords.filter((r) =>
      (!activeSites || activeSites.includes(r.site)) &&
      isoDateInRange(r.dateAchat, dateDebut, dateFin)
    ),
  [activeSites, dateDebut, dateFin]);

  const enriched = useMemo(() =>
    baseRecords
      .filter((r) => catFilter === "Toutes" || r.categorie === catFilter)
      .map((r) => ({
        ...r,
        daysLeft:  daysDiff(r.dateExpiration),
        tauxDispo: r.quantiteStock > 0 ? Math.round((r.quantiteDisponible / r.quantiteStock) * 100) : 0,
      })),
  [baseRecords, catFilter]);

  const expired      = enriched.filter((r) => r.daysLeft < 0);
  const expiringSoon = enriched.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 30);
  const critical     = enriched.filter((r) => r.quantiteDisponible <= 5);
  const wellStocked  = enriched.filter((r) => r.tauxDispo >= 40);

  const byCat = useMemo(() => {
    const map: Record<string, { stock:number; dispo:number; attribue:number }> = {};
    enriched.forEach((r) => {
      if (!map[r.categorie]) map[r.categorie] = { stock:0, dispo:0, attribue:0 };
      map[r.categorie].stock    += r.quantiteStock;
      map[r.categorie].dispo    += r.quantiteDisponible;
      map[r.categorie].attribue += r.quantiteAttribuee;
    });
    return Object.entries(map).map(([categorie, v]) => ({ categorie, ...v }));
  }, [enriched]);

  const radarData = useMemo(() =>
    byCat.slice(0, 7).map((c) => ({
      subject: c.categorie.length > 16 ? c.categorie.slice(0, 14) + "…" : c.categorie,
      dispo:   c.stock > 0 ? Math.round((c.dispo / c.stock) * 100) : 0,
    })),
  [byCat]);

  // Taux dispo per category (sorted)
  const dispoBycat = useMemo(() =>
    byCat.map((c) => ({
      categorie: c.categorie.length > 18 ? c.categorie.slice(0, 16) + "…" : c.categorie,
      pct:       c.stock > 0 ? Math.round((c.dispo / c.stock) * 100) : 0,
    })).sort((a, b) => a.pct - b.pct),
  [byCat]);

  const alertItems = [...expired, ...expiringSoon, ...critical]
    .filter((v, i, a) => a.findIndex((x) => x.reference === v.reference) === i)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10);

  const tauxDispoGlobal = Math.round(
    enriched.reduce((s, r) => s + r.quantiteDisponible, 0) /
    Math.max(enriched.reduce((s, r) => s + r.quantiteStock, 0), 1) * 100
  );

  const kpis = [
    { label:"EPI expirés",           value:expired.length,      color:"#dc2626", icon:AlertTriangle, sub:"renouvellement urgent" },
    { label:"Expiration < 30j",      value:expiringSoon.length, color:"#d97706", icon:Clock,         sub:"à anticiper" },
    { label:"Stock critique (≤5)",   value:critical.length,     color:"#7c3aed", icon:Package,       sub:"approvisionnement requis" },
    { label:"Bien approvisionnés",   value:wellStocked.length,  color:"#0f766e", icon:CheckCircle2,  sub:`≥40% de dispo` },
  ];

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Tableau de Bord EPI &amp; Équipements de Sécurité</h2>
          <p>{expired.length} expiré{expired.length > 1 ? "s" : ""} — {expiringSoon.length} expirant sous 30j — {critical.length} stock critique — {tauxDispoGlobal}% disponibilité globale.</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label style={{ fontSize:12, color:"var(--muted)" }}>Catégorie :</label>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--line)", fontSize:12 }}>
            {ALL_CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="epiAlertKpis">
        {kpis.map(({ label, value, color, icon:Icon, sub }) => (
          <div key={label} className="epiAlertKpiCard" style={{ "--epi-color": color, "--epi-bg": `${color}14` } as React.CSSProperties}>
            <div style={{ display:"flex", justifyContent:"space-between", width:"100%" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <strong style={{ color, fontSize:20, fontWeight:700, lineHeight:1 }}>{value}</strong>
            <div style={{ width:"100%", height:3, background:"var(--line)", borderRadius:99, marginTop:4 }}>
              <div style={{ width:`${Math.round((value / enriched.length) * 100)}%`, height:"100%", background:color, borderRadius:99 }} />
            </div>
            <small style={{ color:"var(--muted)", fontSize:11 }}>{sub}</small>
          </div>
        ))}
      </div>

      {/* Global availability bar */}
      <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--line)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
          <span style={{ color:"var(--muted)", fontWeight:500 }}>Disponibilité globale du stock EPI</span>
          <span style={{ fontWeight:700, color:tauxDispoGlobal >= 60 ? "#16a34a" : tauxDispoGlobal >= 30 ? "#d97706" : "#dc2626" }}>{tauxDispoGlobal}%</span>
        </div>
        <div style={{ height:8, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ width:`${tauxDispoGlobal}%`, height:"100%", borderRadius:99, transition:"width .5s",
            background:tauxDispoGlobal >= 60 ? "linear-gradient(90deg,#16a34a,#0f766e)" : "linear-gradient(90deg,#d97706,#dc2626)" }} />
        </div>
        <div style={{ display:"flex", gap:16, marginTop:6, fontSize:11, flexWrap:"wrap" }}>
          <span style={{ color:"#16a34a" }}>● Disponibles : {enriched.reduce((s, r) => s + r.quantiteDisponible, 0)}</span>
          <span style={{ color:"#2563eb" }}>● Attribués : {enriched.reduce((s, r) => s + r.quantiteAttribuee, 0)}</span>
          <span style={{ color:"var(--muted)" }}>● Stock total : {enriched.reduce((s, r) => s + r.quantiteStock, 0)}</span>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* Stock par catégorie */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Stock par catégorie</h2><p>Stock total, attribué et disponible par type d'EPI.</p></div></div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCat} layout="vertical" barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="categorie" width={130} tickLine={false} axisLine={false} tick={{ fontSize:11 }} />
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="stock"    name="Stock total" fill="#0f766e" radius={[0,2,2,0]} />
                  <Bar dataKey="attribue" name="Attribué"    fill="#2563eb" radius={[0,2,2,0]} />
                  <Bar dataKey="dispo"    name="Disponible"  fill="#a7f3d0" radius={[0,2,2,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        {/* Radar disponibilité */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Disponibilité par catégorie</h2><p>Taux de disponibilité (% disponible / stock). Objectif ≥40%.</p></div></div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--line)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:11 }} />
                  <Radar name="Disponibilité %" dataKey="dispo" stroke="#0f766e" fill="#0f766e" fillOpacity={0.22} strokeWidth={2} />
                  <Tooltip formatter={(v) => [`${v}%`, "Disponibilité"]} contentStyle={{ borderRadius:8, fontSize:12 }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>

      {/* Taux dispo horizontal bar */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader"><div><h2>Taux de disponibilité — toutes catégories</h2><p>Classé par risque de rupture. Seuil minimum recommandé : 40%.</p></div></div>
        <div className="chart" style={{ height:200 }}>
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dispoBycat} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} unit="%" tick={{ fontSize:10 }} />
                <YAxis type="category" dataKey="categorie" width={140} tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, "Disponibilité"]} contentStyle={{ borderRadius:8, fontSize:12 }} />
                <ReferenceLine x={40} stroke="#d97706" strokeDasharray="5 3" label={{ value:"Seuil 40%", position:"top", fill:"#d97706", fontSize:10 }} />
                <Bar dataKey="pct" name="Disponible %" radius={[0,4,4,0]}>
                  {dispoBycat.map((e) => <Cell key={e.categorie} fill={e.pct >= 40 ? "#16a34a" : e.pct >= 20 ? "#d97706" : "#dc2626"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chartSkeleton" />}
        </div>
      </article>

      {/* Alerts table */}
      {alertItems.length > 0 && (
        <article className="panel" style={{ marginTop:18, borderLeft:"3px solid #dc2626" }}>
          <div className="panelHeader"><div><h2>Alertes EPI prioritaires</h2><p>EPI expirés, expirant bientôt ou en stock critique — action immédiate requise.</p></div></div>
          <div className="tableWrap">
            <table>
              <thead><tr><th>Référence</th><th>Désignation</th><th>Catégorie</th><th>Stock</th><th>Disponible</th><th>Expiration</th><th>Alerte</th></tr></thead>
              <tbody>
                {alertItems.map((r) => (
                  <tr key={r.reference}>
                    <td><code style={{ fontSize:12 }}>{r.reference}</code></td>
                    <td><strong style={{ fontSize:12 }}>{r.designation}</strong></td>
                    <td style={{ fontSize:12 }}>{r.categorie}</td>
                    <td style={{ textAlign:"center" }}>{r.quantiteStock}</td>
                    <td style={{ textAlign:"center" }}>
                      <span className={r.quantiteDisponible <= 0 ? "status danger" : r.quantiteDisponible <= 5 ? "status warn" : "status ok"}>
                        {r.quantiteDisponible}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:r.daysLeft < 0 ? "#dc2626" : r.daysLeft <= 30 ? "#d97706" : "inherit", fontWeight:r.daysLeft <= 30 ? 600 : 400 }}>
                      {r.dateExpiration}
                    </td>
                    <td>
                      {r.daysLeft < 0
                        ? <span className="status danger">Expiré ({-r.daysLeft}j)</span>
                        : r.daysLeft <= 30
                          ? <span className="status warn">Dans {r.daysLeft}j</span>
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
