"use client";

import { useEffect, useState } from "react";
import { Plus, UserCog, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import type { Role, UserAccount } from "@/lib/admin-data";

type CompanyAdminManagerProps = {
  initialUsers: UserAccount[];
  initialDeletedUsers?: UserAccount[];
  roles: Role[];
  entities: string[];
  tenantId: string;
  userId: string;
  onUsersChange?: (users: UserAccount[]) => void;
  onDeletedUsersChange?: (deleted: UserAccount[]) => void;
};

export function CompanyAdminManager({ initialUsers, initialDeletedUsers = [], roles, entities, tenantId, userId, onUsersChange, onDeletedUsersChange }: CompanyAdminManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [deletedUsers, setDeletedUsers] = useState<UserAccount[]>(initialDeletedUsers);
  const [saveStatus, setSaveStatus] = useState("Synchronise");
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    entity: entities[0] ?? "",
    role: roles[0]?.name ?? "",
  });

  useEffect(() => {
    setUsers(initialUsers);
    setDeletedUsers(initialDeletedUsers);
    setDraft((current) => ({
      ...current,
      entity: entities[0] ?? "",
      role: roles[0]?.name ?? "",
    }));
  }, [entities, initialUsers, initialDeletedUsers, roles]);

  function daysUntilPurge(deletedAt: string): number {
    const diff = Date.now() - new Date(deletedAt).getTime();
    return Math.max(0, 30 - Math.floor(diff / (24 * 60 * 60 * 1000)));
  }

  async function deleteUser(account: UserAccount) {
    const optimisticUsers = users.filter((u) => u.id !== account.id);
    const trashed = { ...account, deletedAt: new Date().toISOString() };
    setUsers(optimisticUsers);
    setDeletedUsers((prev) => [trashed, ...prev]);
    onUsersChange?.(optimisticUsers);
    setSaveStatus("Suppression...");
    const response = await fetch(`/api/admin/users/${account.id}?tenantId=${tenantId}&userId=${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setUsers(users);
      setDeletedUsers((prev) => prev.filter((u) => u.id !== account.id));
      onUsersChange?.(users);
      setSaveStatus("Erreur suppression");
      return;
    }
    setSaveStatus("Synchronise");
  }

  async function restoreDeletedUser(account: UserAccount) {
    setDeletedUsers((prev) => prev.filter((u) => u.id !== account.id));
    const restored = { ...account, deletedAt: undefined, status: "Invite" as const };
    setUsers((prev) => [restored, ...prev]);
    onUsersChange?.([restored, ...users]);
    setSaveStatus("Restauration...");
    const response = await fetch(`/api/admin/users/${account.id}?tenantId=${tenantId}&userId=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    if (!response.ok) {
      setDeletedUsers((prev) => [account, ...prev]);
      setUsers((prev) => prev.filter((u) => u.id !== account.id));
      setSaveStatus("Erreur restauration");
      return;
    }
    setSaveStatus("Synchronise");
  }

  async function permanentDeleteUser(account: UserAccount) {
    setDeletedUsers((prev) => prev.filter((u) => u.id !== account.id));
    onDeletedUsersChange?.(deletedUsers.filter((u) => u.id !== account.id));
    setSaveStatus("Suppression definitive...");
    const response = await fetch(`/api/admin/users/${account.id}?tenantId=${tenantId}&userId=${userId}&permanent=true`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setDeletedUsers((prev) => [account, ...prev]);
      setSaveStatus("Erreur");
      return;
    }
    setSaveStatus("Synchronise");
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim() || !draft.email.trim()) {
      return;
    }

    setSaveStatus("Invitation...");
    const response = await fetch(`/api/admin/users?tenantId=${tenantId}&userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      setSaveStatus("Erreur invitation");
      return;
    }

    const payload = await response.json();
    const nextUsers = [payload.data as UserAccount, ...users];
    setUsers(nextUsers);
    onUsersChange?.(nextUsers);
    setDraft({ name: "", email: "", entity: entities[0] ?? "", role: roles[0]?.name ?? "" });
    setSaveStatus("Synchronise");
  }

  async function toggleStatus(account: UserAccount) {
    const nextStatus: UserAccount["status"] = account.status === "Actif" ? "Suspendu" : "Actif";
    const optimisticUsers = users.map((user) => (user.id === account.id ? { ...user, status: nextStatus } : user));
    setUsers(optimisticUsers);
    onUsersChange?.(optimisticUsers);
    setSaveStatus("Enregistrement...");

    const response = await fetch(`/api/admin/users/${account.id}?tenantId=${tenantId}&userId=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      setSaveStatus("Erreur sauvegarde");
      setUsers(users);
      onUsersChange?.(users);
      return;
    }

    setSaveStatus("Synchronise");
  }

  async function updateUserAssignment(account: UserAccount, patch: Partial<Pick<UserAccount, "entity" | "role">>) {
    const optimisticUsers = users.map((user) => (user.id === account.id ? { ...user, ...patch } : user));
    setUsers(optimisticUsers);
    onUsersChange?.(optimisticUsers);
    setSaveStatus("Enregistrement...");

    const response = await fetch(`/api/admin/users/${account.id}?tenantId=${tenantId}&userId=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setSaveStatus("Erreur sauvegarde");
      setUsers(users);
      onUsersChange?.(users);
      return;
    }

    const payload = await response.json();
    const persistedUsers = optimisticUsers.map((user) => (user.id === account.id ? payload.data as UserAccount : user));
    setUsers(persistedUsers);
    onUsersChange?.(persistedUsers);
    setSaveStatus("Synchronise");
  }

  return (
    <section className="splitGrid">
      <article className="panel">
        <div className="panelHeader">
          <div>
            <h2>Ajouter un utilisateur</h2>
            <p>Affectation a une entite et a un role de l'entreprise.</p>
          </div>
          <Plus size={22} />
        </div>
        <form className="tenantCreateForm" onSubmit={createUser}>
          <label>
            Nom
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>
            Email
            <input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
          </label>
          <label>
            Entite
            <select value={draft.entity} onChange={(event) => setDraft({ ...draft, entity: event.target.value })}>
              {entities.map((entity) => (
                <option value={entity} key={entity}>{entity}</option>
              ))}
            </select>
          </label>
          <label>
            Role
            <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })}>
              {roles.map((role) => (
                <option value={role.name} key={role.id}>{role.name}</option>
              ))}
            </select>
          </label>
          <button className="primaryButton" type="submit">
            <UserCog size={18} />
            Inviter l'utilisateur
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="panelHeader">
          <div>
            <h2>Comptes entreprise</h2>
            <p>Activation et suspension des utilisateurs de l'entreprise.</p>
          </div>
          <span className="status ok">{saveStatus}</span>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Entite</th>
                <th>Role</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>
                    <select
                      className="tableSelect"
                      value={user.entity}
                      onChange={(event) => updateUserAssignment(user, { entity: event.target.value })}
                    >
                      {entities.map((entity) => (
                        <option value={entity} key={entity}>{entity}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="tableSelect"
                      value={user.role}
                      onChange={(event) => updateUserAssignment(user, { role: event.target.value })}
                    >
                      {roles.map((role) => (
                        <option value={role.name} key={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={user.status === "Actif" ? "status ok" : "status warn"}>{user.status}</span>
                  </td>
                  <td style={{ display: "flex", gap: "6px" }}>
                    <button className="ghostButton" onClick={() => toggleStatus(user)} type="button">
                      {user.status === "Actif" ? "Suspendre" : "Activer"}
                    </button>
                    <button
                      className="ghostButton"
                      onClick={() => deleteUser(user)}
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

      {deletedUsers.length > 0 && (
        <article className="panel" style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
          <div className="panelHeader">
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Trash2 size={18} style={{ color: "var(--danger, #e11d48)" }} />
                Corbeille utilisateurs
              </h2>
              <p>Comptes supprimes — restauration possible, suppression definitive apres 30 jours.</p>
            </div>
            <span className="status warn">{deletedUsers.length} compte{deletedUsers.length > 1 ? "s" : ""}</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Supprime le</th>
                  <th>Jours restants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedUsers.map((account) => {
                  const days = account.deletedAt ? daysUntilPurge(account.deletedAt) : 0;
                  return (
                    <tr key={account.id}>
                      <td style={{ color: "var(--muted, #6b7280)", textDecoration: "line-through" }}>{account.name}</td>
                      <td>{account.email}</td>
                      <td>{account.role}</td>
                      <td>{account.deletedAt ? new Date(account.deletedAt).toLocaleDateString("fr-FR") : "—"}</td>
                      <td>
                        <span className={days <= 3 ? "status danger" : days <= 7 ? "status warn" : "status ok"}>
                          {days === 0 ? "Expire" : `${days}j`}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="ghostButton"
                          onClick={() => restoreDeletedUser(account)}
                          type="button"
                          style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <RotateCcw size={14} />
                          Restaurer
                        </button>
                        <button
                          className="ghostButton"
                          onClick={() => permanentDeleteUser(account)}
                          type="button"
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
        </article>
      )}
    </section>
  );
}
