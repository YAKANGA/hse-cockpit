"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  Crown,
  FileDown,
  FileSpreadsheet,
  Layers,
  LayoutGrid,
  ListChecks,
  LockKeyhole,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { demoSessions } from "@/lib/permissions";
import { modules } from "@/lib/hse-data";

export function TopNavLinks() {
  const pathname = usePathname();
  const [userId, setUserId] = useState("tenant-admin-acme");

  const session = useMemo(
    () => demoSessions.find((s) => s.userId === userId) ?? demoSessions[1] ?? demoSessions[0],
    [userId],
  );
  const perms = new Set(session.permissions);
  const canSuperAdmin   = perms.has("platform:manage-tenants");
  const canManageTenant = perms.has("tenant:manage-settings") || perms.has("tenant:manage-users") || perms.has("tenant:manage-roles");
  const canAudit  = perms.has("audit:view");
  const canExport = perms.has("module:export");
  const canImport = perms.has("module:import");

  useEffect(() => {
    const stored = localStorage.getItem("hse-active-user");
    if (stored && demoSessions.some((s) => s.userId === stored)) setUserId(stored);

    function onSession(e: Event) {
      const next = e instanceof CustomEvent ? String(e.detail) : localStorage.getItem("hse-active-user") ?? "";
      if (next && demoSessions.some((s) => s.userId === next)) setUserId(next);
    }
    window.addEventListener("hse-active-user-change", onSession);
    window.addEventListener("storage", onSession);
    return () => {
      window.removeEventListener("hse-active-user-change", onSession);
      window.removeEventListener("storage", onSession);
    };
  }, []);

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="topNavLinks" aria-label="Navigation principale">
      {/* Cockpit */}
      <a className={isActive("/", true) ? "topNavLink active" : "topNavLink"} href="/">
        <BarChart3 size={15} />
        Cockpit
      </a>

      {/* Modules — grille 2 colonnes, juste après Cockpit */}
      {perms.has("module:view") && (
        <details className="topNavDropdown">
          <summary className={modules.some((m) => isActive(`/modules/${m.id}`)) ? "topNavLink active" : "topNavLink"}>
            <LayoutGrid size={15} />
            Modules
            <ChevronDown size={13} className="topNavChevron" />
          </summary>
          <div
            className="topNavDropdownPanel"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, minWidth: 360 }}
          >
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <a
                  className={isActive(`/modules/${m.id}`) ? "topNavDropdownItem active" : "topNavDropdownItem"}
                  href={`/modules/${m.id}`}
                  key={m.id}
                  style={{ "--module": m.color } as React.CSSProperties}
                >
                  <span className="topNavDropdownIcon" style={{ background: m.accent, color: m.color }}>
                    <Icon size={14} />
                  </span>
                  {m.shortName}
                </a>
              );
            })}
          </div>
        </details>
      )}

      {perms.has("module:view") && (
        <details className="topNavDropdown">
          <summary className={
            isActive("/alerts") || isActive("/sites") || isActive("/calendrier")
              ? "topNavLink active"
              : "topNavLink"
          }>
            <Layers size={15} />
            Vues
            <ChevronDown size={13} className="topNavChevron" />
          </summary>
          <div className="topNavDropdownPanel">
            <a className={isActive("/alerts") ? "topNavDropdownItem active" : "topNavDropdownItem"} href="/alerts">
              <AlertTriangle size={14} /> Alertes
            </a>
            <a className={isActive("/sites") ? "topNavDropdownItem active" : "topNavDropdownItem"} href="/sites">
              <Building2 size={14} /> Sites
            </a>
            <a className={isActive("/calendrier") ? "topNavDropdownItem active" : "topNavDropdownItem"} href="/calendrier">
              <CalendarDays size={14} /> Calendrier
            </a>
          </div>
        </details>
      )}

      {canExport && (
        <details className="topNavDropdown">
          <summary className={isActive("/reports") ? "topNavLink active" : "topNavLink"}>
            <FileDown size={15} />
            Rapports
            <ChevronDown size={13} className="topNavChevron" />
          </summary>
          <div className="topNavDropdownPanel">
            <a className={isActive("/reports") ? "topNavDropdownItem active" : "topNavDropdownItem"} href="/reports">Centre rapports</a>
            <a className="topNavDropdownItem" href="/api/reports/global/docx">Rapport Word</a>
            <a className="topNavDropdownItem" href="/api/reports/global/pdf">Rapport PDF</a>
          </div>
        </details>
      )}

      <details className="topNavDropdown">
        <summary className={
          isActive("/admin") || isActive("/super-admin") || isActive("/aide")
            ? "topNavLink active"
            : "topNavLink"
        }>
          <Settings size={15} />
          Configuration
          <ChevronDown size={13} className="topNavChevron" />
        </summary>
        <div className="topNavDropdownPanel">
          {canManageTenant && (
            <>
              <a className="topNavDropdownItem" href="/admin#entities"><Building2 size={14} /> Entites</a>
              <a className="topNavDropdownItem" href="/admin#roles"><LockKeyhole size={14} /> Roles & droits</a>
              <a className="topNavDropdownItem" href="/admin#users"><Users size={14} /> Utilisateurs</a>
              <a className="topNavDropdownItem" href="/admin/referentiels"><SlidersHorizontal size={14} /> Referentiels</a>
              <a className="topNavDropdownItem" href="/admin/validation"><ListChecks size={14} /> Regles validation</a>
              <a className="topNavDropdownItem" href="/admin/security"><Shield size={14} /> Securite acces</a>
            </>
          )}
          {(canImport || canManageTenant) && (
            <a className="topNavDropdownItem" href="/admin/imports"><FileSpreadsheet size={14} /> Historique imports</a>
          )}
          {canAudit && (
            <a className="topNavDropdownItem" href="/admin/audit"><Shield size={14} /> Journal d&apos;audit</a>
          )}
          {canSuperAdmin && (
            <>
              {(canManageTenant || canImport || canAudit) && (
                <hr style={{ margin: "4px 0", border: "none", borderTop: "1px solid var(--line, #e2e8f0)" }} />
              )}
              <a className="topNavDropdownItem" href="/super-admin/tenants"><Crown size={14} /> Entreprises</a>
              <a className="topNavDropdownItem" href="/super-admin/operations"><Activity size={14} /> Exploitation</a>
            </>
          )}
          <hr style={{ margin: "4px 0", border: "none", borderTop: "1px solid var(--line, #e2e8f0)" }} />
          <a className={isActive("/aide") ? "topNavDropdownItem active" : "topNavDropdownItem"} href="/aide">
            <BookOpen size={14} /> Aide
          </a>
        </div>
      </details>
    </nav>
  );
}
