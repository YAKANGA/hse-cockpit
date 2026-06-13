"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, MapPin, Search, X } from "lucide-react";
import type { ModuleRecord } from "@/lib/module-records-data";
import { useCockpitFilter, dateInRange } from "@/lib/use-cockpit-filter";

const PAGE_SIZES = [10, 25, 50, 100];

type ColFilterKey = "site" | "category" | "owner" | "priority" | "status";

function getFieldValue(r: ModuleRecord, key: ColFilterKey): string {
  if (key === "site")     return r.site;
  if (key === "category") return r.category;
  if (key === "owner")    return r.owner;
  if (key === "priority") return r.priority;
  return r.status;
}

const FILTERABLE_COLS: { key: ColFilterKey; label: string }[] = [
  { key: "site",     label: "Ville / Projet" },
  { key: "category", label: "Catégorie"      },
  { key: "owner",    label: "Responsable"    },
  { key: "priority", label: "Priorité"       },
  { key: "status",   label: "Statut"         },
];

const TH_STYLE: React.CSSProperties = {
  padding: "8px 14px", fontSize: 11, fontWeight: 800, color: "var(--fg)",
  textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", whiteSpace: "nowrap",
};

type Props = { moduleId: string; records: ModuleRecord[]; tenantId?: string };

export function ModuleRecordsExplorer({ moduleId, records, tenantId }: Props) {
  const [mounted, setMounted]         = useState(false);
  const [liveRecords, setLiveRecords] = useState(records);
  const [query, setQuery]             = useState("");
  const [colFilters, setColFilters]   = useState<Record<string, string[]>>({});
  const [openCol, setOpenCol]         = useState<string | null>(null);
  const [dropPos, setDropPos]         = useState({ top: 0, left: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(25);

  const { villes, projets, dateDebut, dateFin } = useCockpitFilter();
  const cockpitHasCity = villes.length > 0;
  const cockpitHasProj = projets.length > 0;
  const cockpitHasDate = !!(dateDebut || dateFin);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setLiveRecords(records); }, [records]);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      if (tenantId) params.set("tenantId", tenantId);
      const res = await fetch(`/api/modules/${moduleId}/records${params.toString() ? `?${params}` : ""}`);
      if (!res.ok) return;
      const payload = await res.json();
      setLiveRecords(payload.records ?? records);
    }
    load();
  }, [moduleId, records, tenantId]);

  useEffect(() => { setPage(1); }, [query, colFilters, pageSize]);

  // Cockpit + search pass — source des options de colonnes
  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return liveRecords.filter((r) => {
      const matchQuery   = q ? [r.label, r.category, r.owner, r.entity, r.priority, r.projectName, r.site].join(" ").toLowerCase().includes(q) : true;
      const matchCity    = cockpitHasCity ? villes.includes(r.site)     : true;
      const matchProject = cockpitHasProj ? projets.includes(r.projectId) : true;
      const matchDate    = cockpitHasDate ? dateInRange(r.date, dateDebut, dateFin) : true;
      return matchQuery && matchCity && matchProject && matchDate;
    });
  }, [liveRecords, query, villes, projets, dateDebut, dateFin, cockpitHasCity, cockpitHasProj, cockpitHasDate]);

  // Options par colonne (depuis baseFiltered pour ne pas restreindre les options)
  const colOptions = useMemo(() =>
    Object.fromEntries(FILTERABLE_COLS.map(({ key }) => [
      key,
      Array.from(new Set(baseFiltered.map((r) => getFieldValue(r, key)))).sort(),
    ])),
  [baseFiltered]);

  // Résultat final : base + filtres colonnes
  // Sémantique : clé absente = pas de filtre | [] = tout désélectionné | [v…] = filtre actif
  const filtered = useMemo(() =>
    baseFiltered.filter((r) =>
      FILTERABLE_COLS.every(({ key }) => {
        if (!(key in colFilters)) return true;
        const vals = colFilters[key] ?? [];
        return vals.length === 0 ? false : vals.includes(getFieldValue(r, key));
      })
    ),
  [baseFiltered, colFilters]);

  function toggleColValue(col: string, val: string) {
    setColFilters((prev) => {
      const all  = colOptions[col] ?? [];
      const inPrev = col in prev;
      const cur  = inPrev ? (prev[col] ?? []) : all;
      let next: string[];
      if (!inPrev)               { next = all.filter((v) => v !== val); }
      else if (cur.includes(val)){ next = cur.filter((v) => v !== val); }
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

  const hasAnyFilter = Object.keys(colFilters).length > 0 || !!query;

  const totalPages    = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage      = Math.min(page, totalPages);
  const paged         = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const criticalCount = filtered.filter((r) => r.priority === "Critique").length;
  const openCount     = filtered.filter((r) => r.status !== "Clos" && r.status !== "Valide").length;
  const cityCount     = new Set(filtered.map((r) => r.site)).size;
  const projectCount  = new Set(filtered.map((r) => r.projectName).filter(Boolean)).size;

  return (
    <section className="panel moduleRecordsPanel">

      <div className="panelHeader">
        <div>
          <h2>Donnees detaillees du module</h2>
          <p>
            {filtered.length}/{baseFiltered.length} enregistrement(s)
            {hasAnyFilter && <span style={{ color:"#2563eb", marginLeft:6 }}>— filtres actifs</span>}
          </p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <a className="secondaryButton" href={`/api/modules/${moduleId}/records/export?format=csv${tenantId ? `&tenantId=${tenantId}` : ""}`}>
            <Download size={16} /> CSV
          </a>
          <a className="secondaryButton" href={`/api/modules/${moduleId}/records/export${tenantId ? `?tenantId=${tenantId}` : ""}`}>
            <Download size={16} /> Excel
          </a>
        </div>
      </div>

      <div className="moduleFilterKpis compact">
        <span><strong>{filtered.length}</strong> enregistrement(s)</span>
        <span><strong>{openCount}</strong> ouvert(s)</span>
        <span><strong>{criticalCount}</strong> critique(s)</span>
        <span><strong>{cityCount}</strong> ville(s)</span>
        <span><strong>{projectCount}</strong> projet(s)</span>
      </div>

      {(cockpitHasCity || cockpitHasProj || cockpitHasDate) && (
        <div style={{ fontSize:12, color:"#0f766e", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:6, padding:"6px 12px", marginBottom:8 }}>
          Filtres cockpit actifs —{cockpitHasCity ? ` Villes : ${villes.join(", ")}` : ""}{cockpitHasProj ? ` · Projets : ${projets.join(", ")}` : ""}{cockpitHasDate ? ` · Période : ${dateDebut ? dateDebut.split("-").reverse().join("/") : "…"} – ${dateFin ? dateFin.split("-").reverse().join("/") : "…"}` : ""}.
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <label className="filterSearch" style={{ flex:1, maxWidth:360 }}>
          <Search size={17} />
          <input
            placeholder="Rechercher libelle, projet, responsable..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {hasAnyFilter && (
          <button type="button" onClick={() => { setColFilters({}); setQuery(""); }}
            style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, padding:"5px 10px", cursor:"pointer", whiteSpace:"nowrap" }}>
            <X size={13} /> Effacer filtres
          </button>
        )}
      </div>

      {/* Portal dropdown filtre Excel */}
      {mounted && openCol && createPortal(
        <>
          <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setOpenCol(null)} />
          <div style={{ position:"absolute", top:dropPos.top+2, left:dropPos.left, zIndex:9999, background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, boxShadow:"0 8px 28px rgba(0,0,0,0.14)", minWidth:190, maxHeight:310, display:"flex", flexDirection:"column" }}>
            {/* Liste des options */}
            <div style={{ overflowY:"auto", flex:1 }}>
              {(colOptions[openCol] ?? []).map((opt) => {
                const isFiltering = openCol in colFilters;
                const cur         = isFiltering ? (colFilters[openCol] ?? []) : null;
                const checked     = cur === null || cur.includes(opt);
                return (
                  <label key={opt}
                    style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 12px", cursor:"pointer", fontSize:12, borderBottom:"1px solid #f1f5f9", background:"#fff" }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.background = "#f3f4f6"; }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.background = "#fff"; }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleColValue(openCol, opt)}
                      style={{ accentColor:"#2563eb", width:14, height:14, cursor:"pointer" }} />
                    <span style={{ fontWeight: checked ? 600 : 400, color: checked ? "#111827" : "#9ca3af" }}>{opt}</span>
                  </label>
                );
              })}
            </div>
            {/* Footer checkbox — tout sélectionner / désélectionner */}
            <label style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", borderTop:"1px solid #e5e7eb", cursor:"pointer", fontSize:12, background:"#f9fafb", borderRadius:"0 0 8px 8px" }}>
              <input
                type="checkbox"
                checked={!(openCol in colFilters)}
                ref={(el) => { if (el) el.indeterminate = (openCol in colFilters) && (colFilters[openCol]?.length ?? 0) > 0; }}
                onChange={() => {
                  const isAll = !(openCol in colFilters);
                  if (isAll) {
                    setColFilters((p) => ({ ...p, [openCol]: [] }));
                  } else {
                    setColFilters((p) => { const c = { ...p }; delete c[openCol]; return c; });
                  }
                }}
                style={{ accentColor:"#2563eb", width:14, height:14, cursor:"pointer" }}
              />
              <span style={{ fontWeight:600, color:"#374151" }}>Tout sélectionner</span>
            </label>
          </div>
        </>,
        document.body
      )}

      <div className="tableWrap">
        <table>
          <thead>
            <tr style={{ background:"var(--hover)" }}>
              <th style={TH_STYLE}>Date</th>
              {/* Ville / Projet — filtrable */}
              {(["site"] as ColFilterKey[]).map((key) => {
                const isActive = key in colFilters;
                const isOpen   = openCol === key;
                return (
                  <th key={key} style={{ padding:"4px 8px", textAlign:"left" }}>
                    <button ref={(el) => { btnRefs.current[key] = el; }} type="button" onClick={() => openDropdown(key)}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: isOpen ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: isOpen ? "#eff6ff" : isActive ? "#f0f9ff" : "transparent", color: isActive ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}>
                      Ville / Projet
                      {isActive ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters[key] ?? []).length}</span>
                                : <span style={{ fontSize:10, opacity:0.5, marginLeft:1 }}>▾</span>}
                    </button>
                  </th>
                );
              })}
              <th style={TH_STYLE}>Élément</th>
              {/* Catégorie, Responsable, Priorité — filtrables */}
              {(["category","owner","priority"] as ColFilterKey[]).map((key) => {
                const label    = FILTERABLE_COLS.find((c) => c.key === key)!.label;
                const isActive = key in colFilters;
                const isOpen   = openCol === key;
                return (
                  <th key={key} style={{ padding:"4px 8px", textAlign:"left" }}>
                    <button ref={(el) => { btnRefs.current[key] = el; }} type="button" onClick={() => openDropdown(key)}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: isOpen ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: isOpen ? "#eff6ff" : isActive ? "#f0f9ff" : "transparent", color: isActive ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}>
                      {label}
                      {isActive ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters[key] ?? []).length}</span>
                                : <span style={{ fontSize:10, opacity:0.5, marginLeft:1 }}>▾</span>}
                    </button>
                  </th>
                );
              })}
              <th style={TH_STYLE}>Échéance</th>
              {/* Statut — filtrable */}
              {(["status"] as ColFilterKey[]).map((key) => {
                const isActive = key in colFilters;
                const isOpen   = openCol === key;
                return (
                  <th key={key} style={{ padding:"4px 8px", textAlign:"left" }}>
                    <button ref={(el) => { btnRefs.current[key] = el; }} type="button" onClick={() => openDropdown(key)}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px", border: isOpen ? "1px solid #2563eb" : "1px solid transparent", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", background: isOpen ? "#eff6ff" : isActive ? "#f0f9ff" : "transparent", color: isActive ? "#2563eb" : "var(--fg)", transition:"all 0.12s" }}>
                      Statut
                      {isActive ? <span style={{ background:"#2563eb", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{(colFilters[key] ?? []).length}</span>
                                : <span style={{ fontSize:10, opacity:0.5, marginLeft:1 }}>▾</span>}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign:"center", color:"var(--muted)", padding:"24px" }}>Aucun enregistrement pour cette sélection.</td></tr>
            ) : paged.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>
                  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                    <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"var(--muted)" }}>
                      <MapPin size={10} /> {r.site}
                    </span>
                    {r.projectName && <span style={{ fontWeight:600, fontSize:13 }}>{r.projectName}</span>}
                  </div>
                </td>
                <td>{r.label}</td>
                <td>{r.category}</td>
                <td>{r.owner}</td>
                <td>
                  <span className={r.priority === "Critique" || r.priority === "Haute" ? "status warn" : "status ok"}>
                    {r.priority}
                  </span>
                </td>
                <td>{r.dueDate}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="paginationInfo">
          {filtered.length === 0
            ? "Aucun enregistrement"
            : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} sur ${filtered.length}`}
        </div>
        <div className="paginationControls">
          <label className="paginationSize">
            Lignes :
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button className="paginationBtn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} type="button">
            <ChevronLeft size={15} />
          </button>
          <span className="paginationPages">{safePage} / {totalPages}</span>
          <button className="paginationBtn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} type="button">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
