import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { hseAlerts } from "@/lib/alerts-data";
import { modules, moduleOperationalKpis } from "@/lib/hse-data";
import { moduleRecords } from "@/lib/module-records-data";
import { SITES, getSiteKpis, getUpcomingEcheances } from "@/lib/sites-data";
import { siteBreakdown } from "@/lib/hse-data";
import "../../globals.css";

export function generateStaticParams() {
  return SITES.map((s) => ({ siteId: s.toLowerCase().replace(/ /g, "-") }));
}

function resolveSite(siteId: string): string | undefined {
  return SITES.find(
    (s) => s.toLowerCase().replace(/ /g, "-") === siteId.toLowerCase(),
  );
}

export default async function SitePage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const siteName = resolveSite(siteId);
  if (!siteName) notFound();

  const allKpis = getSiteKpis();
  const kpi = allKpis.find((k) => k.site === siteName);
  if (!kpi) notFound();

  const siteRecords = moduleRecords.filter((r) => r.site === siteName);
  const siteAlerts = hseAlerts.filter((a) => a.site === siteName);
  const echeances = getUpcomingEcheances().filter((e) => e.site === siteName);
  const siteBreak = siteBreakdown.find((s) => s.site === siteName);

  const byModule = modules.map((m) => {
    const records = siteRecords.filter((r) => r.moduleId === m.id);
    const open = records.filter((r) => r.status !== "Clos" && r.status !== "Valide").length;
    const closed = records.filter((r) => r.status === "Clos" || r.status === "Valide").length;
    const kpiOp = moduleOperationalKpis.find((k) => k.moduleId === m.id);
    return { module: m, records: records.length, open, closed, kpiOp };
  }).filter((b) => b.records > 0);

  const criticalAlerts = siteAlerts.filter((a) => a.severity === "Critique" && a.status === "Ouvert");

  return (
    <main className="appShell">
      <AppSidebar />
      <section className="workspace">

        {/* Header */}
        <header className="heroBand ultraHero" style={{ "--brand": "#0f766e" } as React.CSSProperties}>
          <div className="ultraHeroContent">
            <Link href="/" className="backLink" style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 6, textDecoration: "none" }}>
              <ArrowLeft size={15} /> Retour cockpit
            </Link>
            <p className="eyebrow">Vue consolidée</p>
            <h1>Site — {siteName}</h1>
          </div>
          <div className="heroActions">
            {SITES.filter((s) => s !== siteName).map((s) => (
              <Link
                key={s}
                href={`/sites/${s.toLowerCase().replace(/ /g, "-")}`}
                className="secondaryButton"
                style={{ fontSize: 12 }}
              >
                {s}
              </Link>
            ))}
          </div>
        </header>

        {/* KPI globaux site */}
        <section className="adminStats">
          <article>
            <span>Enregistrements</span>
            <strong>{kpi.totalRecords}</strong>
          </article>
          <article>
            <span>Elements ouverts</span>
            <strong style={{ color: kpi.openItems > 10 ? "#dc2626" : "inherit" }}>{kpi.openItems}</strong>
          </article>
          <article>
            <span>Critiques</span>
            <strong style={{ color: kpi.criticalItems > 0 ? "#dc2626" : "#0f766e" }}>{kpi.criticalItems}</strong>
          </article>
          <article>
            <span>En retard</span>
            <strong style={{ color: kpi.overdueItems > 0 ? "#d97706" : "#0f766e" }}>{kpi.overdueItems}</strong>
          </article>
          <article>
            <span>Conformite</span>
            <strong style={{ color: kpi.conformite >= 80 ? "#0f766e" : kpi.conformite >= 60 ? "#d97706" : "#dc2626" }}>
              {kpi.conformite}%
            </strong>
          </article>
          <article>
            <span>Alertes actives</span>
            <strong style={{ color: siteAlerts.length > 0 ? "#dc2626" : "#0f766e" }}>{siteAlerts.length}</strong>
          </article>
        </section>

        {/* Alertes critiques site */}
        {criticalAlerts.length > 0 && (
          <section className="alertsCriticalBand" style={{ margin: "0 0 18px" }}>
            <div className="alertsCriticalHeader">
              <AlertTriangle size={16} />
              <strong>{criticalAlerts.length} alerte{criticalAlerts.length > 1 ? "s" : ""} critique{criticalAlerts.length > 1 ? "s" : ""} sur ce site</strong>
            </div>
            <div className="alertsCriticalCards">
              {criticalAlerts.map((a) => (
                <div className="alertCriticalCard" key={a.id}>
                  <div className="alertCriticalTop">
                    <span className="alertCriticalModule">{a.moduleName}</span>
                    <span className="alertCriticalSite">{a.dueDate}</span>
                  </div>
                  <strong>{a.title}</strong>
                  <p>{a.recommendation}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Modules présents sur ce site */}
        <section className="panel" style={{ marginBottom: 18 }}>
          <div className="panelHeader">
            <div>
              <h2>Modules HSE actifs sur {siteName}</h2>
              <p>{byModule.length} module{byModule.length > 1 ? "s" : ""} avec des données pour ce site.</p>
            </div>
          </div>
          <div className="moduleSynthesisList">
            {byModule.map(({ module, records, open, closed }) => {
              const Icon = module.icon;
              const conformite = records > 0 ? Math.round((closed / records) * 100) : 0;
              return (
                <article
                  key={module.id}
                  className="moduleSynthesisRow"
                  style={{ "--module": module.color, "--tint": module.accent } as React.CSSProperties}
                >
                  <div className="moduleSynthesisTitle">
                    <div className="moduleIcon"><Icon size={20} /></div>
                    <div>
                      <h3>{module.shortName}</h3>
                      <span>{module.name}</span>
                    </div>
                  </div>
                  <div className="moduleSynthesisMetrics">
                    <span><strong>{records}</strong> lignes</span>
                    <span><strong>{open}</strong> ouverts</span>
                    <span>
                      <strong style={{ color: conformite >= 80 ? "#0f766e" : "#d97706" }}>{conformite}%</strong> conformite
                    </span>
                  </div>
                  <div className="moduleSynthesisAction">
                    <Link className="primaryButton" href={`/modules/${module.id}`}>
                      Ouvrir le module →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Échéances urgentes site */}
        {echeances.length > 0 && (
          <section className="panel" style={{ marginBottom: 18 }}>
            <div className="panelHeader">
              <div>
                <h2>Echéances urgentes — {siteName}</h2>
                <p>{echeances.length} element{echeances.length > 1 ? "s" : ""} avec echeance proche ou depassee.</p>
              </div>
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Élément</th>
                    <th>Responsable</th>
                    <th>Échéance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {echeances.map((e) => (
                    <tr key={e.id}>
                      <td><strong>{e.moduleName}</strong></td>
                      <td><Link href={e.href} style={{ color: "var(--ink)", textDecoration: "none" }}>{e.label}</Link></td>
                      <td>{e.owner}</td>
                      <td style={{ fontWeight: 600, color: e.urgency === "overdue" ? "#dc2626" : e.urgency === "urgent" ? "#d97706" : "inherit" }}>
                        {e.dueDate}
                        {e.daysLeft < 0 ? ` (${Math.abs(e.daysLeft)}j de retard)` : ` (J-${e.daysLeft})`}
                      </td>
                      <td>
                        <span className={e.urgency === "overdue" ? "status danger" : e.urgency === "urgent" ? "status warn" : "status ok"}>
                          {e.urgency === "overdue" ? "En retard" : e.urgency === "urgent" ? "Urgent" : e.urgency === "week" ? "Cette semaine" : "Bientot"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Comparatif avec autres sites */}
        {siteBreak && (
          <section className="panel">
            <div className="panelHeader">
              <div>
                <h2>Position de {siteName} vs autres sites</h2>
                <p>Conformite de {siteBreak.conformite}% — {siteBreak.evenements} événement(s) declares.</p>
              </div>
            </div>
            <div className="sitesCompareGrid">
              {allKpis.map((s) => (
                <article
                  key={s.site}
                  className="sitesCompareCard"
                  style={{
                    border: s.site === siteName ? "2px solid #0f766e" : "1px solid var(--line)",
                    borderRadius: 10,
                    padding: "14px 16px",
                    background: s.site === siteName ? "var(--hover)" : "var(--surface)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ fontSize: 14 }}>{s.site}</strong>
                    {s.site === siteName && <span className="status ok" style={{ fontSize: 10 }}>Site actuel</span>}
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--muted)" }}>
                    <span>
                      {s.conformite >= 80
                        ? <TrendingUp size={12} style={{ color: "#0f766e", verticalAlign: "middle" }} />
                        : <TrendingDown size={12} style={{ color: "#dc2626", verticalAlign: "middle" }} />}
                      {" "}<strong style={{ color: s.conformite >= 80 ? "#0f766e" : s.conformite >= 60 ? "#d97706" : "#dc2626" }}>{s.conformite}%</strong>
                    </span>
                    <span>{s.openItems} ouverts</span>
                    <span>{s.criticalItems} critiques</span>
                  </div>
                  <Link
                    href={`/sites/${s.site.toLowerCase().replace(/ /g, "-")}`}
                    style={{ fontSize: 11, color: "#0f766e", marginTop: 6, display: "block" }}
                  >
                    Voir ce site →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
