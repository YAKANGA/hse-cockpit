"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, ShieldOff, ShieldCheck } from "lucide-react";
import { useCockpitFilter, getActiveSites } from "@/lib/use-cockpit-filter";
import { dateInRange } from "@/lib/date-utils";

type Permis = {
  id:            string;
  type:          string;
  zone:          string;
  site:          string;
  responsable:   string;
  debut:         string;
  fin:           string;
  validationHse: boolean;
  statut:        "Actif" | "Expire" | "Cloture" | "En attente";
};

const PERMIS: Permis[] = [
  { id:"PTR-001", type:"Travail à chaud",  zone:"Zone C - Soudure",    site:"Abidjan",      responsable:"K. Yao",     debut:"01/06/2026", fin:"08/06/2026", validationHse:true,  statut:"Actif" },
  { id:"PTR-002", type:"Hauteur",          zone:"Échafaudage N°4",     site:"Bouake",       responsable:"M. Diallo",  debut:"29/05/2026", fin:"05/06/2026", validationHse:true,  statut:"Expire" },
  { id:"PTR-003", type:"Espace confiné",   zone:"Cuve de stockage",    site:"Abidjan",      responsable:"A. Kouadio", debut:"03/06/2026", fin:"10/06/2026", validationHse:false, statut:"En attente" },
  { id:"PTR-004", type:"Électrique",       zone:"TGBT Principal",      site:"Yamoussoukro", responsable:"S. Traore",  debut:"02/06/2026", fin:"04/06/2026", validationHse:true,  statut:"Cloture" },
  { id:"PTR-005", type:"Levage",           zone:"Grue mobile GZ-12",   site:"San Pedro",    responsable:"N. Kone",    debut:"04/06/2026", fin:"11/06/2026", validationHse:true,  statut:"Actif" },
  { id:"PTR-006", type:"Travail à chaud",  zone:"Zone D - Découpe",    site:"Bouake",       responsable:"K. Yao",     debut:"31/05/2026", fin:"02/06/2026", validationHse:true,  statut:"Expire" },
  { id:"PTR-007", type:"Hauteur",          zone:"Toiture Bâtiment B",  site:"Abidjan",      responsable:"M. Diallo",  debut:"05/06/2026", fin:"12/06/2026", validationHse:true,  statut:"Actif" },
  { id:"PTR-008", type:"Espace confiné",   zone:"Égout collecteur",    site:"San Pedro",    responsable:"A. Kouadio", debut:"06/06/2026", fin:"07/06/2026", validationHse:false, statut:"En attente" },
  { id:"PTR-009", type:"Levage",           zone:"Pont roulant R-5",    site:"Yamoussoukro", responsable:"S. Traore",  debut:"28/05/2026", fin:"01/06/2026", validationHse:true,  statut:"Expire" },
  { id:"PTR-010", type:"Électrique",       zone:"Armoire AT Bâtiment", site:"Abidjan",      responsable:"N. Kone",    debut:"04/06/2026", fin:"05/06/2026", validationHse:true,  statut:"Actif" },
];

