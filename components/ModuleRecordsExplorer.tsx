"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import type { ModuleRecord } from "@/lib/module-records-data";

const PAGE_SIZES = [10, 25, 50, 100];

type ModuleRecordsExplorerProps = {
  moduleId: string;
  records: ModuleRecord[];
  tenantId?: string;
};

export function ModuleRecordsExplorer({ moduleId, records, tenantId }: ModuleRecordsExplorerProps) {
  const [liveRecords, setLiveRecords] = useState(records);
  const [query, setQuery] = useState("");
  const [site, setSite] = useState("Tous");
  const [status, setStatus] = useState("Tous");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setLiveRecords(records);
  }, [records]);

  useEffect(() => {
    async function loadLiveRecords() {
      const params = new URLSearchParams();
      if (tenantId) {
        params.set("tenantId", tenantId);
      }
      const response = await fetch(`/api/modules/${moduleId}/records${params.toString() ? `?${params.toString()}` : ""}`);

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      setLiveRecords(payload.records ?? records);
    }

    loadLiveRecords();
  }, [moduleId, records, tenantId]);

  const sites = ["Tous", ...Array.from(new Set(liveRecords.map((record) => record.site)))];
  const statuses = ["Tous", ...Array.from(new Set(liveRecords.map((record) => record.status)))];

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return liveRecords.filter((record) => {
      const matchesQuery = normalizedQuery
        ? [record.label, record.category, record.owner, record.entity, record.priority].join(" ").toLowerCase().includes(normalizedQuery)
        : true;
      const matchesSite = site === "Tous" || record.site === site;
      const matchesStatus = status === "Tous" || record.status === status;
      return matchesQuery && matchesSite && matchesStatus;
    });
  }, [liveRecords, query, site, status]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [query, site, status, pageSize]);

  const criticalCount = filteredRecords.filter((record) => record.priority === "Critique").length;
  const openCount = filteredRecords.filter((record) => record.status !== "Clos" && record.status !== "Valide").length;

  return (
    <section className="panel moduleRecordsPanel">
      <div className="panelHeader">
        <div>
          <h2>Donnees detaillees du module</h2>
          <p>Recherche, filtres et export des enregistrements rattaches au module.</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <a className="secondaryButton" href={`/api/modules/${moduleId}/records/export?format=csv${tenantId ? `&tenantId=${tenantId}` : ""}`}>
            <Download size={16} />
            CSV
          </a>
          <a className="secondaryButton" href={`/api/modules/${moduleId}/records/export${tenantId ? `?tenantId=${tenantId}` : ""}`}>
            <Download size={16} />
            Excel
          </a>
        </div>
      </div>

      <div className="moduleFilterKpis compact">
        <span><strong>{filteredRecords.length}</strong> ligne(s)</span>
        <span><strong>{openCount}</strong> ouverte(s)</span>
        <span><strong>{criticalCount}</strong> critique(s)</span>
        <span><strong>{sites.length - 1}</strong> site(s)</span>
      </div>

      <div className="filterBar moduleDashboardFilters">
        <label className="filterSearch">
          <Search size={17} />
          <input
            placeholder="Rechercher action, responsable, categorie..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          Site
          <select value={site} onChange={(event) => setSite(event.target.value)}>
            {sites.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Statut
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Site</th>
              <th>Element</th>
              <th>Categorie</th>
              <th>Responsable</th>
              <th>Priorite</th>
              <th>Echeance</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {pagedRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.date}</td>
                <td>{record.site}</td>
                <td>{record.label}</td>
                <td>{record.category}</td>
                <td>{record.owner}</td>
                <td>
                  <span className={record.priority === "Critique" || record.priority === "Haute" ? "status warn" : "status ok"}>
                    {record.priority}
                  </span>
                </td>
                <td>{record.dueDate}</td>
                <td>{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="paginationInfo">
          {filteredRecords.length === 0 ? "Aucun enregistrement" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredRecords.length)} sur ${filteredRecords.length}`}
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
