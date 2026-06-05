"use client";

import { useMemo, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { AppSession, Permission } from "@/lib/permissions";
import type { Tenant } from "@/lib/tenant-data";

type AccessControlSimulatorProps = {
  sessions: AppSession[];
  tenants: Tenant[];
  permissions: Permission[];
};

const permissionLabels: Record<Permission, string> = {
  "platform:manage-tenants": "Gerer entreprises",
  "tenant:manage-settings": "Parametrer entreprise",
  "tenant:manage-users": "Gerer utilisateurs",
  "tenant:manage-roles": "Gerer roles",
  "module:view": "Voir modules",
  "module:import": "Importer Excel",
  "module:validate": "Valider donnees",
  "module:export": "Exporter rapports",
  "audit:view": "Voir audit",
};

export function AccessControlSimulator({ sessions, tenants, permissions }: AccessControlSimulatorProps) {
  const [userId, setUserId] = useState(sessions[0]?.userId ?? "");
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");

  const session = useMemo(
    () => sessions.find((item) => item.userId === userId) ?? sessions[0],
    [sessions, userId],
  );
  const tenant = useMemo(
    () => tenants.find((item) => item.id === tenantId) ?? tenants[0],
    [tenants, tenantId],
  );
  const canAccessTenant = session.role === "SUPER_ADMIN" || session.tenantId === tenant.id;

  return (
    <section className="splitGrid">
      <article className="panel">
        <div className="panelHeader">
          <div>
            <h2>Simulation d'acces</h2>
            <p>Controle role, entreprise cible et permissions effectives.</p>
          </div>
          <LockKeyhole size={22} />
        </div>

        <div className="filterBar accessFilters">
          <label>
            Utilisateur
            <select value={userId} onChange={(event) => setUserId(event.target.value)}>
              {sessions.map((item) => (
                <option key={item.userId} value={item.userId}>
                  {item.name} - {item.role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Entreprise cible
            <select value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
              {tenants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="accessDecision">
          <span className={canAccessTenant ? "status ok" : "status warn"}>
            {canAccessTenant ? "Acces autorise" : "Acces refuse"}
          </span>
          <strong>{session.name}</strong>
          <p>
            Role {session.role}. Perimetre session: {session.tenantName ?? "Plateforme"}.
            Entreprise demandee: {tenant.name}.
          </p>
        </div>
      </article>

      <article className="panel">
        <div className="panelHeader">
          <div>
            <h2>Permissions effectives</h2>
            <p>Droits applicables au profil selectionne.</p>
          </div>
          <ShieldCheck size={22} />
        </div>
        <div className="permissionGrid">
          {permissions.map((permission) => {
            const enabled = session.permissions.includes(permission);
            return (
              <span className={enabled ? "enabled" : ""} key={permission}>
                {permissionLabels[permission]}
              </span>
            );
          })}
        </div>
      </article>
    </section>
  );
}
