import Link from "next/link";
import { AlertTriangle, Building2, CheckCircle2, TrendingUp } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { CalendrierHSE } from "@/components/CalendrierHSE";
import { SitesComparisonPanel } from "@/components/SitesComparisonPanel";
import { AccessGate } from "@/components/AccessGate";
import { getSiteKpis } from "@/lib/sites-data";
import "../globals.css";

export default function SitesPage() {
  const kpis = getSiteKpis();
  const totalRecords = kpis.reduce((s, k) => s + k.totalRecords, 0);
  const totalCritical = kpis.reduce((s, k) => s + k.criticalItems, 0);
  const totalOverdue = kpis.reduce((s, k) => s + k.overdueItems, 0);
  const avgConformite = kpis.length
    ? Math.round(kpis.reduce((s, k) => s + k.conformite, 0) / kpis.length)
    : 0;

  return (
    <main className="appShell">
      <AppSidebar />
      <AccessGate anyOf={["module:view"]} label="Tableau de bord sites">
        <section className="workspace">
          <section className="heroBand ultraHero" id="sites">
            <div className="ultraHeroContent">
              <p className="eyebrow">Performance HSE</p>
              <h1>Tableau de bord Sites</h1>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>
                <Building2 size={14} /> {kpis.length} sites · {totalRecords} enreg.
              </div>
              {totalCritical > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(220,38,38,0.18)", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#fca5a5", fontWeight: 600 }}>
                  <AlertTriangle size={14} /> {totalCritical} critiques
                </div>
              )}
              {totalOverdue > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(217,119,6,0.18)", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#fcd34d", fontWeight: 600 }}>
                  <TrendingUp size={14} /> {totalOverdue} en retard
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(15,118,110,0.25)", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#6ee7b7", fontWeight: 600 }}>
                <CheckCircle2 size={14} /> {avgConformite}% conformite moy.
              </div>
            </div>
          </section>

          {/* KPI cards par site */}
          <div className="sitesKpiGrid" style={{ marginTop: 20 }}>
            {kpis.map((kpi) => (
              <Link
                key={kpi.site}
                href={`/sites/${kpi.site.toLowerCase().replace(/ /g, "-")}`}
                style={{ textDecoration: "none" }}
              >
                <article className="panel sitesKpiCard">
                  <div className="sitesKpiCardHeader">
                    <span className="sitesKpiCardName">{kpi.site}</span>
                    <span className={`status ${kpi.conformite >= 80 ? "ok" : kpi.conformite >= 60 ? "warn" : "danger"}`}>
                      {kpi.conformite}%
                    </span>
                  </div>
                  <div className="sitesKpiCardMetrics">
                    <div><strong>{kpi.totalRecords}</strong><span>enregistrements</span></div>
                    <div>
                      <strong style={{ color: kpi.openItems > 0 ? "var(--warn)" : "var(--muted)" }}>{kpi.openItems}</strong>
                      <span>ouverts</span>
                    </div>
                    <div>
                      <strong style={{ color: kpi.criticalItems > 0 ? "var(--danger)" : "var(--muted)" }}>{kpi.criticalItems}</strong>
                      <span>critiques</span>
                    </div>
                    <div>
                      <strong style={{ color: kpi.overdueItems > 0 ? "var(--danger)" : "var(--muted)" }}>{kpi.overdueItems}</strong>
                      <span>en retard</span>
                    </div>
                  </div>
                  <div className="sitesKpiBar">
                    <div
                      className="sitesKpiBarFill"
                      style={{
                        width: `${kpi.conformite}%`,
                        background: kpi.conformite >= 80 ? "var(--primary)" : kpi.conformite >= 60 ? "var(--warn)" : "var(--danger)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--primary)", marginTop: 8, display: "block" }}>
                    Voir le site →
                  </span>
                </article>
              </Link>
            ))}
          </div>

          {/* Comparaison détaillée par ville */}
          <div style={{ marginTop: 20 }}>
            <SitesComparisonPanel />
          </div>

          {/* Calendrier des échéances */}
          <div style={{ marginTop: 20 }}>
            <CalendrierHSE />
          </div>
        </section>
      </AccessGate>
    </main>
  );
}
