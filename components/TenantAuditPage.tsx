"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, Search } from "lucide-react";

const PAGE_SIZES = [10, 25, 50];

const ACTION_GROUPS = [
  "Tous",
  "Connexion utilisateur",
  "Import Excel valide",
  "Import rejete",
  "Export rapport PDF",
  "Export rapport Word",
  "Modification role",
  "Ajout utilisateur",
  "Activation module",
  "Suppression enregistrement",
  "Connexion echouee",
];
import { AccessGate } from "@/components/AccessGate";
import type { AuditEvent } from "@/lib/audit-data";
import { demoSessions } from "@/lib/permissions";
import { tenants } from "@/lib/tenant-data";

type AuditPayload = {
  data: AuditEvent[];
  count: number;
  summary: {
    critical: number;
    control: number;
    info: number;
  };
};

const emptyPayload: AuditPayload = {
  data: [],
  count: 0,
  summary: { critical: 0, control: 0, info: 0 },
};

export function TenantAuditPage() {
  const [tenantId, setTenantId] = useState("acme-btp");
  const [userId, setUserId] = useState("tenant-admin-acme");
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("Tous");
  const [actionFilter, setActionFilter] = useState("Tous");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [payload, setPayload] = useState<AuditPayload>(emptyPayload);
  const [status, setStatus] = useState("Chargement...");
  const session = useMemo(
    () => demoSessions.find((item) => item.userId === userId) ?? demoSessions[1] ?? demoSessions[0],
    [userId],
  );
  const auditTenantId = session.role === "SUPER_ADMIN" ? tenantId : session.tenantId;
  const tenant = tenants.find((item) => item.id === auditTenantId);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payload.data.filter((e) => {
      const matchAction = actionFilter === "Tous" || e.action === actionFilter;
      const matchQ = !q || [e.actor, e.action, e.target, e.tenant].join(" ").toLowerCase().includes(q);
      return matchAction && matchQ;
    });
  }, [payload.data, actionFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedEvents = filteredEvents.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [query, severity, actionFilter, pageSize]);
  const auditQuery = useMemo(() => {
    const params = new URLSearchParams({ userId });

    if (auditTenantId) {
      params.set("tenantId", auditTenantId);
    }
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (severity !== "Tous") {
      params.set("severity", severity);
    }

    return params.toString();
  }, [auditTenantId, query, severity, userId]);

  useEffect(() => {
    const storedTenantId = window.localStorage.getItem("hse-active-tenant");
    const storedUserId = window.localStorage.getItem("hse-active-user");

    if (storedTenantId && tenants.some((item) => item.id === storedTenantId)) {
      setTenantId(storedTenantId);
    }
    if (storedUserId && demoSessions.some((item) => item.userId === storedUserId)) {
      setUserId(storedUserId);
    }

    function syncContext(event: Event) {
      const detail = event instanceof CustomEvent ? String(event.detail) : "";
      const nextTenantId = detail || (window.localStorage.getItem("hse-active-tenant") ?? "");
      const nextUserId = detail || (window.localStorage.getItem("hse-active-user") ?? "");

      if (tenants.some((item) => item.id === nextTenantId)) {
        setTenantId(nextTenantId);
      }
      if (demoSessions.some((item) => item.userId === nextUserId)) {
        setUserId(nextUserId);
      }
    }

    window.addEventListener("hse-active-tenant-change", syncContext);
    window.addEventListener("hse-active-user-change", syncContext);
    window.addEventListener("storage", syncContext);

    return () => {
      window.removeEventListener("hse-active-tenant-change", syncContext);
      window.removeEventListener("hse-active-user-change", syncContext);
      window.removeEventListener("storage", syncContext);
    };
  }, []);

  useEffect(() => {
    async function loadAudit() {
      setStatus("Chargement...");
      const response = await fetch(`/api/audit?${auditQuery}`);

      if (!response.ok) {
        setStatus(`Acces refuse (${response.status})`);
        setPayload(emptyPayload);
        return;
      }

      const nextPayload = await response.json();
      setPayload(nextPayload);
      setStatus("Synchronise");
    }

    loadAudit();
  }, [auditQuery]);

  return (
    <AccessGate anyOf={["audit:view"]} label="Journal d'audit">
      <section className="workspace">
        <section className="adminHeader">
          <p className="eyebrow">Administration</p>
          <h1>Journal d'audit</h1>
          <p>
            Trace des actions critiques, imports, changements de droits et parametrages
            {tenant ? ` pour ${tenant.name}` : " sur toute la plateforme"}.
          </p>
        </section>

        <section className="adminStats">
          <article>
            <span>Evenements</span>
            <strong>{payload.count}</strong>
          </article>
          <article>
            <span>Critiques</span>
            <strong>{payload.summary.critical}</strong>
          </article>
          <article>
            <span>Controles</span>
            <strong>{payload.summary.control}</strong>
          </article>
          <article>
            <span>Etat audit</span>
            <strong className="compactValue">{status}</strong>
          </article>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2>Evenements recents</h2>
              <p>Controle de tracabilite filtre par role et par entreprise.</p>
            </div>
            <div className="buttonGroup">
              <a className="secondaryButton" href={`/api/audit/export?${auditQuery}&format=csv`}>
                <Download size={16} />
                CSV
              </a>
              <a className="secondaryButton" href={`/api/audit/export?${auditQuery}`}>
                <Download size={16} />
                Excel
              </a>
              <a className="secondaryButton" href={`/api/audit/docx?${auditQuery}`}>
                <FileText size={16} />
                Word
              </a>
              <a className="secondaryButton" href={`/api/audit/pdf?${auditQuery}`}>
                <FileText size={16} />
                PDF
              </a>
            </div>
          </div>
          <div className="filterBar auditFilterBar">
            <label className="filterSearch">
              <Search size={17} />
              <input
                placeholder="Rechercher acteur, action, cible, entreprise..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              Niveau
              <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
                <option>Tous</option>
                <option>Info</option>
                <option>Controle</option>
                <option>Critique</option>
              </select>
            </label>
            <label>
              Action
              <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
                {ACTION_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Entreprise</th>
                  <th>Acteur</th>
                  <th>Action</th>
                  <th>Cible</th>
                  <th>Niveau</th>
                </tr>
              </thead>
              <tbody>
                {pagedEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.date}</td>
                    <td>{event.tenant}</td>
                    <td>{event.actor}</td>
                    <td>{event.action}</td>
                    <td>{event.target}</td>
                    <td>
                      <span className={event.severity === "Critique" ? "status danger" : event.severity === "Controle" ? "status warn" : "status ok"}>
                        {event.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <div className="paginationInfo">
              {filteredEvents.length === 0 ? "Aucun evenement" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredEvents.length)} sur ${filteredEvents.length}`}
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
      </section>
    </AccessGate>
  );
}
