"use client";

import { useEffect, useState } from "react";
import { Plus, UserCog } from "lucide-react";
import type { Role, UserAccount } from "@/lib/admin-data";

type CompanyAdminManagerProps = {
  initialUsers: UserAccount[];
  roles: Role[];
  entities: string[];
  tenantId: string;
  userId: string;
  onUsersChange?: (users: UserAccount[]) => void;
};

export function CompanyAdminManager({ initialUsers, roles, entities, tenantId, userId, onUsersChange }: CompanyAdminManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [saveStatus, setSaveStatus] = useState("Synchronise");
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    entity: entities[0] ?? "",
    role: roles[0]?.name ?? "",
  });

  useEffect(() => {
    setUsers(initialUsers);
    setDraft((current) => ({
      ...current,
      entity: entities[0] ?? "",
      role: roles[0]?.name ?? "",
    }));
  }, [entities, initialUsers, roles]);

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
                  <td>
                    <button className="ghostButton" onClick={() => toggleStatus(user)} type="button">
                      {user.status === "Actif" ? "Suspendre" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
