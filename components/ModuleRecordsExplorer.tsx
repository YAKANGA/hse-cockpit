"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, MapPin, Search } from "lucide-react";
import type { ModuleRecord } from "@/lib/module-records-data";

const PAGE_SIZES = [10, 25, 50, 100];

type ModuleRecordsExplorerProps = {
  moduleId: string;
  records: ModuleRecord[];
  tenantId?: string;
};

export function ModuleRecordsExplorer({ moduleId, records, tenantId }: ModuleRecordsExplorerProps) {
  const [liveRecords, setLiveRecords] = useState(records);
  const [query, setQuery]     = useState("");
  const [city, setCity]       = useState("Tous");
  const [project, setProject] = useState("Tous");
  const [status, setStatus]   = useState("Tous");
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => { setLiveRecords(records); }, [records]);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      if (tenantId) params.set("tenantId", tenantId);
      const res = await fetch(`/api/modules/${moduleId}/records${params.toString() ? `?${params.toString()}` : ""}`);
      if (!res.ok) return;
      const payload = await res.json();
      setLiveRecords(payload.records ?? records);
    }
    load();
  }, [moduleId, records, tenantId]);

  // Reset project when city changes
  useEffect(() => { setProject("Tous"); }, [city]);
  useEffect(() => { setPage(1); }, [query, city, project, status, pageSize]);

  const cities = useMemo(() =>
    ["Tous", ...Array.from(new Set(liveRecords.map((r) => r.site))).sort()],
    [liveRecords],
  );

  const projectsForCity = useMemo(() => {
    const source = city === "Tous" ? liveRecords : liveRecords.filter((r) => r.site === city);
    return ["Tous", ...Array.from(new Set(source.map((r) => r.projectName).filter(Boolean))).sort()];
  }, [liveRecords, city]);

  const statuses = useMemo(() =>
    ["Tous", ...Array.from(new Set(liveRecords.map((r) => r.status)))],
    [liveRecords],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return liveRecords.filter((r) => {
      const matchQuery = q
        ? [r.label, r.category, r.owner, r.entity, r.priority, r.projectName, r.site].join(" ").toLowerCase().includes(q)
        : true;
      const matchCity    = city === "Tous"    || r.site        === city;
      const matchProject = project === "Tous" || r.projectName === project;
      const matchStatus  = status === "Tous"  || r.status      === status;
      return matchQuery && matchCity && matchProject && matchStatus;
    });
  }, [liveRecords, query, city, project, status]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage     = Math.min(page, totalPages);
  const paged        = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const criticalCount = filtered.filter((r) => r.priority === "Critique").length;
  const openCount     = filtered.filter((r) => r.status !== "Clos" && r.status !== "Valide").length;
  const projectCount  = new Set(filtered.map((r) => r.projectName).filter(Boolean)).size;

  return (
    <section className="panel moduleRecordsPanel">
      <div className="panelHeader">
        <div>
          <h2>Donnees detaillees du module</h2>
          <p>Recherche, filtres et export des enregistrements par ville et projet.</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
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
        <span><strong>{cities.length - 1}</strong> ville(s)</span>
        <span><strong>{projectCount}</strong> projet(s)</span>
      </div>

      <div className="filterBar moduleDashboardFilters recordsFilterBar">
        <label className="filterSearch">
          <Search size={17} />
          <input
            placeholder="Rechercher libelle, projet, responsable..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Ville
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Projet
          <select value={project} onChange={(e) => setProject(e.target.value)}>
            {projectsForCity.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label>
          Statut
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Ville / Projet</th>
              <th>Element</th>
              <th>Categorie</th>
              <th>Responsable</th>
              <th>Priorite</th>
              <th>Echeance</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>Aucun enregistrement</td></tr>
            ) : paged.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)" }}>
                      <MapPin size={10} /> {r.site}
                    </span>
                    {r.projectName && (
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{r.projectName}</span>
                    )}
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
