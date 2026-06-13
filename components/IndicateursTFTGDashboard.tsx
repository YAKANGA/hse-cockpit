"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import {
  type MonthlyRow,
  MONTHLY_DATA,
  MONTHLY_DATA_BY_SITE,
  MONTH_ISO,
  calcTF,
  calcTG,
} from "@/lib/tftg-data";

const TF_OBJECTIF = 2.0;
const TG_OBJECTIF = 0.15;

const STATUS_CLASS: Record<string, string> = {
  ok: "status ok",
  warn: "status warn",
  danger: "status danger",
};

export function IndicateursTFTGDashboard() {
  const [mounted, setMounted] = useState(false);
  const globalFilter = useCockpitFilter();
  const { dateDebut, dateFin } = globalFilter;
  const activeSites = useMemo(() => getActiveSites(globalFilter), [globalFilter]);
  const [hasRealData, setHasRealData] = useState(false);
  const [sourceData, setSourceData] = useState(MONTHLY_DATA);
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setMounted(true);
    fetch("/api/modules/indicators/tftg")
      .then((r) => r.ok ? r.json() : null)
      .then((payload) => {
        if (payload?.hasRealData && payload.data?.length > 0) {
          setSourceData(payload.data);
          setHasRealData(true);
        }
      })
      .catch(() => {});
  }, []);

  const filteredSourceData = useMemo(() => {
    const debutMois = dateDebut ? dateDebut.slice(0, 7) : undefined;
    const finMois   = dateFin   ? dateFin.slice(0, 7)   : undefined;

    // When site/project filter active and using static data → aggregate from per-site breakdown
    let base: MonthlyRow[];
    if (!hasRealData && activeSites) {
      const sitesFiltered = MONTHLY_DATA_BY_SITE.filter((r) => activeSites.includes(r.site));
      const map = new Map<string, MonthlyRow>();
      for (const row of sitesFiltered) {
        const prev = map.get(row.mois);
        map.set(row.mois, prev
          ? { mois: row.mois, heures: prev.heures + row.heures, accidents: prev.accidents + row.accidents,
              jours: prev.jours + row.jours, causeries: prev.causeries + row.causeries, formations: prev.formations + row.formations }
          : { mois: row.mois, heures: row.heures, accidents: row.accidents, jours: row.jours, causeries: row.causeries, formations: row.formations }
        );
      }
      base = MONTHLY_DATA.map((m) => map.get(m.mois)).filter(Boolean) as MonthlyRow[];
    } else {
      base = sourceData;
    }

    if (!debutMois && !finMois) return base;
    return base.filter((row) => {
      const miso = MONTH_ISO[row.mois];
      if (!miso) return true;
      if (debutMois && miso < debutMois) return false;
      if (finMois   && miso > finMois)   return false;
      return true;
    });
  }, [sourceData, hasRealData, activeSites, dateDebut, dateFin]);

  const computedRows = useMemo(
    () =>
      filteredSourceData.map((row) => ({
        ...row,
        tf: calcTF(row.accidents, row.heures),
        tg: calcTG(row.jours, row.heures),
        tams: (row.causeries ?? 0) + (row.formations ?? 0),
      })),
    [filteredSourceData],
  );

  const lastTF = computedRows[computedRows.length - 1]?.tf ?? 0;
  const lastTG = computedRows[computedRows.length - 1]?.tg ?? 0;
  const totalHeures = computedRows.reduce((s, r) => s + r.heures, 0);
  const totalAccidents = computedRows.reduce((s, r) => s + r.accidents, 0);
  const tfGlobal = calcTF(totalAccidents, totalHeures);
  const tfTrend = computedRows.length > 1
    ? computedRows[computedRows.length - 1].tf - computedRows[computedRows.length - 2].tf
    : 0;

  const colOptions: Record<string, string[]> = {
    statutTF: ["OK", "Vigilance", "Alerte"],
  };

  const tableData = useMemo(() =>
    computedRows.filter((row) => {
      if (!("statutTF" in colFilters)) return true;
      const vals = colFilters["statutTF"] ?? [];
      if (vals.length === 0) return false;
      const status = row.tf <= TF_OBJECTIF ? "OK" : row.tf <= TF_OBJECTIF * 1.5 ? "Vigilance" : "Alerte";
      return vals.includes(status);
    }),
  [computedRows, colFilters]);

  function toggleColValue(col: string, val: string) {
    setColFilters((prev) => {
      const all = colOptions[col] ?? [];
      const inPrev = col in prev;
      const cur = inPrev ? (prev[col] ?? []) : all;
      let next: string[];
      if (!inPrev)               { next = all.filter((v) => v !== val); }
      else if (cur.includes(val)) { next = cur.filter((v) => v !== val); }
      else                       { next = [...cur, val]; }
      if (next.length === all.length) {
        const copy = { ...prev }; delete copy[col]; return copy;
      }
      return { ...prev, [col]: next };
    });
  }

  function openDropdown(col: string) {
    if (openCol === col) { setOpenCol(null); return; }
    const btn = btnRefs.current[col];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    setOpenCol(col);
  }

  const hasAnyColFilter = Object.keys(colFilters).length > 0;

  function tfStatus(val: number) {
    if (val <= TF_OBJECTIF) return "ok";
    if (val <= TF_OBJECTIF * 1.5) return "warn";
    return "danger";
  }

  function tgStatus(val: number) {
    if (val <= TG_OBJECTIF) return "ok";
    if (val <= TG_OBJECTIF * 1.5) return "warn";
    return "danger";
  }

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Taux de frequence et de gravite</h2>
          <p>Evolution mensuelle TF et TG — objectifs : TF &le; {TF_OBJECTIF} / TG &le; {TG_OBJECTIF}.</p>
        </div>
        <span className={hasRealData ? "status ok" : "status warn"} style={{ fontSize: 12, alignSelf: "center" }}>
          {hasRealData ? `Donnees importees (${sourceData.length} mois)` : "Donnees de reference — importez un fichier pour actualiser"}
        </span>
      </div>

      <div className="tftgKpis">
        <div className="tftgKpiCard">
          <span>TF consolide</span>
          <strong>{tfGlobal}</strong>
          <em className={STATUS_CLASS[tfStatus(tfGlobal)]}>
            {tfGlobal <= TF_OBJECTIF ? "Objectif atteint" : "Au-dessus objectif"}
          </em>
          <small>Objectif &le; {TF_OBJECTIF}</small>
        </div>
        <div className="tftgKpiCard">
          <span>TF dernier mois</span>
          <strong>{lastTF}</strong>
          <em className={tfTrend <= 0 ? STATUS_CLASS.ok : STATUS_CLASS.warn}>
            {tfTrend > 0 ? `+${tfTrend.toFixed(1)}` : tfTrend.toFixed(1)} vs mois precedent
          </em>
          <small>Tendance {tfTrend <= 0 ? "favorable" : "defavorable"}</small>
        </div>
        <div className="tftgKpiCard">
          <span>TG dernier mois</span>
          <strong>{lastTG}</strong>
          <em className={STATUS_CLASS[tgStatus(lastTG)]}>
            {lastTG <= TG_OBJECTIF ? "Objectif atteint" : "Au-dessus objectif"}
          </em>
          <small>Objectif &le; {TG_OBJECTIF}</small>
        </div>
        <div className="tftgKpiCard">
          <span>Heures travaillees</span>
          <strong>{(totalHeures / 1_000).toFixed(0)}k</strong>
          <em className={STATUS_CLASS.ok}>Base de calcul</em>
          <small>Cumul periode</small>
        </div>
      </div>

      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Evolution du TF mensuel</h2>
              <p>Taux de frequence = accidents &times; 1 000 000 / heures.</p>
            </div>
          </div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computedRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, "auto"]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={TF_OBJECTIF} stroke="#047857" strokeDasharray="5 4" label={{ value: `Objectif ${TF_OBJECTIF}`, position: "insideTopRight", fill: "#047857", fontSize: 12 }} />
                  <Line type="monotone" dataKey="tf" name="TF mensuel" stroke="#c2410c" strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Evolution du TG mensuel</h2>
              <p>Taux de gravite = jours perdus &times; 1 000 / heures.</p>
            </div>
          </div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computedRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, "auto"]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={TG_OBJECTIF} stroke="#047857" strokeDasharray="5 4" label={{ value: `Objectif ${TG_OBJECTIF}`, position: "insideTopRight", fill: "#047857", fontSize: 12 }} />
                  <Line type="monotone" dataKey="tg" name="TG mensuel" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>

      <article className="panel" style={{ marginTop: 18 }}>
        {mounted && openCol && createPortal(
          <>
            <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setOpenCol(null)} />
            <div style={{ position:"absolute", top:dropPos.top+2, left:dropPos.left, zIndex:9999, background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, boxShadow:"0 8px 28px rgba(0,0,0,0.14)", minWidth:190, maxHeight:310, display:"flex", flexDirection:"column" }}>
              <div style={{ overflowY:"auto", flex:1 }}>
                {(colOptions[openCol] ?? []).map((opt) => {
                  const isFiltering = openCol in colFilters;
                  const cur = isFiltering ? (colFilters[openCol] ?? []) : null;
                  const checked = cur === null || cur.includes(opt);
                  return (
                    <label key={opt} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 12px", cursor:"pointer", fontSize:12, borderBottom:"1px solid #f1f5f9", background:"#fff" }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.background = "#f3f4f6"; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.background = "#fff"; }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleColValue(openCol, opt)}
                        style={{ accentColor:"#c2410c", width:14, height:14, cursor:"pointer" }} />
                      <span style={{ fontWeight: checked ? 600 : 400, color: checked ? "#111827" : "#9ca3af" }}>{opt}</span>
                    </label>
                  );
                })}
              </div>
              <label style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", borderTop:"1px solid #e5e7eb", cursor:"pointer", fontSize:12, background:"#f9fafb", borderRadius:"0 0 8px 8px" }}>
                <input type="checkbox" checked={!(openCol in colFilters)}
                  ref={(el) => { if (el) el.indeterminate = (openCol in colFilters) && (colFilters[openCol]?.length ?? 0) > 0; }}
                  onChange={() => {
                    const isAll = !(openCol in colFilters);
                    if (isAll) { setColFilters((p) => ({ ...p, [openCol]: [] })); }
                    else { setColFilters((p) => { const c = {...p}; delete c[openCol]; return c; }); }
                  }}
                  style={{ accentColor:"#c2410c", width:14, height:14, cursor:"pointer" }} />
                <span style={{ fontWeight:600, color:"#374151" }}>Tout sélectionner</span>
              </label>
            </div>
          </>,
          document.body
        )}
        <div className="panelHeader">
          <div>
            <h2>Tableau de bord mensuel</h2>
            <p>TF, TG, accidents, jours perdus, causeries et formations par mois.</p>
          </div>
          {hasAnyColFilter && (
            <button type="button" onClick={() => setColFilters({})} style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #c2410c", background:"#fff7ed", color:"#c2410c", cursor:"pointer", fontWeight:700, marginTop:4 }}>
              ✕ Réinitialiser ({tableData.length}/{computedRows.length} mois)
            </button>
          )}
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Mois</th>
                <th>Heures</th>
                <th>Accidents AT</th>
                <th>Jours perdus</th>
                <th>TF</th>
                <th>TG</th>
                <th>TAMS</th>
                <th style={{ padding:"4px 8px", textAlign:"left" }}>
                  <button ref={(el) => { btnRefs.current["statutTF"] = el; }} type="button" onClick={() => openDropdown("statutTF")}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: openCol === "statutTF" ? "1px solid #c2410c" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: openCol === "statutTF" ? "#fff7ed" : "statutTF" in colFilters ? "#fff7ed" : "transparent", color: "statutTF" in colFilters ? "#c2410c" : "var(--fg)", transition:"all 0.12s" }}>
                    Statut TF
                    {"statutTF" in colFilters
                      ? <span style={{ background:"#c2410c", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters["statutTF"] ?? []).length}</span>
                      : <span style={{ fontSize:10, opacity:0.5 }}>▾</span>}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.mois}>
                  <td><strong>{row.mois}</strong></td>
                  <td>{row.heures.toLocaleString("fr-FR")}</td>
                  <td>{row.accidents}</td>
                  <td>{row.jours}</td>
                  <td><strong>{row.tf}</strong></td>
                  <td><strong>{row.tg}</strong></td>
                  <td>{row.tams}</td>
                  <td>
                    <span className={STATUS_CLASS[tfStatus(row.tf)]}>
                      {row.tf <= TF_OBJECTIF ? "OK" : row.tf <= TF_OBJECTIF * 1.5 ? "Vigilance" : "Alerte"}
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