const STATUS_COLOR: Record<string, string> = {
  Actif:        "#0f766e",
  Expire:       "#dc2626",
  Cloture:      "#64748b",
  "En attente": "#d97706",
};
const STATUS_ICON: Record<string, React.ElementType> = {
  Actif:        CheckCircle2,
  Expire:       AlertTriangle,
  Cloture:      Clock,
  "En attente": ShieldOff,
};
const TYPE_COLORS = ["#0f766e","#2563eb","#c2410c","#7c3aed","#b45309"];
export function PermisStatusPanel() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter]   = useState<string>("Tous");
  const globalFilter = useCockpitFilter();
  const activeSites  = useMemo(() => getActiveSites(globalFilter), [globalFilter]);
  useEffect(() => { setMounted(true); }, []);

  const baseData = useMemo(() =>
    PERMIS.filter((p) =>
      (!activeSites || activeSites.includes(p.site)) &&
      dateInRange(p.debut, globalFilter.dateDebut, globalFilter.dateFin)
    ),
  [activeSites, globalFilter.dateDebut, globalFilter.dateFin]);

  const filtered = useMemo(() =>
    filter === "Tous" ? baseData : baseData.filter((p) => p.statut === filter),
  [filter, baseData]);

  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    baseData.forEach((p) => { m[p.type] = (m[p.type] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [baseData]);

  const byStatus = useMemo(() => {
    const m: Record<string, number> = {};
    baseData.forEach((p) => { m[p.statut] = (m[p.statut] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [baseData]);

  const bySiteStatut = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    baseData.forEach((p) => {
      if (!m[p.site]) m[p.site] = { Actif:0, Expire:0, Cloture:0, "En attente":0 };
      m[p.site][p.statut]++;
    });
    return Object.entries(m).map(([s, v]) => ({ site:s, ...v }));
  }, [baseData]);

  const withoutHse = baseData.filter((p) => !p.validationHse);
  const actifs     = baseData.filter((p) => p.statut === "Actif").length;
  const expires    = baseData.filter((p) => p.statut === "Expire").length;
  const enAttente  = baseData.filter((p) => p.statut === "En attente").length;
  const cloturesCnt= baseData.filter((p) => p.statut === "Cloture").length;
  const tauxValide = baseData.length ? Math.round(((baseData.length - withoutHse.length) / baseData.length) * 100) : 0;

  const kpis: [string, number, string, string, React.ElementType][] = [
    ["Actifs",            actifs,      "en cours d'exécution", "#0f766e", CheckCircle2],
    ["Expirés",           expires,     "à clôturer d'urgence", "#dc2626", AlertTriangle],
    ["En attente HSE",    enAttente,   "validation requise",   "#d97706", ShieldOff],
    ["Clôturés",          cloturesCnt, "sur la période",       "#64748b", Clock],
    ["Sans validation",   withoutHse.length, "bloquer avant travaux","#dc2626", ShieldOff],
    ["Validation HSE",    baseData.length - withoutHse.length, `${tauxValide}% du total`, "#0f766e", ShieldCheck],
  ];

  return (
    <section className="sectionBlock">
      <div className="sectionTitle">
        <div>
          <h2>Suivi des Permis de Travaux Dangereux</h2>
          <p>{actifs} actif{actifs > 1 ? "s" : ""} — {expires} expiré{expires > 1 ? "s" : ""} — {withoutHse.length} sans validation HSE — {enAttente} en attente.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="permisKpis">
        {kpis.map(([label, count, sub, color, Icon]) => (
          <div key={label} className="permisKpiCard" style={{ "--permis-color": color } as React.CSSProperties}
            onClick={() => {
              const s = ["Actifs","Expirés","En attente HSE","Clôturés"].find((_, i) => [actifs,expires,enAttente,cloturesCnt][i] === count);
              const statMap: Record<string, string> = { Actifs:"Actif", "Expirés":"Expire", "En attente HSE":"En attente", "Clôturés":"Cloture" };
              if (statMap[label]) setFilter(filter === statMap[label] ? "Tous" : statMap[label]);
            }} role="button" tabIndex={0}>
            <div style={{ display:"flex", justifyContent:"space-between", width:"100%" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <strong style={{ color, fontSize:26, fontWeight:700, lineHeight:1 }}>{count}</strong>
            <div style={{ width:"100%", height:3, background:"var(--line)", borderRadius:99, marginTop:4 }}>
              <div style={{ width:`${Math.round((count / PERMIS.length) * 100)}%`, height:"100%", background:color, borderRadius:99 }} />
            </div>
            <small style={{ color:"var(--muted)", fontSize:11 }}>{sub}</small>
          </div>
        ))}
      </div>

      {/* HSE validation alert */}
      {withoutHse.length > 0 && (
        <div style={{ margin:"14px 0 0", padding:"12px 16px", background:"#fef2f2", borderRadius:10, border:"1px solid #fecaca", display:"flex", gap:12, alignItems:"flex-start" }}>
          <ShieldOff size={18} style={{ color:"#dc2626", flexShrink:0, marginTop:2 }} />
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#dc2626", marginBottom:4 }}>
              {withoutHse.length} permis sans validation HSE — travaux bloqués jusqu'à signature
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {withoutHse.map((p) => (
                <span key={p.id} style={{ fontSize:11, color:"#dc2626", background:"#fee2e2", padding:"2px 8px", borderRadius:4 }}>
                  {p.id} — {p.type} ({p.site})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:6, margin:"14px 0 0", flexWrap:"wrap" }}>
        {["Tous","Actif","En attente","Expire","Cloture"].map((s) => (
          <button key={s} type="button" className={filter === s ? "periodBtn active" : "periodBtn"}
            style={{ fontSize:11, ...(filter === s && STATUS_COLOR[s] ? { borderColor:STATUS_COLOR[s], color:STATUS_COLOR[s] } : {}) }}
            onClick={() => setFilter(s)}>{s}</button>
        ))}
        <span style={{ fontSize:12, color:"var(--muted)", alignSelf:"center", marginLeft:6 }}>{filtered.length} permis</span>
      </div>

      {/* Charts row */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        {/* By type */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Volume par type de permis</h2><p>Répartition des permis dangereux émis par catégorie.</p></div></div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Bar dataKey="value" name="Permis" radius={[6,6,0,0]}>
                    {byType.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>

        {/* By site stacked */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Statuts par site</h2><p>Actifs, expirés et en attente par localisation.</p></div></div>
          <div className="chart compact">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySiteStatut} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="site" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="Actif"       name="Actif"       fill="#0f766e" stackId="a" />
                  <Bar dataKey="Cloture"     name="Clôturé"     fill="#64748b" stackId="a" />
                  <Bar dataKey="En attente"  name="En attente"  fill="#d97706" stackId="a" />
                  <Bar dataKey="Expire"      name="Expiré"      fill="#dc2626" stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
          </div>
        </article>
      </div>

      {/* Pie + validation breakdown */}
      <div className="dashboardGrid" style={{ marginTop:18 }}>
        <article className="panel">
          <div className="panelHeader"><div><h2>Répartition par statut</h2><p>Actifs, expirés, clôturés et en attente.</p></div></div>
          <div className="chart compact" style={{ position:"relative" }}>
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48}>
                    {byStatus.map((e) => <Cell key={e.name} fill={STATUS_COLOR[e.name] ?? "#94a3b8"} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="chartSkeleton" />}
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-65%)", textAlign:"center", pointerEvents:"none" }}>
              <div style={{ fontSize:20, fontWeight:800, color:"#0f766e" }}>{actifs}</div>
              <div style={{ fontSize:10, color:"var(--muted)" }}>actifs</div>
            </div>
          </div>
        </article>

        {/* Validation HSE by type */}
        <article className="panel">
          <div className="panelHeader"><div><h2>Validation HSE par type</h2><p>Taux de validation HSE pré-travaux par catégorie.</p></div></div>
          <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
            {byType.map(({ name }, i) => {
              const inType   = PERMIS.filter((p) => p.type === name);
              const validHse = inType.filter((p) => p.validationHse).length;
              const pct      = Math.round((validHse / inType.length) * 100);
              const color    = TYPE_COLORS[i % TYPE_COLORS.length];
              return (
                <div key={name}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:10, height:10, background:color, borderRadius:2, display:"inline-block" }} />
                      <span style={{ fontWeight:500 }}>{name}</span>
                    </div>
                    <span style={{ color: pct === 100 ? "#16a34a" : "#dc2626", fontWeight:700 }}>{validHse}/{inType.length} ({pct}%)</span>
                  </div>
                  <div style={{ height:6, background:"var(--line)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:pct === 100 ? "#16a34a" : "#dc2626", borderRadius:99, transition:"width .5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {/* Table */}
      <article className="panel" style={{ marginTop:18 }}>
        <div className="panelHeader"><div><h2>Registre des permis</h2><p>{filtered.length} permis affiché{filtered.length > 1 ? "s" : ""}.</p></div></div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>ID</th><th>Type</th><th>Zone</th><th>Site</th><th>Responsable</th><th>Début</th><th>Fin</th><th>Validation HSE</th><th>Statut</th></tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ background:!p.validationHse && p.statut !== "Cloture" ? "#fef2f222" : undefined }}>
                  <td><code style={{ fontSize:12 }}>{p.id}</code></td>
                  <td style={{ fontSize:12 }}>{p.type}</td>
                  <td style={{ fontSize:12, color:"var(--muted)" }}>{p.zone}</td>
                  <td style={{ fontSize:12 }}>{p.site}</td>
                  <td style={{ fontSize:12, whiteSpace:"nowrap" }}>{p.responsable}</td>
                  <td style={{ fontSize:12 }}>{p.debut}</td>
                  <td style={{ fontSize:12 }}>{p.fin}</td>
                  <td>
                    <span className="status" style={{ background:p.validationHse ? "#16a34a22" : "#dc262622", color:p.validationHse ? "#16a34a" : "#dc2626", fontSize:11, display:"inline-flex", alignItems:"center", gap:4 }}>
                      {p.validationHse ? <ShieldCheck size={11} /> : <ShieldOff size={11} />}
                      {p.validationHse ? "Validé" : "Manquante"}
                    </span>
                  </td>
                  <td>
                    <span className="status" style={{ background:`${STATUS_COLOR[p.statut]}22`, color:STATUS_COLOR[p.statut], fontSize:11 }}>{p.statut}</span>
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
