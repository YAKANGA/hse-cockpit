"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCockpitFilter } from "@/lib/use-cockpit-filter";

type ThemeRow = {
  theme: string;
  realises: number;
  conformes: number;
  nonConformes: number;
  partiels: number;
};

const THEMES: ThemeRow[] = [
  { theme: "Securite incendie",    realises: 48, conformes: 38, nonConformes: 6,  partiels: 4 },
  { theme: "Produits chimiques",   realises: 41, conformes: 24, nonConformes: 11, partiels: 6 },
  { theme: "Equipements levage",   realises: 37, conformes: 31, nonConformes: 3,  partiels: 3 },
  { theme: "Echafaudages",         realises: 44, conformes: 30, nonConformes: 8,  partiels: 6 },
  { theme: "EPI / protections",    realises: 52, conformes: 40, nonConformes: 7,  partiels: 5 },
  { theme: "Signalisation",        realises: 35, conformes: 28, nonConformes: 4,  partiels: 3 },
  { theme: "Permis de travail",    realises: 39, conformes: 34, nonConformes: 2,  partiels: 3 },
  { theme: "Plans d'evacuation",   realises: 30, conformes: 18, nonConformes: 9,  partiels: 3 },
];

const TREND = [
  { mois: "Jan", txConformite: 68, ecarts: 22 },
  { mois: "Fev", txConformite: 71, ecarts: 19 },
  { mois: "Mar", txConformite: 69, ecarts: 21 },
  { mois: "Avr", txConformite: 74, ecarts: 17 },
  { mois: "Mai", txConformite: 76, ecarts: 15 },
  { mois: "Juin", txConformite: 74, ecarts: 16 },
];

const SEUIL = 80;
type Period = "3m" | "6m" | "Tout";
const PERIODS: { label: string; value: Period }[] = [
  { label: "3 mois", value: "3m" },
  { label: "6 mois", value: "6m" },
  { label: "Tout", value: "Tout" },
];

export function InspectionsConformitePanel() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<Period>("6m");
  useCockpitFilter();
  useEffect(() => { setMounted(true); }, []);

  const trendData = useMemo(() => {
    if (period === "3m") return TREND.slice(-3);
    if (period === "6m") return TREND.slice(-6);
    return TREND;
  }, [period]);

  const withRate = useMemo(
    () =>
      THEMES.map((t) => ({
        ...t,
        txConformite: t.realises ? Math.round((t.conformes / t.realises) * 100) : 0,
      })).sort((a, b) => a.txConformite - b.txConformite),
    [],
  );

  const sousSeuil = withRate.filter((t) => t.txConformite < SEUIL);
  const globalTx = Math.round(
    withRate.reduce((s, t) => s + t.conformes, 0) /
    withRate.reduce((s, t) => s + t.realises, 0) * 100,
  );

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Conformite par theme d&apos;inspection</h2>
          <p>
            {sousSeuil.length} theme{sousSeuil.length > 1 ? "s" : ""} sous le seuil de {SEUIL}% — conformite globale : {globalTx}%.
          </p>
        </div>
        <div className="periodToggle">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={period === p.value ? "periodBtn active" : "periodBtn"}
              onClick={() => setPeriod(p.value)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="inspKpis">
        {[
          { label: "Inspections realisees", value: withRate.reduce((s, t) => s + t.realises, 0), color: "#0f766e" },
          { label: "Conformes",             value: withRate.reduce((s, t) => s + t.conformes, 0), color: "#047857" },
          { label: "Non conformes",         value: withRate.reduce((s, t) => s + t.nonConformes, 0), color: "#dc2626" },
          { label: "Themes sous seuil",     value: sousSeuil.length, color: "#d97706" },
        ].map((k) => (
          <div className="inspKpiCard" key={k.label} style={{ "--insp-color": k.color } as React.CSSProperties}>
            <span>{k.label}</span>
            <strong>{k.value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Conformite par theme</h2>
              <p>Taux de conformite classe par risque — seuil cible {SEUIL}%.</p>
            </div>
          </div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={withRate} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="theme" width={130} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, "Conformite"]} />
                  <ReferenceLine x={SEUIL} stroke="#d97706" strokeDasharray="5 4" label={{ value: `Seuil ${SEUIL}%`, position: "top", fill: "#d97706", fontSize: 11 }} />
                  <Bar dataKey="txConformite" name="Conformite %" radius={[0, 4, 4, 0]}>
                    {withRate.map((t) => (
                      <Cell key={t.theme} fill={t.txConformite >= SEUIL ? "#0f766e" : t.txConformite >= 65 ? "#d97706" : "#dc2626"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Evolution mensuelle</h2>
              <p>Taux de conformite et nombre d&apos;ecarts ouverts.</p>
            </div>
          </div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={SEUIL} stroke="#d97706" strokeDasharray="5 4" label={{ value: `${SEUIL}%`, position: "insideTopLeft", fill: "#d97706", fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="txConformite" name="Conformite %" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="ecarts" name="Ecarts ouverts" stroke="#dc2626" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>

      {sousSeuil.length > 0 && (
        <article className="panel" style={{ marginTop: 18, borderLeft: "3px solid #d97706" }}>
          <div className="panelHeader">
            <div>
              <h2>Themes sous le seuil — action requise</h2>
              <p>{sousSeuil.length} theme{sousSeuil.length > 1 ? "s" : ""} necessitent une contre-visite ou un plan correctif.</p>
            </div>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>Theme</th><th>Realises</th><th>Conformes</th><th>Non conformes</th><th>Conformite</th><th>Action</th></tr>
              </thead>
              <tbody>
                {sousSeuil.map((t) => (
                  <tr key={t.theme}>
                    <td><strong>{t.theme}</strong></td>
                    <td>{t.realises}</td>
                    <td>{t.conformes}</td>
                    <td><span className="status danger">{t.nonConformes}</span></td>
                    <td><strong style={{ color: t.txConformite < 65 ? "#dc2626" : "#d97706" }}>{t.txConformite}%</strong></td>
                    <td><span className="status warn">Contre-visite</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
}
