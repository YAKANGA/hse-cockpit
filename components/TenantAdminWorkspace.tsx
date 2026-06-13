"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ShieldCheck, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { CompanyAdminManager } from "@/components/CompanyAdminManager";
import type { Entity, Role, UserAccount } from "@/lib/admin-data";
import { rightsMatrix as initialRightsMatrix, roles as initialRoles, users as initialUsers } from "@/lib/admin-data";
import { demoSessions, type Permission } from "@/lib/permissions";
import { tenants } from "@/lib/tenant-data";

type RightsMatrixRow = typeof initialRightsMatrix[number];
const manageablePermissions: Permission[] = [
  "tenant:manage-settings",
  "tenant:manage-users",
  "tenant:manage-roles",
  "module:view",
  "module:import",
  "module:validate",
  "module:export",
  "audit:view",
];

export function TenantAdminWorkspace() {
  const [tenantId, setTenantId] = useState("acme-btp");
  const [userId, setUserId] = useState("tenant-admin-acme");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [deletedEntities, setDeletedEntities] = useState<Entity[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [rightsMatrix, setRightsMatrix] = useState<RightsMatrixRow[]>(initialRightsMatrix);
  const [loadStatus, setLoadStatus] = useState("Chargement...");
  const [entityStatus, setEntityStatus] = useState("Synchronise");
  const [entityDraft, setEntityDraft] = useState<{ name: string; type: Entity["type"] }>({
    name: "",
    type: "Site",
  });
  const [roleStatus, setRoleStatus] = useState("Synchronise");
  const [roleDraft, setRoleDraft] = useState<{
    name: string;
    scope: string;
    description: string;
    permissions: Permission[];
  }>({
    name: "",
    scope: "Entreprise",
    description: "",
    permissions: ["module:view"],
  });
  const tenant = tenants.find((item) => item.id === tenantId);
  const activeEntities = useMemo(() => entities.filter((entity) => entity.active), [entities]);

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
    async function loadTenantAdmin() {
      setLoadStatus("Chargement...");
      const response = await fetch(`/api/admin/users?tenantId=${tenantId}&userId=${userId}`);

      if (!response.ok) {
        setLoadStatus(`Acces refuse (${response.status})`);
        return;
      }

      const payload = await response.json();
      setEntities(payload.entities);
      setDeletedEntities(payload.deletedEntities ?? []);
      setRoles(payload.roles);
      setUsers(payload.users);
      setDeletedUsers(payload.deletedUsers ?? []);
      setRightsMatrix(payload.rightsMatrix);
      setLoadStatus("Synchronise");
    }

    loadTenantAdmin();
  }, [tenantId, userId]);

  async function createEntity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!entityDraft.name.trim()) {
      return;
    }

    setEntityStatus("Creation...");
    const response = await fetch(`/api/admin/entities?tenantId=${tenantId}&userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entityDraft),
    });

    if (!response.ok) {
      setEntityStatus(`Erreur (${response.status})`);
      return;
    }

    const payload = await response.json();
    setEntities((current) => [payload.data, ...current]);
    setEntityDraft({ name: "", type: "Site" });
    setEntityStatus("Synchronise");
  }

  function daysUntilPurge(deletedAt: string): number {
    const diff = Date.now() - new Date(deletedAt).getTime();
    return Math.max(0, 30 - Math.floor(diff / (24 * 60 * 60 * 1000)));
  }

  async function deleteEntity(entity: Entity) {
    const optimistic = entities.filter((e) => e.id !== entity.id);
    setEntities(optimistic);
    const trashed = { ...entity, deletedAt: new Date().toISOString(), active: false };
    setDeletedEntities((prev) => [trashed, ...prev]);
    setEntityStatus("Suppression...");
    const response = await fetch(`/api/admin/entities/${entity.id}?tenantId=${tenantId}&userId=${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setEntities(entities);
      setDeletedEntities((prev) => prev.filter((e) => e.id !== entity.id));
      setEntityStatus(`Erreur (${response.status})`);
      return;
    }
    setEntityStatus("Synchronise");
  }

  async function restoreDeletedEntity(entity: Entity) {
    setDeletedEntities((prev) => prev.filter((e) => e.id !== entity.id));
    setEntities((prev) => [{ ...entity, deletedAt: undefined, active: true }, ...prev]);
    setEntityStatus("Restauration...");
    const response = await fetch(`/api/admin/entities/${entity.id}?tenantId=${tenantId}&userId=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    if (!response.ok) {
      setDeletedEntities((prev) => [entity, ...prev]);
      setEntities((prev) => prev.filter((e) => e.id !== entity.id));
      setEntityStatus(`Erreur (${response.status})`);
      return;
    }
    setEntityStatus("Synchronise");
  }

  async function permanentDelete(entity: Entity) {
    setDeletedEntities((prev) => prev.filter((e) => e.id !== entity.id));
    setEntityStatus("Suppression definitive...");
    const response = await fetch(`/api/admin/entities/${entity.id}?tenantId=${tenantId}&userId=${userId}&permanent=true`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setDeletedEntities((prev) => [entity, ...prev]);
      setEntityStatus(`Erreur (${response.status})`);
      return;
    }
    setEntityStatus("Synchronise");
  }

  async function toggleEntity(entity: Entity) {
    const nextActive = !entity.active;
    const optimisticEntities = entities.map((item) => (item.id === entity.id ? { ...item, active: nextActive } : item));
    setEntities(optimisticEntities);
    setEntityStatus("Enregistrement...");

    const response = await fetch(`/api/admin/entities/${entity.id}?tenantId=${tenantId}&userId=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextActive }),
    });

    if (!response.ok) {
      setEntities(entities);
      setEntityStatus(`Erreur (${response.status})`);
      return;
    }

    setEntityStatus("Synchronise");
  }

  function toggleDraftPermission(permission: Permission) {
    setRoleDraft((current) => {
      const nextPermissions = current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission];

      return { ...current, permissions: nextPermissions };
    });
  }

  async function createRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!roleDraft.name.trim()) {
      return;
    }

    setRoleStatus("Creation...");
    const response = await fetch(`/api/admin/roles?tenantId=${tenantId}&userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roleDraft),
    });

    if (!response.ok) {
      setRoleStatus(`Erreur (${response.status})`);
      return;
    }

    const payload = await response.json();
    setRoles((current) => [payload.data, ...current]);
    setRightsMatrix((current) => [
      {
        role: payload.data.name,
        perimetre: payload.data.scope,
        modules: payload.data.permissions.includes("module:view") ? "Modules autorises" : "Administration",
        actions: payload.data.permissions.join(", "),
      },
      ...current,
    ]);
    setRoleDraft({ name: "", scope: "Entreprise", description: "", permissions: ["module:view"] });
    setRoleStatus("Synchronise");
  }

  async function toggleRole(role: Role) {
    const nextActive = !role.active;
    const optimisticRoles = roles.map((item) => (item.id === role.id ? { ...item, active: nextActive } : item));
    setRoles(optimisticRoles);
    setRoleStatus("Enregistrement...");

    const response = await fetch(`/api/admin/roles/${role.id}?tenantId=${tenantId}&userId=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextActive }),
    });

    if (!response.ok) {
      setRoles(roles);
      setRoleStatus(`Erreur (${response.status})`);
      return;
    }

    setRoleStatus("Synchronise");
  }

  return (
    <>
      <section className="adminHeader">
        <p className="eyebrow">Administration</p>
        <h1>Administration entreprise</h1>
        <p>
          Gestion des roles, utilisateurs et droits pour {tenant?.name ?? "l'entreprise active"}.
          Les donnees restent rattachees a cette entreprise uniquement.
        </p>
      </section>

      <section className="adminStats">
        <article>
          <span>Entites actives</span>
          <strong>{activeEntities.length}</strong>
        </article>
        <article>
          <span>Roles configures</span>
          <strong>{roles.length}</strong>
        </article>
        <article>
          <span>Utilisateurs</span>
          <strong>{users.length}</strong>
        </article>
        <article>
          <span>Etat donnees</span>
          <strong className="compactValue">{loadStatus}</strong>
        </article>
      </section>

      <CompanyAdminManager
        initialUsers={users}
        initialDeletedUsers={deletedUsers}
        roles={roles}
        entities={activeEntities.map((entity) => entity.name)}
        tenantId={tenantId}
        userId={userId}
        onUsersChange={setUsers}
        onDeletedUsersChange={setDeletedUsers}
      />

      <section className="splitGrid">
        <article className="panel" id="entities">
          <div className="panelHeader">
            <div>
              <h2>Entites</h2>
              <p>Sites, projets, directions et perimetres de rattachement.</p>
            </div>
            <span className="status ok">{entityStatus}</span>
          </div>
          <form className="tenantCreateForm entityCreateForm" onSubmit={createEntity}>
            <label>
              Nom entite
              <input value={entityDraft.name} onChange={(event) => setEntityDraft({ ...entityDraft, name: event.target.value })} />
            </label>
            <label>
              Type
              <select value={entityDraft.type} onChange={(event) => setEntityDraft({ ...entityDraft, type: event.target.value as Entity["type"] })}>
                <option>Site</option>
                <option>Projet</option>
                <option>Direction</option>
                <option>Groupe</option>
              </select>
            </label>
            <button className="primaryButton" type="submit">
              <Plus size={18} />
              Creer entite
            </button>
          </form>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Entite</th>
                  <th>Type</th>
                  <th>Utilisateurs</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity) => (
                  <tr key={entity.id}>
                    <td>{entity.name}</td>
                    <td>{entity.type}</td>
                    <td>{entity.users}</td>
                    <td><span className={entity.active ? "status ok" : "status warn"}>{entity.active ? "Active" : "Inactive"}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button className="ghostButton" onClick={() => toggleEntity(entity)} type="button">
                        {entity.active ? "Suspendre" : "Activer"}
                      </button>
                      <button
                        className="ghostButton"
                        onClick={() => deleteEntity(entity)}
                        type="button"
                        style={{ color: "var(--danger, #e11d48)", borderColor: "var(--danger, #e11d48)" }}
                        title="Supprimer (corbeille 30 jours)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel" id="roles">
          <div className="panelHeader">
            <div>
              <h2>Roles</h2>
              <p>Profils applicatifs et perimetres de responsabilite.</p>
            </div>
            <span className="status ok">{roleStatus}</span>
          </div>
          <form className="tenantCreateForm roleCreateForm" onSubmit={createRole}>
            <label>
              Nom role
              <input value={roleDraft.name} onChange={(event) => setRoleDraft({ ...roleDraft, name: event.target.value })} />
            </label>
            <label>
              Perimetre
              <select value={roleDraft.scope} onChange={(event) => setRoleDraft({ ...roleDraft, scope: event.target.value })}>
                <option>Entreprise</option>
                <option>Entite</option>
                <option>Module</option>
                <option>Lecture</option>
              </select>
            </label>
            <label>
              Description
              <input value={roleDraft.description} onChange={(event) => setRoleDraft({ ...roleDraft, description: event.target.value })} />
            </label>
            <div className="permissionToggleGrid">
              {manageablePermissions.map((permission) => (
                <label key={permission}>
                  <input
                    checked={roleDraft.permissions.includes(permission)}
                    onChange={() => toggleDraftPermission(permission)}
                    type="checkbox"
                  />
                  {permission}
                </label>
              ))}
            </div>
            <button className="primaryButton" type="submit">
              <ShieldCheck size={18} />
              Creer role
            </button>
          </form>
          <div className="roleList">
            {roles.map((role) => (
              <article key={role.id}>
                <div className="roleListHeader">
                  <div>
                    <strong>{role.name}</strong>
                    <span>{role.scope} - {role.active ? "Actif" : "Suspendu"}</span>
                  </div>
                  <button className="ghostButton" onClick={() => toggleRole(role)} type="button">
                    {role.active ? "Suspendre" : "Activer"}
                  </button>
                </div>
                <p>{role.description}</p>
                <small>{role.permissions.join(", ")}</small>
              </article>
            ))}
          </div>
        </article>
      </section>

      {deletedEntities.length > 0 && (
        <section className="panel" id="trash" style={{ marginBottom: "1.5rem" }}>
          <div className="panelHeader">
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Trash2 size={18} style={{ color: "var(--danger, #e11d48)" }} />
                Corbeille
              </h2>
              <p>Entites supprimees — restauration possible, suppression definitive apres 30 jours.</p>
            </div>
            <span className="status warn">{deletedEntities.length} element{deletedEntities.length > 1 ? "s" : ""}</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Entite</th>
                  <th>Type</th>
                  <th>Supprime le</th>
                  <th>Jours restants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedEntities.map((entity) => {
                  const days = entity.deletedAt ? daysUntilPurge(entity.deletedAt) : 0;
                  return (
                    <tr key={entity.id}>
                      <td style={{ color: "var(--muted, #6b7280)", textDecoration: "line-through" }}>{entity.name}</td>
                      <td>{entity.type}</td>
                      <td>{entity.deletedAt ? new Date(entity.deletedAt).toLocaleDateString("fr-FR") : "—"}</td>
                      <td>
                        <span className={days <= 3 ? "status danger" : days <= 7 ? "status warn" : "status ok"}>
                          {days === 0 ? "Expire" : `${days}j`}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="ghostButton"
                          onClick={() => restoreDeletedEntity(entity)}
                          type="button"
                          title="Restaurer l'entite"
                          style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <RotateCcw size={14} />
                          Restaurer
                        </button>
                        <button
                          className="ghostButton"
                          onClick={() => permanentDelete(entity)}
                          type="button"
                          title="Supprimer definitivement"
                          style={{ color: "var(--danger, #e11d48)", borderColor: "var(--danger, #e11d48)", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <AlertTriangle size={14} />
                          Supprimer def.
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="splitGrid">
        <article className="panel" id="users">
          <div className="panelHeader">
            <div>
              <h2>Utilisateurs</h2>
              <p>Comptes rattaches aux entites creees.</p>
            </div>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Entite</th>
                  <th>Role</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.entity}</td>
                    <td>{user.role}</td>
                    <td><span className={user.status === "Actif" ? "status ok" : "status warn"}>{user.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Matrice des droits</h2>
              <p>Droits par role et par niveau d'action.</p>
            </div>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Modules</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rightsMatrix.map((right) => (
                  <tr key={right.role}>
                    <td>{right.role}</td>
                    <td>{right.modules}</td>
                    <td>{right.actions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}
