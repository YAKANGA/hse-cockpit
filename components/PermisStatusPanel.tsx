"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Permis = {
  id: string;
  type: string;
  zone: string;
  site: string;
  responsable: string;
  debut: string;
  fin: string;
  validationHse: boolean;
  statut: "Actif" | "Expire" | "Cloture" | "En attente";
};

const PERMIS: Permis[] = [
  { id: "PTR-001", type: "Travail a chaud",  zone: "Zone C - Soudure",    site: "Abidjan",       responsable: "K. Yao",     debut: "01/06/2026", fin: "08/06/2026", validationHse: true,  statut: "Actif" },
  { id: "PTR-002", type: "Hauteur",          zone: "Echafaudage N°4",     site: "Bouake",        responsable: "M. Diallo",  debut: "29/05/2026", fin: "05/06/2026", validationHse: true,  statut: "Expire" },
  { id: "PTR-003", type: "Espace confine",   zone: "Cuve de stockage",    site: "Abidjan",       responsable: "A. Kouadio", debut: "03/06/2026", fin: "10/06/2026", validationHse: false, statut: "En attente" },
  { id: "PTR-004", type: "Electrique",       zone: "TGBT Principal",      site: "Yamoussoukro",  responsable: "S. Traore",  debut: "02/06/2026", fin: "04/06/2026", validationHse: true,  statut: "Cloture" },
  { id: "PTR-005", type: "Levage",           zone: "Grue mobile GZ-12",   site: "San Pedro",     responsable: "N. Kone",    debut: "04/06/2026", fin: "11/06/2026", validationHse: true,  statut: "Actif" },
  { id: "PTR-006", type: "Travail a chaud",  zone: "Zone D - Decoupe",    site: "Bouake",        responsable: "K. Yao",     debut: "31/05/2026", fin: "02/06/2026", validationHse: true,  statut: "Expire" },
  { id: "PTR-007", type: "Hauteur",          zone: "Toiture Batiment B",  site: "Abidjan",       responsable: "M. Diallo",  debut: "05/06/2026", fin: "12/06/2026", validationHse: true,  statut: "Actif" },
  { id: "PTR-008", type: "Espace confine",   zone: "Egout collecteur",    site: "San Pedro",     responsable: "A. Kouadio", debut: "06/06/2026", fin: "07/06/2026", validationHse: false, statut: "En attente" },
  { id: "PTR-009", type: "Levage",           zone: "Pont roulant R-5",    site: "Yamoussoukro",  responsable: "S. Traore",  debut: "28/05/2026", fin: "01/06/2026", validationHse: true,  statut: "Expire" },
  { id: "PTR-010", type: "Electrique",       zone: "Armoire AT Batiment", site: "Abidjan",       responsable: "N. Kone",    debut: "04/06/2026", fin: "05/06/2026", validationHse: true,  statut: "Actif" },
];

const STATUS_COLOR: Record<string, string> = {
  Actif:        "#0f766e",
  Expire:       "#dc2626",
  Cloture:      "#64748b",
  "En attente": "#d97706",
};

const TYPE_COLORS = ["#0f766e", "#2563eb", "#c2410c", "#7c3aed", "#b45309"];

const SITES = ["Tous", ...Array.from(new Set(PERMIS.map((p) => p.site)))];

export function PermisStatusPanel() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<string>("Tous");
  const [site, setSite] = useState<string>("Tous");
  useEffect(() => { setMounted(true); }, []);

  const siteFiltered = useMemo(
    () => (site === "Tous" ? PERMIS : PERMIS.filter((p) => p.site === site)),
    [site],
  );

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    siteFiltered.forEach((p) => { map[p.type] = (map[p.type] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [siteFiltered]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    siteFiltered.forEach((p) => { map[p.statut] = (map[p.statut] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [siteFiltered]);

  const filtered = useMemo(
    () => (filter === "Tous" ? siteFiltered : siteFiltered.filter((p) => p.statut === filter)),
    [filter, siteFiltered],
  );

  const withoutHse = siteFiltered.filter((p) => !p.validationHse);
  const actifs = siteFiltered.filter((p) => p.statut === "Actif").length;
  const expires = siteFiltered.filter((p) => p.statut === "Expire").length;

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Suivi des permis de travail dangereux</h2>
          <p>
            {actifs} actif{actifs > 1 ? "s" : ""} — {expires} expire{expires > 1 ? "s" : ""} — {withoutHse.length} sans validation HSE.
          </p>
        </div>
        <div className="periodToggle">
          <label style={{ fontSize: 13, color: "var(--muted)" }}>Site :</label>
          <select
            value={site}
            onChange={(e) => { setSite(e.target.value); setFilter("Tous"); }}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13 }}
          >
            {SITES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="permisKpis">
        {Object.entries(STATUS_COLOR).map(([statut, color]) => {
          const count = PERMIS.filter((p) => p.statut === statut).length;
          return (
            <div
              className="permisKpiCard"
              key={statut}
              style={{ "--permis-color": color } as React.CSSProperties}
              onClick={() => setFilter(filter === statut ? "Tous" : statut)}
              role="button"
              tabIndex={0}
            >
              <span>{statut}</span>
              <strong>{count}</strong>
              <small>{Math.round((count / PERMIS.length) * 100)}%</small>
            </div>
          );
        })}
        <div className="permisKpiCard" style={{ "--permis-color": "#7c3aed" } as React.CSSProperties}>
          <span>Sans validation HSE</span>
          <strong style={{ color: withoutHse.length > 0 ? "#dc2626" : "#0f766e" }}>{withoutHse.length}</strong>
          <small>Bloquer avant execution</small>
        </div>
      </div>

      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Volume par type de permis</h2>
              <p>Repartition des permis dangereux emis par categorie.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Permis" radius={[4, 4, 0, 0]}>
                    {byType.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Repartition par statut</h2>
              <p>Actifs, expires, clos et en attente de validation.</p>
            </div>
          </div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={40} label={({ name, value }) => `${name}: ${value}`}>
                    {byStatus.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLOR[entry.name] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>

      <article className="panel" style={{ marginTop: 18 }}>
        <div className="panelHeader">
          <div>
            <h2>Registre des permis</h2>
            <p>Cliquer sur un statut ci-dessus pour filtrer — {filtered.length} permis affiches.</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Tous", "Actif", "En attente", "Expire", "Cloture"].map((s) => (
              <button
                key={s}
                className={filter === s ? "periodBtn active" : "periodBtn"}
                onClick={() => setFilter(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Type</th><th>Zone</th><th>Site</th><th>Responsable</th><th>Debut</th><th>Fin</th><th>Validation HSE</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td><code style={{ fontSize: 12 }}>{p.id}</code></td>
                  <td>{p.type}</td>
                  <td>{p.zone}</td>
                  <td>{p.site}</td>
                  <td>{p.responsable}</td>
                  <td>{p.debut}</td>
                  <td>{p.fin}</td>
                  <td>
                    <span className={p.validationHse ? "status ok" : "status danger"}>
                      {p.validationHse ? "Validé" : "Manquante"}
                    </span>
                  </td>
                  <td>
                    <span className="status" style={{ background: `${STATUS_COLOR[p.statut]}22`, color: STATUS_COLOR[p.statut] }}>
                      {p.statut}
                    </span>
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
