"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Crown,
  FileDown,
  FileSpreadsheet,
  ListChecks,
  LockKeyhole,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { demoSessions } from "@/lib/permissions";
import { TenantModuleMenu } from "@/components/TenantModuleMenu";

export function RoleAwareNavigation() {
  const pathname = usePathname();
  const [userId, setUserId] = useState("tenant-admin-acme");
  const session = useMemo(
    () => demoSessions.find((item) => item.userId === userId) ?? demoSessions[1] ?? demoSessions[0],
    [userId],
  );
  const permissions = new Set(session.permissions);
  const canSuperAdmin = permissions.has("platform:manage-tenants");
  const canManageTenant = permissions.has("tenant:manage-settings")
    || permissions.has("tenant:manage-users")
    || permissions.has("tenant:manage-roles");
  const canAudit = permissions.has("audit:view");
  const canExport = permissions.has("module:export");
  const canImport = permissions.has("module:import");

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("hse-active-user");
    if (storedUserId && demoSessions.some((item) => item.userId === storedUserId)) {
      setUserId(storedUserId);
    }

    function handleSessionChange(event: Event) {
      const nextUserId = event instanceof CustomEvent
        ? String(event.detail)
        : window.localStorage.getItem("hse-active-user") ?? "";
      if (nextUserId && demoSessions.some((item) => item.userId === nextUserId)) {
        setUserId(nextUserId);
      }
    }

    window.addEventListener("hse-active-user-change", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);

    return () => {
      window.removeEventListener("hse-active-user-change", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, []);

  function navClass(href: string, exact = false) {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "#");
    return active ? "menuParent active" : "menuParent";
  }

  return (
    <nav className="menuTree" aria-label="Menu principal">
      <section className="menuGroup">
        <a className={navClass("/", true)} href="/">
          <BarChart3 size={17} />
          Synthese generale
        </a>
      </section>

      {permissions.has("module:view") ? (
        <section className="menuGroup">
          <a className={navClass("/alerts")} href="/alerts">
            <AlertTriangle size={17} />
            Alertes HSE
          </a>
        </section>
      ) : null}

      {permissions.has("module:view") ? (
        <details className="menuGroup" open>
          <summary className="menuParent">
            <Shield size={17} />
            Modules HSE
          </summary>
          <TenantModuleMenu />
        </details>
      ) : null}

      {canSuperAdmin ? (
        <details className="menuGroup" open>
          <summary className="menuParent">
            <Crown size={17} />
            Super Admin
          </summary>
          <div className="submenu">
            <a href="/super-admin/tenants">
              <Building2 size={15} />
              Entreprises
            </a>
            <a href="/super-admin/tenants#preferences">
              <Settings size={15} />
              Preferences
            </a>
            <a href="/super-admin/tenants#isolation">
              <LockKeyhole size={15} />
              Isolation
            </a>
            <a href="/super-admin/operations">
              <Activity size={15} />
              Exploitation
            </a>
          </div>
        </details>
      ) : null}

      {canManageTenant || canImport || canAudit ? (
        <details className="menuGroup" open={pathname.startsWith("/admin") || pathname.startsWith("/super-admin")}>
          <summary className={navClass("/admin")}>
            <Settings size={17} />
            Administration
          </summary>
          <div className="submenu">
            {canManageTenant ? (
              <>
                <a href="/admin#entities" className={pathname === "/admin" ? "active" : ""}>
                  <Building2 size={15} />
                  Entites
                </a>
                <a href="/admin#roles">
                  <LockKeyhole size={15} />
                  Roles & droits
                </a>
                <a href="/admin#users">
                  <Users size={15} />
                  Utilisateurs
                </a>
                <a href="/admin/referentiels" className={pathname === "/admin/referentiels" ? "active" : ""}>
                  <SlidersHorizontal size={15} />
                  Referentiels
                </a>
                <a href="/admin/validation" className={pathname === "/admin/validation" ? "active" : ""}>
                  <ListChecks size={15} />
                  Regles validation
                </a>
                <a href="/admin/security" className={pathname === "/admin/security" ? "active" : ""}>
                  <LockKeyhole size={15} />
                  Securite acces
                </a>
              </>
            ) : null}
            {canImport || canManageTenant ? (
              <a href="/admin/imports" className={pathname === "/admin/imports" ? "active" : ""}>
                <FileSpreadsheet size={15} />
                Historique imports
              </a>
            ) : null}
            {canAudit ? (
              <a href="/admin/audit" className={pathname === "/admin/audit" ? "active" : ""}>
                <Shield size={15} />
                Journal d'audit
              </a>
            ) : null}
          </div>
        </details>
      ) : null}

      {canExport ? (
        <details className="menuGroup" open={pathname.startsWith("/reports")}>
          <summary className={navClass("/reports")}>
            <FileDown size={17} />
            Rapports
          </summary>
          <div className="submenu">
            <a href="/reports" className={pathname === "/reports" ? "active" : ""}>Centre rapports</a>
            <a href="/api/reports/global/docx">Rapport Word</a>
            <a href="/api/reports/global/pdf">Rapport PDF</a>
          </div>
        </details>
      ) : null}

      <span className="submenuHint roleMenuHint">Menu adapte au role {session.role}</span>
    </nav>
  );
}
