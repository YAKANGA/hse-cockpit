"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IMPACTS_ENV,
  IMPORTANCE_COLOR,
  STATUT_COLOR,
  getNiveauImportance,
  type NiveauImportance,
} from "@/lib/environment-data";
import { useCockpitFilter } from "@/lib/use-cockpit-filter";
import { isoDateInRange } from "@/lib/date-utils";
import { getProject } from "@/lib/projects-data";

const PHASES = ["Tous", "Preparation", "Construction", "Exploitation"];
const NIVEAUX: (NiveauImportance | "Tous")[] = ["Tous", "Critique", "Eleve", "Modere", "Faible"];
type EnvironmentImpactRow = (typeof IMPACTS_ENV)[number];

const COL_DEFS_ENV: { key: string; label: string; get: (i: EnvironmentImpactRow) => string }[] = [
  { key: "typeTravraux", label: "Type travaux", get: (i) => i.typeTravraux },
  { key: "phase",        label: "Phase",        get: (i) => i.phase },
  { key: "milieu",       label: "Milieu",       get: (i) => i.milieuAffecte },
  { key: "resp",         label: "Responsable",  get: (i) => i.responsable },
  { key: "statut",       label: "Statut",       get: (i) => i.statut },
];

function ImportanceBadge({ score }: { score: number }) {
  const niveau = getNiveauImportance(score);
  const color = IMPORTANCE_COLOR[niveau];
  return (
    <span
      className="envImportanceBadge"
      style={{ background: `${color}22`, color, borderColor: `${color}44` }}
    >
      {score} — {niveau}
    </span>
  );
}

