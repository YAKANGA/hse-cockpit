"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";

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

const THEMES_SITES: Record<string, ThemeRow[]> = {
  "Abidjan": [
    { theme:"Securite incendie",   realises:20, conformes:16, nonConformes:2, partiels:2 },
    { theme:"Produits chimiques",  realises:17, conformes:10, nonConformes:5, partiels:2 },
    { theme:"Equipements levage",  realises:15, conformes:13, nonConformes:1, partiels:1 },
    { theme:"Echafaudages",        realises:18, conformes:12, nonConformes:4, partiels:2 },
    { theme:"EPI / protections",   realises:22, conformes:17, nonConformes:3, partiels:2 },
    { theme:"Signalisation",       realises:14, conformes:11, nonConformes:2, partiels:1 },
    { theme:"Permis de travail",   realises:16, conformes:14, nonConformes:1, partiels:1 },
    { theme:"Plans d'evacuation",  realises:12, conformes: 7, nonConformes:4, partiels:1 },
  ],
  "Bouake": [
    { theme:"Securite incendie",   realises:12, conformes:10, nonConformes:2, partiels:0 },
    { theme:"Produits chimiques",  realises:10, conformes: 6, nonConformes:3, partiels:1 },
    { theme:"Equipements levage",  realises: 9, conformes: 7, nonConformes:1, partiels:1 },
    { theme:"Echafaudages",        realises:11, conformes: 8, nonConformes:2, partiels:1 },
    { theme:"EPI / protections",   realises:13, conformes:10, nonConformes:2, partiels:1 },
    { theme:"Signalisation",       realises: 9, conformes: 7, nonConformes:1, partiels:1 },
    { theme:"Permis de travail",   realises:10, conformes: 9, nonConformes:0, partiels:1 },
    { theme:"Plans d'evacuation",  realises: 8, conformes: 5, nonConformes:2, partiels:1 },
  ],
  "Yamoussoukro": [
    { theme:"Securite incendie",   realises: 8, conformes: 6, nonConformes:1, partiels:1 },
    { theme:"Produits chimiques",  realises: 7, conformes: 4, nonConformes:2, partiels:1 },
    { theme:"Equipements levage",  realises: 6, conformes: 5, nonConformes:1, partiels:0 },
    { theme:"Echafaudages",        realises: 8, conformes: 5, nonConformes:2, partiels:1 },
    { theme:"EPI / protections",   realises: 9, conformes: 7, nonConformes:1, partiels:1 },
    { theme:"Signalisation",       realises: 6, conformes: 5, nonConformes:1, partiels:0 },
    { theme:"Permis de travail",   realises: 7, conformes: 6, nonConformes:0, partiels:1 },
    { theme:"Plans d'evacuation",  realises: 5, conformes: 3, nonConformes:2, partiels:0 },
  ],
  "San Pedro": [
    { theme:"Securite incendie",   realises: 8, conformes: 6, nonConformes:1, partiels:1 },
    { theme:"Produits chimiques",  realises: 7, conformes: 4, nonConformes:1, partiels:2 },
    { theme:"Equipements levage",  realises: 7, conformes: 6, nonConformes:0, partiels:1 },
    { theme:"Echafaudages",        realises: 7, conformes: 5, nonConformes:0, partiels:2 },
    { theme:"EPI / protections",   realises: 8, conformes: 6, nonConformes:1, partiels:1 },
    { theme:"Signalisation",       realises: 6, conformes: 5, nonConformes:0, partiels:1 },
    { theme:"Permis de travail",   realises: 6, conformes: 5, nonConformes:1, partiels:0 },
    { theme:"Plans d'evacuation",  realises: 5, conformes: 3, nonConformes:1, partiels:1 },
  ],
};

const MONTH_ISO: Record<string, string> = {
  "Jan":"2026-01","Fev":"2026-02","Mar":"2026-03",
  "Avr":"2026-04","Mai":"2026-05","Juin":"2026-06",
};

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
  const globalFilter = useCockpitFilter();
  const { dateDebut, dateFin } = globalFilter;
  const cockpitHasDate = !!(dateDebut || dateFin);
  const activeSites = useMemo(() => getActiveSites(globalFilter), [globalFilter]);
  useEffect(() => { setMounted(true); }, []);

  const trendData = useMemo(() => {
    let base = period === "3m" ? TREND.slice(-3) : period === "6m" ? TREND.slice(-6) : TREND;
    if (cockpitHasDate) {
      const debutMois = dateDebut ? dateDebut.slice(0, 7) : undefined;
      const finMois   = dateFin   ? dateFin.slice(0, 7)   : undefined;
      base = base.filter((m) => {
        const miso = MONTH_ISO[m.mois];
        if (debutMois && miso < debutMois) return false;
        if (finMois   && miso > finMois)   return false;
        return true;
      });
    }
    return base;
  }, [period, dateDebut, dateFin, cockpitHasDate]);

  // Fraction of months in the selected period that match the date filter
  const trendRatio = useMemo(() => {
    if (!cockpitHasDate) return 1;
    const base = period === "3m" ? TREND.slice(-3) : period === "6m" ? TREND.slice(-6) : TREND;
    return base.length > 0 ? trendData.length / base.length : 0;
  }, [trendData, period, cockpitHasDate]);

  const withRate = useMemo(() => {
    const siteSrc = activeSites
      ? THEMES.map((t) => {
          const agg = activeSites.reduce(
            (s, v) => {
              const st = THEMES_SITES[v]?.find((r) => r.theme === t.theme);
              return {
                realises:     s.realises     + (st?.realises     ?? 0),
                conformes:    s.conformes    + (st?.conformes    ?? 0),
                nonConformes: s.nonConformes + (st?.nonConformes ?? 0),
                partiels:     s.partiels     + (st?.partiels     ?? 0),
              };
            },
            { realises: 0, conformes: 0, nonConformes: 0, partiels: 0 },
          );
          return { ...t, ...agg };
        })
      : THEMES;

    const scaled = cockpitHasDate
      ? siteSrc.map((t) => ({
          ...t,
          realises:     Math.round(t.realises     * trendRatio),
          conformes:    Math.round(t.conformes    * trendRatio),
          nonConformes: Math.round(t.nonConformes * trendRatio),
          partiels:     Math.round(t.partiels     * trendRatio),
        }))
      : siteSrc;

    return scaled
      .map((t) => ({ ...t, txConformite: t.realises > 0 ? Math.round((t.conformes / t.realises) * 100) : 0 }))
      .sort((a, b) => a.txConformite - b.txConformite);
  }, [activeSites, trendRatio, cockpitHasDate]);

  const sousSeuil = withRate.filter((t) => t.realises > 0 && t.txConformite < SEUIL);
  const totalRealises = withRate.reduce((s, t) => s + t.realises, 0);
  const totalConformes = withRate.reduce((s, t) => s + t.conformes, 0);
  const globalTx = totalRealises > 0 ? Math.round((totalConformes / totalRealises) * 100) : 0;

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
                    <td>
                      <span className={t.txConformite < 65 ? "status danger" : "status warn"}>
                        {t.txConformite < 65 ? "Contre-visite" : "Plan correctif"}
                      </span>
                    </td>
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
