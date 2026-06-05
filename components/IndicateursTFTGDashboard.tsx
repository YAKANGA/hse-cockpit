"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyRow = {
  mois: string;
  heures: number;
  accidents: number;
  jours: number;
  causeries: number;
  formations: number;
};

const MONTHLY_DATA: MonthlyRow[] = [
  { mois: "Jan", heures: 158000, accidents: 4, jours: 31, causeries: 22, formations: 5 },
  { mois: "Fev", heures: 149000, accidents: 3, jours: 28, causeries: 19, formations: 4 },
  { mois: "Mar", heures: 162000, accidents: 4, jours: 34, causeries: 25, formations: 6 },
  { mois: "Avr", heures: 155000, accidents: 3, jours: 27, causeries: 21, formations: 4 },
  { mois: "Mai", heures: 171000, accidents: 4, jours: 29, causeries: 28, formations: 7 },
  { mois: "Juin", heures: 143000, accidents: 2, jours: 21, causeries: 16, formations: 3 },
];

const TF_OBJECTIF = 2.0;
const TG_OBJECTIF = 0.15;

function calcTF(accidents: number, heures: number) {
  if (!heures) return 0;
  return Math.round((accidents * 1_000_000) / heures * 10) / 10;
}

function calcTG(jours: number, heures: number) {
  if (!heures) return 0;
  return Math.round((jours * 1_000) / heures * 100) / 100;
}

const STATUS_CLASS: Record<string, string> = {
  ok: "status ok",
  warn: "status warn",
  danger: "status danger",
};

export function IndicateursTFTGDashboard() {
  const [mounted, setMounted] = useState(false);
  const [hasRealData, setHasRealData] = useState(false);
  const [sourceData, setSourceData] = useState(MONTHLY_DATA);

  useEffect(() => {
    setMounted(true);
    fetch("/api/modules/indicators/tftg")
      .then((r) => r.ok ? r.json() : null)
      .then((payload) => {
        if (payload?.hasRealData && payload.data?.length > 0) {
          setSourceData(payload.data);
          setHasRealData(true);
        }
      })
      .catch(() => {});
  }, []);

  const computedRows = useMemo(
    () =>
      sourceData.map((row) => ({
        ...row,
        tf: calcTF(row.accidents, row.heures),
        tg: calcTG(row.jours, row.heures),
        tams: (row.causeries ?? 0) + (row.formations ?? 0),
      })),
    [sourceData],
  );

  const lastTF = computedRows[computedRows.length - 1]?.tf ?? 0;
  const lastTG = computedRows[computedRows.length - 1]?.tg ?? 0;
  const totalHeures = computedRows.reduce((s, r) => s + r.heures, 0);
  const totalAccidents = computedRows.reduce((s, r) => s + r.accidents, 0);
  const tfGlobal = calcTF(totalAccidents, totalHeures);
  const tfTrend = computedRows.length > 1
    ? computedRows[computedRows.length - 1].tf - computedRows[computedRows.length - 2].tf
    : 0;

  function tfStatus(val: number) {
    if (val <= TF_OBJECTIF) return "ok";
    if (val <= TF_OBJECTIF * 1.5) return "warn";
    return "danger";
  }

  function tgStatus(val: number) {
    if (val <= TG_OBJECTIF) return "ok";
    if (val <= TG_OBJECTIF * 1.5) return "warn";
    return "danger";
  }

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Taux de frequence et de gravite</h2>
          <p>Evolution mensuelle TF et TG — objectifs : TF &le; {TF_OBJECTIF} / TG &le; {TG_OBJECTIF}.</p>
        </div>
        <span className={hasRealData ? "status ok" : "status warn"} style={{ fontSize: 12, alignSelf: "center" }}>
          {hasRealData ? `Donnees importees (${sourceData.length} mois)` : "Donnees de reference — importez un fichier pour actualiser"}
        </span>
      </div>

      <div className="tftgKpis">
        <div className="tftgKpiCard">
          <span>TF consolide</span>
          <strong>{tfGlobal}</strong>
          <em className={STATUS_CLASS[tfStatus(tfGlobal)]}>
            {tfGlobal <= TF_OBJECTIF ? "Objectif atteint" : "Au-dessus objectif"}
          </em>
          <small>Objectif &le; {TF_OBJECTIF}</small>
        </div>
        <div className="tftgKpiCard">
          <span>TF dernier mois</span>
          <strong>{lastTF}</strong>
          <em className={tfTrend <= 0 ? STATUS_CLASS.ok : STATUS_CLASS.warn}>
            {tfTrend > 0 ? `+${tfTrend.toFixed(1)}` : tfTrend.toFixed(1)} vs mois precedent
          </em>
          <small>Tendance {tfTrend <= 0 ? "favorable" : "defavorable"}</small>
        </div>
        <div className="tftgKpiCard">
          <span>TG dernier mois</span>
          <strong>{lastTG}</strong>
          <em className={STATUS_CLASS[tgStatus(lastTG)]}>
            {lastTG <= TG_OBJECTIF ? "Objectif atteint" : "Au-dessus objectif"}
          </em>
          <small>Objectif &le; {TG_OBJECTIF}</small>
        </div>
        <div className="tftgKpiCard">
          <span>Heures travaillees</span>
          <strong>{(totalHeures / 1_000).toFixed(0)}k</strong>
          <em className={STATUS_CLASS.ok}>Base de calcul</em>
          <small>Cumul periode</small>
        </div>
      </div>

      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Evolution du TF mensuel</h2>
              <p>Taux de frequence = accidents &times; 1 000 000 / heures.</p>
            </div>
          </div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computedRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, "auto"]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={TF_OBJECTIF} stroke="#047857" strokeDasharray="5 4" label={{ value: `Objectif ${TF_OBJECTIF}`, position: "insideTopRight", fill: "#047857", fontSize: 12 }} />
                  <Line type="monotone" dataKey="tf" name="TF mensuel" stroke="#c2410c" strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Evolution du TG mensuel</h2>
              <p>Taux de gravite = jours perdus &times; 1 000 / heures.</p>
            </div>
          </div>
          <div className="chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computedRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, "auto"]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={TG_OBJECTIF} stroke="#047857" strokeDasharray="5 4" label={{ value: `Objectif ${TG_OBJECTIF}`, position: "insideTopRight", fill: "#047857", fontSize: 12 }} />
                  <Line type="monotone" dataKey="tg" name="TG mensuel" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>

      <article className="panel" style={{ marginTop: 18 }}>
        <div className="panelHeader">
          <div>
            <h2>Tableau de bord mensuel</h2>
            <p>TF, TG, accidents, jours perdus, causeries et formations par mois.</p>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Mois</th>
                <th>Heures</th>
                <th>Accidents AT</th>
                <th>Jours perdus</th>
                <th>TF</th>
                <th>TG</th>
                <th>TAMS</th>
                <th>Statut TF</th>
              </tr>
            </thead>
            <tbody>
              {computedRows.map((row) => (
                <tr key={row.mois}>
                  <td><strong>{row.mois}</strong></td>
                  <td>{row.heures.toLocaleString("fr-FR")}</td>
                  <td>{row.accidents}</td>
                  <td>{row.jours}</td>
                  <td><strong>{row.tf}</strong></td>
                  <td><strong>{row.tg}</strong></td>
                  <td>{row.tams}</td>
                  <td>
                    <span className={STATUS_CLASS[tfStatus(row.tf)]}>
                      {row.tf <= TF_OBJECTIF ? "OK" : row.tf <= TF_OBJECTIF * 1.5 ? "Vigilance" : "Alerte"}
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
