"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

type Permission = "Voir" | "Importer" | "Valider" | "Exporter" | "Admin";

const ROLES = ["HSE_SITE", "HSE_GROUP", "IMPORT_USER", "VIEWER", "TENANT_ADMIN"];
const MODULES = ["Evenements", "Inspections", "Permis", "Actions", "Indicateurs", "EPI", "Alertes", "Rapports"];
const PERMISSIONS: Permission[] = ["Voir", "Importer", "Valider", "Exporter", "Admin"];

type MatrixKey = `${string}|${string}|${Permission}`;

const DEFAULT_MATRIX: Record<MatrixKey, boolean> = {} as Record<MatrixKey, boolean>;

// Initialize defaults
MODULES.forEach((mod) => {
  ROLES.forEach((role) => {
    PERMISSIONS.forEach((perm) => {
      const key: MatrixKey = `${role}|${mod}|${perm}`;
      DEFAULT_MATRIX[key] =
        (perm === "Voir") ||
        (perm === "Importer" && ["HSE_SITE", "HSE_GROUP", "IMPORT_USER", "TENANT_ADMIN"].includes(role)) ||
        (perm === "Valider" && ["HSE_GROUP", "TENANT_ADMIN"].includes(role)) ||
        (perm === "Exporter" && ["HSE_SITE", "HSE_GROUP", "TENANT_ADMIN"].includes(role)) ||
        (perm === "Admin" && role === "TENANT_ADMIN");
    });
  });
});

const ROLE_COLORS: Record<string, string> = {
  TENANT_ADMIN: "#0f766e",
  HSE_GROUP: "#2563eb",
  HSE_SITE: "#7c3aed",
  IMPORT_USER: "#b45309",
  VIEWER: "#64748b",
};

export function PermissionsMatrixPanel() {
  const [matrix, setMatrix] = useState({ ...DEFAULT_MATRIX });
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  function toggle(role: string, mod: string, perm: Permission) {
    const key: MatrixKey = `${role}|${mod}|${perm}`;
    setMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
    setChanged(true);
  }

  function get(role: string, mod: string, perm: Permission): boolean {
    return matrix[`${role}|${mod}|${perm}` as MatrixKey] ?? false;
  }

  const displayedRoles = selectedRole ? [selectedRole] : ROLES;

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>Matrice des droits par module</h2>
          <p>Droits fins par role et par module HSE — cliquer sur une cellule pour activer/desactiver.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(selectedRole === r ? null : r)}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                border: "1px solid",
                fontSize: 12,
                cursor: "pointer",
                background: selectedRole === r ? ROLE_COLORS[r] : "var(--surface)",
                color: selectedRole === r ? "#fff" : ROLE_COLORS[r],
                borderColor: ROLE_COLORS[r],
                fontWeight: 600,
              }}
            >
              {r.replace(/_/g, " ")}
            </button>
          ))}
          {changed && (
            <button
              type="button"
              className="primaryButton"
              style={{ fontSize: 12, padding: "4px 12px" }}
              onClick={() => setChanged(false)}
            >
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--line)", minWidth: 120 }}>Module</th>
              {displayedRoles.map((role) => (
                PERMISSIONS.map((perm) => (
                  <th
                    key={`${role}-${perm}`}
                    style={{ padding: "6px 4px", borderBottom: "1px solid var(--line)", textAlign: "center", minWidth: 52 }}
                  >
                    <div style={{ color: ROLE_COLORS[role], fontWeight: 700, fontSize: 10 }}>{role.replace(/_/g, " ")}</div>
                    <div style={{ color: "var(--muted)", fontWeight: 400 }}>{perm}</div>
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod, mIdx) => (
              <tr key={mod} style={{ background: mIdx % 2 === 0 ? "transparent" : "var(--hover)" }}>
                <td style={{ padding: "6px 12px", fontWeight: 600 }}>{mod}</td>
                {displayedRoles.map((role) => (
                  PERMISSIONS.map((perm) => {
                    const active = get(role, mod, perm);
                    return (
                      <td key={`${role}-${perm}`} style={{ textAlign: "center", padding: "4px" }}>
                        <button
                          type="button"
                          onClick={() => toggle(role, mod, perm)}
                          title={`${role} — ${mod} — ${perm}: ${active ? "Actif" : "Inactif"}`}
                          style={{
                            width: 26, height: 26,
                            borderRadius: 6,
                            border: "1px solid",
                            borderColor: active ? ROLE_COLORS[role] : "var(--line)",
                            background: active ? `${ROLE_COLORS[role]}18` : "transparent",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          {active
                            ? <Check size={12} style={{ color: ROLE_COLORS[role] }} />
                            : <X size={12} style={{ color: "var(--line)" }} />}
                        </button>
                      </td>
                    );
                  })
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, padding: "0 4px" }}>
        Les modifications sont appliquees en session uniquement — connectez une base de donnees pour persister les droits.
      </p>
    </section>
  );
}