export function EnvironmentImpactsPanel() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState("Tous");
  const [niveau, setNiveau] = useState<NiveauImportance | "Tous">("Tous");
  const { villes, projets: cockpitProjets, dateDebut, dateFin } = useCockpitFilter();

  // Column filter state
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => { setMounted(true); }, []);

  // site + project + date + phase filtered (no niveau UI filter) — base for KPI summary
  const baseFiltered = useMemo(() =>
    IMPACTS_ENV.filter((i) => {
      if (!isoDateInRange(i.date_evaluation, dateDebut, dateFin)) return false;
      if (cockpitProjets.length && !cockpitProjets.includes(i.projectId)) return false;
      if (villes.length) {
        const site = getProject(i.projectId)?.city;
        if (site && !villes.includes(site)) return false;
      }
      if (phase !== "Tous" && i.phase !== phase) return false;
      return true;
    }),
  [cockpitProjets, villes, dateDebut, dateFin, phase]);

  // further filtered by niveau UI toggle — for charts and table
  const filtered = useMemo(() =>
    niveau === "Tous" ? baseFiltered : baseFiltered.filter((i) => getNiveauImportance(i.importance) === niveau),
  [baseFiltered, niveau]);

  const baseTotal = baseFiltered.length;

  const summary = useMemo(() => {
    const base     = baseFiltered;
    const critique = base.filter((i) => i.importance >= 18).length;
    const eleve    = base.filter((i) => i.importance >= 12 && i.importance < 18).length;
    const modere   = base.filter((i) => i.importance >= 9  && i.importance < 12).length;
    const faible   = base.filter((i) => i.importance < 9).length;
    const valide   = base.filter((i) => i.statut === "Valide").length;
    const enCours  = base.filter((i) => i.statut === "En cours").length;
    const projets  = new Set(base.map((i) => i.projectId)).size;
    return { critique, eleve, modere, faible, valide, enCours, projets };
  }, [baseFiltered]);

  const byMilieu = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((i) => { map[i.milieuAffecte] = (map[i.milieuAffecte] ?? 0) + 1; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [filtered]);

  const byNiveau = useMemo(() => {
    const map: Record<string, number> = { Critique: 0, Eleve: 0, Modere: 0, Faible: 0 };
    filtered.forEach((i) => { map[getNiveauImportance(i.importance)]++; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byStatut = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((i) => { map[i.statut] = (map[i.statut] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Column filter options derived from filtered (niveau-filtered) data
  const colOptions = useMemo(() =>
    Object.fromEntries(COL_DEFS_ENV.map(({ key, get }) => [
      key, Array.from(new Set(filtered.map(get))).sort() as string[],
    ])),
  [filtered]);

  // Table data: filtered further by column filters
  const tableData = useMemo(() =>
    filtered.filter((item) =>
      COL_DEFS_ENV.every(({ key, get }) => {
        if (!(key in colFilters)) return true;
        const vals = colFilters[key] ?? [];
        return vals.length === 0 ? false : vals.includes(get(item));
      })
    ),
  [filtered, colFilters]);

  const hasAnyColFilter = Object.keys(colFilters).length > 0;

  const MILIEU_COLORS = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#dc2626", "#16a34a", "#c2410c"];

  function toggleColValue(col: string, val: string) {
    setColFilters((prev) => {
      const all = colOptions[col] ?? [];
      const inPrev = col in prev;
      const cur = inPrev ? (prev[col] ?? []) : all;
      let next: string[];
      if (!inPrev)               { next = all.filter((v) => v !== val); }
      else if (cur.includes(val)) { next = cur.filter((v) => v !== val); }
      else                        { next = [...cur, val]; }
      if (next.length === all.length) {
        const copy = { ...prev }; delete copy[col]; return copy;
      }
      return { ...prev, [col]: next };
    });
  }

  function openDropdownEnv(col: string) {
    if (openCol === col) { setOpenCol(null); return; }
    const btn = btnRefs.current[col];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    setOpenCol(col);
  }

  return (
    <section className="sectionBlock">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ width: 4, height: 28, borderRadius: 99, background: "linear-gradient(180deg,#0f766e,#16a34a)", flexShrink: 0 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Gestion Environnementale — Impacts par Projet</h2>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 0 14px" }}>
            ISO 14001:2015 · IFC Standards · Décret CI n°2017-665 — <strong>{summary.projets}</strong> projets · <strong>{baseTotal}</strong> impacts identifiés{niveau !== "Tous" && <span style={{ color:"#0f766e", marginLeft:6 }}>· {filtered.length} affichés</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={phase} onChange={(e) => setPhase(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 12, background: "var(--panel)", color: "var(--ink)", cursor: "pointer" }}>
            {PHASES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 12, marginBottom: 18 }}>
        {(["Critique", "Eleve", "Modere", "Faible"] as NiveauImportance[]).map((n) => {
          const count = summary[n.toLowerCase() as "critique" | "eleve" | "modere" | "faible"];
          const color = IMPORTANCE_COLOR[n];
          const seuil = n === "Critique" ? "≥ 18" : n === "Eleve" ? "12 – 17" : n === "Modere" ? "9 – 11" : "≤ 8";
          const label = n === "Eleve" ? "Élevé" : n === "Modere" ? "Modéré" : n;
          const isActive = niveau === n;
          return (
            <div key={n} onClick={() => setNiveau(isActive ? "Tous" : n)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setNiveau(isActive ? "Tous" : n); }}
              style={{ padding: "14px 16px", borderRadius: 12, background: "var(--panel)", borderLeft: `4px solid ${color}`,
                boxShadow: isActive ? `0 0 0 2px ${color}55` : "0 1px 4px rgba(0,0,0,0.06)",
                cursor: "pointer", transition: "box-shadow 0.2s", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
              <strong style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{count}</strong>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>impact{count > 1 ? "s" : ""} · {seuil}</span>
            </div>
          );
        })}
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--panel)", borderLeft: "4px solid #16a34a", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Validées</span>
          <strong style={{ fontSize: 28, fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>{summary.valide}</strong>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>mesures sur {baseTotal}</span>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--panel)", borderLeft: "4px solid #2563eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em" }}>En cours</span>
          <strong style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", lineHeight: 1 }}>{summary.enCours}</strong>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>mesures actives</span>
        </div>
      </div>

      {/* Filtres niveau */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>Filtrer :</span>
        {NIVEAUX.map((n) => {
          const color = n !== "Tous" ? IMPORTANCE_COLOR[n as NiveauImportance] : "#64748b";
          const isActive = niveau === n;
          return (
            <button key={n} type="button" onClick={() => setNiveau(n)}
              style={{ padding: "5px 14px", borderRadius: 99, border: `1.5px solid ${isActive ? color : "var(--line)"}`,
                background: isActive ? `${color}18` : "transparent", color: isActive ? color : "var(--muted)",
                fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>
              {n}
            </button>
          );
        })}
        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>
          {filtered.length} impact{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Charts — 3 colonnes : barres large + 2 donuts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginTop: 4 }}>

        {/* Barres horizontales */}
        <article className="panel" style={{ borderTop: "3px solid #0f766e" }}>
          <div style={{ padding: "14px 18px 8px", borderBottom: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Impacts par milieu affecté</h3>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>Nombre d'impacts identifiés par catégorie de milieu</p>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {mounted ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={byMilieu} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={115} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--line)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="value" name="Impacts" radius={[0, 6, 6, 0]} barSize={14} label={{ position: "right", fontSize: 12, fontWeight: 700, fill: "#475569" }}>
                    {byMilieu.map((_, i) => <Cell key={i} fill={MILIEU_COLORS[i % MILIEU_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" style={{ height: 230 }} />}
          </div>
        </article>

        {/* Donut niveau */}
        <article className="panel" style={{ borderTop: "3px solid #dc2626" }}>
          <div style={{ padding: "14px 18px 8px", borderBottom: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Niveau d'importance</h3>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>Critique · Élevé · Modéré · Faible</p>
          </div>
          <div style={{ padding: "8px 8px 0", position: "relative" }}>
            {mounted ? (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={byNiveau} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={68} innerRadius={38}
                      label={false} labelLine={false}>
                      {byNiveau.map((e) => <Cell key={e.name} fill={IMPORTANCE_COLOR[e.name as NiveauImportance] ?? "#94a3b8"} />)}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => {
                        const count = Number(value ?? 0);
                        return [`${count} impact${count > 1 ? "s" : ""}`, String(name)];
                      }}
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--line)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                  {byNiveau.map((e) => {
                    const total = byNiveau.reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? Math.round((e.value / total) * 100) : 0;
                    const color = IMPORTANCE_COLOR[e.name as NiveauImportance] ?? "#94a3b8";
                    return (
                      <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                        <span style={{ flex: 1, color: "var(--ink)" }}>{e.name}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 6 }}>{pct}%</span>
                        <strong style={{ color, minWidth: 18, textAlign: "right" }}>{e.value}</strong>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : <div className="chartSkeleton" style={{ height: 230 }} />}
          </div>
        </article>

        {/* Donut statut */}
        <article className="panel" style={{ borderTop: "3px solid #2563eb" }}>
          <div style={{ padding: "14px 18px 8px", borderBottom: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Statut des mesures</h3>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>Mise en œuvre des mesures compensatoires</p>
          </div>
          <div style={{ padding: "8px 8px 0", position: "relative" }}>
            {mounted ? (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={byStatut} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={68} innerRadius={38}
                      label={false} labelLine={false}>
                      {byStatut.map((e) => <Cell key={e.name} fill={STATUT_COLOR[e.name] ?? "#94a3b8"} />)}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => {
                        const count = Number(value ?? 0);
                        return [`${count} mesure${count > 1 ? "s" : ""}`, String(name)];
                      }}
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--line)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                  {byStatut.map((e) => {
                    const total = byStatut.reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? Math.round((e.value / total) * 100) : 0;
                    const color = STATUT_COLOR[e.name] ?? "#94a3b8";
                    return (
                      <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                        <span style={{ flex: 1, color: "var(--ink)" }}>{e.name}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 6 }}>{pct}%</span>
                        <strong style={{ color, minWidth: 18, textAlign: "right" }}>{e.value}</strong>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : <div className="chartSkeleton" style={{ height: 230 }} />}
          </div>
        </article>
      </div>

      {/* Registre des impacts */}
      <article className="panel" style={{ marginTop: 20, borderTop: "3px solid #0f766e" }}>
        {/* Portal dropdown for column filters */}
        {mounted && openCol && createPortal(
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpenCol(null)} />
            <div style={{ position: "absolute", top: dropPos.top + 2, left: dropPos.left, zIndex: 9999, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 28px rgba(0,0,0,0.14)", minWidth: 190, maxHeight: 310, display: "flex", flexDirection: "column" }}>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {(colOptions[openCol] ?? []).map((opt) => {
                  const isFiltering = openCol in colFilters;
                  const cur = isFiltering ? (colFilters[openCol] ?? []) : null;
                  const checked = cur === null || cur.includes(opt);
                  return (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f1f5f9", background: "#fff" }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.background = "#f3f4f6"; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.background = "#fff"; }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleColValue(openCol, opt)}
                        style={{ accentColor: "#0f766e", width: 14, height: 14, cursor: "pointer" }} />
                      <span style={{ fontWeight: checked ? 600 : 400, color: checked ? "#111827" : "#9ca3af" }}>{opt}</span>
                    </label>
                  );
                })}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderTop: "1px solid #e5e7eb", cursor: "pointer", fontSize: 12, background: "#f9fafb", borderRadius: "0 0 8px 8px" }}>
                <input type="checkbox" checked={!(openCol in colFilters)}
                  ref={(el) => { if (el) el.indeterminate = (openCol in colFilters) && (colFilters[openCol]?.length ?? 0) > 0; }}
                  onChange={() => {
                    const isAll = !(openCol in colFilters);
                    if (isAll) { setColFilters((p) => ({ ...p, [openCol]: [] })); }
                    else { setColFilters((p) => { const c = { ...p }; delete c[openCol]; return c; }); }
                  }}
                  style={{ accentColor: "#0f766e", width: 14, height: 14, cursor: "pointer" }} />
                <span style={{ fontWeight: 600, color: "#374151" }}>Tout sélectionner</span>
              </label>
            </div>
          </>,
          document.body
        )}

        <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Registre des impacts environnementaux</h3>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>Score IxPxD = Intensité × Portée × Durée — <strong>{tableData.length}/{filtered.length}</strong> enregistrement{filtered.length > 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {hasAnyColFilter && (
              <button type="button" onClick={() => setColFilters({})}
                style={{ fontSize: 11, fontWeight: 600, color: "#0f766e", background: "#f0fdf4", border: "1px solid #0f766e33", padding: "4px 10px", borderRadius: 99, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>×</span> Réinitialiser filtres
              </button>
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: "#0f766e", background: "#0f766e18", padding: "4px 12px", borderRadius: 99, border: "1px solid #0f766e33" }}>
              {tableData.length}/{filtered.length} ligne{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="tableWrap">
          <table className="envTable">
            <thead>
              <tr>
                <th>N°</th>
                <th>Code Projet</th>
                <th>Projet</th>
                <th>
                  <button ref={(el) => { btnRefs.current["typeTravraux"] = el; }} type="button" onClick={() => openDropdownEnv("typeTravraux")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", border: openCol === "typeTravraux" ? "1px solid #0f766e" : "1px solid transparent", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", background: openCol === "typeTravraux" ? "#f0fdf4" : "typeTravraux" in colFilters ? "#f0fdf4" : "transparent", color: "typeTravraux" in colFilters ? "#0f766e" : "var(--fg)", transition: "all 0.12s" }}>
                    Type travaux
                    {"typeTravraux" in colFilters
                      ? <span style={{ background: "#0f766e", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{(colFilters["typeTravraux"] ?? []).length}</span>
                      : <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>}
                  </button>
                </th>
                <th>
                  <button ref={(el) => { btnRefs.current["phase"] = el; }} type="button" onClick={() => openDropdownEnv("phase")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", border: openCol === "phase" ? "1px solid #0f766e" : "1px solid transparent", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", background: openCol === "phase" ? "#f0fdf4" : "phase" in colFilters ? "#f0fdf4" : "transparent", color: "phase" in colFilters ? "#0f766e" : "var(--fg)", transition: "all 0.12s" }}>
                    Phase
                    {"phase" in colFilters
                      ? <span style={{ background: "#0f766e", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{(colFilters["phase"] ?? []).length}</span>
                      : <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>}
                  </button>
                </th>
                <th>Impact environnemental</th>
                <th>
                  <button ref={(el) => { btnRefs.current["milieu"] = el; }} type="button" onClick={() => openDropdownEnv("milieu")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", border: openCol === "milieu" ? "1px solid #0f766e" : "1px solid transparent", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", background: openCol === "milieu" ? "#f0fdf4" : "milieu" in colFilters ? "#f0fdf4" : "transparent", color: "milieu" in colFilters ? "#0f766e" : "var(--fg)", transition: "all 0.12s" }}>
                    Milieu affecté
                    {"milieu" in colFilters
                      ? <span style={{ background: "#0f766e", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{(colFilters["milieu"] ?? []).length}</span>
                      : <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>}
                  </button>
                </th>
                <th style={{ textAlign: "center" }}>I</th>
                <th style={{ textAlign: "center" }}>P</th>
                <th style={{ textAlign: "center" }}>D</th>
                <th>Importance (IxPxD)</th>
                <th>Mesures d'atténuation</th>
                <th>
                  <button ref={(el) => { btnRefs.current["resp"] = el; }} type="button" onClick={() => openDropdownEnv("resp")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", border: openCol === "resp" ? "1px solid #0f766e" : "1px solid transparent", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", background: openCol === "resp" ? "#f0fdf4" : "resp" in colFilters ? "#f0fdf4" : "transparent", color: "resp" in colFilters ? "#0f766e" : "var(--fg)", transition: "all 0.12s" }}>
                    Responsable
                    {"resp" in colFilters
                      ? <span style={{ background: "#0f766e", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{(colFilters["resp"] ?? []).length}</span>
                      : <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>}
                  </button>
                </th>
                <th>Indicateur suivi</th>
                <th>
                  <button ref={(el) => { btnRefs.current["statut"] = el; }} type="button" onClick={() => openDropdownEnv("statut")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", border: openCol === "statut" ? "1px solid #0f766e" : "1px solid transparent", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", background: openCol === "statut" ? "#f0fdf4" : "statut" in colFilters ? "#f0fdf4" : "transparent", color: "statut" in colFilters ? "#0f766e" : "var(--fg)", transition: "all 0.12s" }}>
                    Statut
                    {"statut" in colFilters
                      ? <span style={{ background: "#0f766e", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{(colFilters["statut"] ?? []).length}</span>
                      : <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--muted)", fontSize: 12 }}>{item.id}</td>
                  <td><code style={{ fontSize: 11 }}>{item.projectId}</code></td>
                  <td style={{ maxWidth: 160, fontSize: 12 }}>{item.projectName}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{item.typeTravraux}</td>
                  <td>
                    <span className={`envPhaseBadge envPhase${item.phase}`}>{item.phase}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>{item.impact}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{item.milieuAffecte}</td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{item.intensite}</td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{item.portee}</td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{item.duree}</td>
                  <td><ImportanceBadge score={item.importance} /></td>
                  <td style={{ fontSize: 11, maxWidth: 180 }}>{item.mesuresAttenuation}</td>
                  <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{item.responsable}</td>
                  <td style={{ fontSize: 11, color: "var(--muted)" }}>{item.indicateurSuivi}</td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background: `${STATUT_COLOR[item.statut]}22`,
                        color: STATUT_COLOR[item.statut],
                      }}
                    >
                      {item.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
