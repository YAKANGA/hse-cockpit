import { AccessGate } from "@/components/AccessGate";
import { AppSidebar } from "@/components/AppSidebar";
import { SuperAdminPortBadge } from "@/components/SuperAdminPortBadge";
import { demoSessions } from "@/lib/permissions";
import { tenants } from "@/lib/tenant-data";
import { Crown, Mail, Shield, User, Users } from "lucide-react";
import "../../globals.css";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Admin Tenant",
  HSE_GROUP: "HSE Groupe",
  HSE_SITE: "HSE Site",
  IMPORT_USER: "Importateur",
  VIEWER: "Lecteur",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "#7c3aed",
  TENANT_ADMIN: "#0f766e",
  HSE_GROUP: "#0369a1",
  HSE_SITE: "#0891b2",
  IMPORT_USER: "#b45309",
  VIEWER: "#64748b",
};

const mockUsers = [
  ...demoSessions,
  {
    userId: "hse-site-acme",
    name: "K. Bamba",
    email: "k.bamba@acme.local",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    role: "HSE_SITE" as const,
    permissions: [] as never[],
  },
  {
    userId: "viewer-acme",
    name: "P. Yao",
    email: "p.yao@acme.local",
    tenantId: "acme-btp",
    tenantName: "ACME BTP",
    role: "VIEWER" as const,
    permissions: [] as never[],
  },
  {
    userId: "tenant-admin-delta",
    name: "S. Traore",
    email: "s.traore@delta.local",
    tenantId: "delta-mining",
    tenantName: "Delta Mining",
    role: "TENANT_ADMIN" as const,
    permissions: [] as never[],
  },
  {
    userId: "hse-group-delta",
    name: "L. Coulibaly",
    email: "l.coulibaly@delta.local",
    tenantId: "delta-mining",
    tenantName: "Delta Mining",
    role: "HSE_GROUP" as const,
    permissions: [] as never[],
  },
  {
    userId: "tenant-admin-medlog",
    name: "M. Diallo",
    email: "m.diallo@medlog.local",
    tenantId: "medlog-ci",
    tenantName: "Medlog CI",
    role: "TENANT_ADMIN" as const,
    permissions: [] as never[],
  },
];

const totalUsers = tenants.reduce((sum, t) => sum + t.users, 0);
const roleCount = mockUsers.reduce<Record<string, number>>((acc, u) => {
  acc[u.role] = (acc[u.role] ?? 0) + 1;
  return acc;
}, {});

export default function SuperAdminUsersPage() {
  return (
    <main className="appShell">
      <AppSidebar />
      <AccessGate anyOf={["platform:manage-tenants"]} label="Gestion des utilisateurs">
        <section className="workspace">
          <SuperAdminPortBadge />

          <section className="adminHeader superAdminHeader">
            <p className="eyebrow">Super Admin</p>
            <h1>Gestion des utilisateurs</h1>
            <p>
              Vue globale de tous les utilisateurs de la plateforme, toutes entreprises confondues.
            </p>
          </section>

          {/* Stats */}
          <section className="tenantStats">
            <article>
              <span>Utilisateurs totaux</span>
              <strong>{totalUsers}</strong>
            </article>
            <article>
              <span>Entreprises</span>
              <strong>{tenants.length}</strong>
            </article>
            <article>
              <span>Admins tenant</span>
              <strong>{roleCount["TENANT_ADMIN"] ?? 0}</strong>
            </article>
            <article>
              <span>Super Admins</span>
              <strong>{roleCount["SUPER_ADMIN"] ?? 0}</strong>
            </article>
          </section>

          {/* Repartition par entreprise */}
          <section className="panel">
            <div className="panelHeader">
              <div>
                <h2>Repartition par entreprise</h2>
                <p>Nombre d&apos;utilisateurs et statut de chaque entreprise.</p>
              </div>
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    <th>Secteur</th>
                    <th>Pays</th>
                    <th>Statut</th>
                    <th>Utilisateurs</th>
                    <th>Administrateur</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: tenant.preferences.primaryColor,
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {tenant.preferences.logoText}
                          </span>
                          <strong>{tenant.name}</strong>
                        </div>
                      </td>
                      <td>{tenant.sector}</td>
                      <td>{tenant.country}</td>
                      <td>
                        <span className={
                          tenant.status === "Actif" ? "status ok" :
                          tenant.status === "Suspendu" ? "status danger" : "status warn"
                        }>
                          {tenant.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                          {tenant.users}
                        </span>
                      </td>
                      <td>{tenant.admin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Liste des comptes demo / privilegies */}
          <section className="panel">
            <div className="panelHeader">
              <div>
                <h2>Comptes et roles</h2>
                <p>Utilisateurs privilegies et comptes de demonstration de la plateforme.</p>
              </div>
              <button className="primaryButton" type="button">
                <Users size={15} /> Nouvel utilisateur
              </button>
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Entreprise</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => {
                    const initials = user.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const color = ROLE_COLORS[user.role] ?? "#64748b";
                    return (
                      <tr key={user.userId}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                background: color + "22",
                                color,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {initials}
                            </span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{user.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <Mail size={12} style={{ color: "#94a3b8" }} />
                            {user.email}
                          </span>
                        </td>
                        <td>
                          {user.tenantName ? (
                            <span>{user.tenantName}</span>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Crown size={12} style={{ color: "#7c3aed" }} />
                              <em style={{ color: "#7c3aed", fontSize: 12 }}>Plateforme</em>
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 8px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              background: color + "18",
                              color,
                            }}
                          >
                            <Shield size={11} />
                            {ROLE_LABELS[user.role] ?? user.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="secondaryButton"
                              type="button"
                              style={{ padding: "4px 10px", fontSize: 12 }}
                            >
                              Modifier
                            </button>
                            {user.role !== "SUPER_ADMIN" && (
                              <button
                                className="secondaryButton"
                                type="button"
                                style={{ padding: "4px 10px", fontSize: 12, color: "#ef4444" }}
                              >
                                Suspendre
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </AccessGate>
    </main>
  );
}
