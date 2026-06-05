"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";

const PAGE_SIZES = [10, 25, 50, 100];
import type { ImportHistoryItem } from "@/lib/operations-data";

type ImportHistoryExplorerProps = {
  imports: ImportHistoryItem[];
};

export function ImportHistoryExplorer({ imports: initialImports }: ImportHistoryExplorerProps) {
  const [imports, setImports] = useState(initialImports);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous");
  const [module, setModule] = useState("Tous");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    async function fetchLiveHistory() {
      setIsRefreshing(true);
      try {
        const res = await fetch("/api/imports/history");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.imports)) {
            setImports(data.imports as ImportHistoryItem[]);
          }
        }
      } catch {
        // keep initial data on error
      } finally {
        setIsRefreshing(false);
      }
    }
    fetchLiveHistory();
  }, []);

  async function refresh() {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/imports/history");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.imports)) {
          setImports(data.imports as ImportHistoryItem[]);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  }

  const statuses = ["Tous", ...Array.from(new Set(imports.map((item) => item.status)))];
  const modules = ["Tous", ...Array.from(new Set(imports.map((item) => item.module)))];

  const filteredImports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return imports.filter((item) => {
      const matchesQuery = normalizedQuery
        ? [item.tenant, item.entity, item.module, item.filename, item.author, item.errors.join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesStatus = status === "Tous" || item.status === status;
      const matchesModule = module === "Tous" || item.module === module;

      return matchesQuery && matchesStatus && matchesModule;
    });
  }, [imports, module, query, status]);

  const totalPages = Math.max(1, Math.ceil(filteredImports.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedImports = filteredImports.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [query, status, module, pageSize]);

  const totalRows = filteredImports.reduce((sum, item) => sum + item.rows, 0);
  const rejectedRows = filteredImports.reduce((sum, item) => sum + item.rejectedRows, 0);
  const validImports = filteredImports.filter((item) => item.status === "Valide").length;
  const correctionImports = filteredImports.filter((item) => item.status === "A corriger").length;

  return (
    <>
      <section className="adminStats">
        <article>
          <span>Imports valides</span>
          <strong>{validImports}</strong>
        </article>
        <article>
          <span>Lignes controlees</span>
          <strong>{totalRows}</strong>
        </article>
        <article>
          <span>Lignes rejetees</span>
          <strong>{rejectedRows}</strong>
        </article>
        <article>
          <span>Fichiers a corriger</span>
          <strong>{correctionImports}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Registre des imports</h2>
            <p>Historisation par entreprise, entite, module, fichier, auteur et statut.</p>
          </div>
          <button className="secondaryButton" disabled={isRefreshing} onClick={refresh} type="button">
            <RefreshCw size={16} style={isRefreshing ? { animation: "spin 1s linear infinite" } : undefined} />
            {isRefreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>

        <div className="filterBar">
          <label className="filterSearch">
            <Search size={17} />
            <input
              placeholder="Rechercher entreprise, fichier, auteur, erreur..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            Module
            <select value={module} onChange={(event) => setModule(event.target.value)}>
              {modules.map((option) => (
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
                <th>Entreprise</th>
                <th>Entite</th>
                <th>Module</th>
                <th>Fichier</th>
                <th>Lignes</th>
                <th>Rejetees</th>
                <th>Statut</th>
                <th>Erreurs</th>
              </tr>
            </thead>
            <tbody>
              {pagedImports.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.tenant}</td>
                  <td>{item.entity}</td>
                  <td>{item.module}</td>
                  <td>{item.filename}</td>
                  <td>{item.acceptedRows}/{item.rows}</td>
                  <td>{item.rejectedRows}</td>
                  <td>
                    <span className={item.status === "Valide" ? "status ok" : "status warn"}>{item.status}</span>
                  </td>
                  <td>{item.errors.length ? item.errors.join(" ; ") : "Aucune erreur"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div className="paginationInfo">
            {filteredImports.length === 0 ? "Aucun import" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredImports.length)} sur ${filteredImports.length}`}
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
    </>
  );
}
