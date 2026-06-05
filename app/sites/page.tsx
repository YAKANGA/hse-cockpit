import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { CalendrierHSE } from "@/components/CalendrierHSE";
import { getSiteKpis, SITES } from "@/lib/sites-data";
import "../globals.css";

export default function SitesPage() {
  const kpis = getSiteKpis();

  return (
    <main className="appShell">
      <AppSidebar />
      <section className="workspace">
        <section className="heroBand ultraHero" id="sites">
          <div className="ultraHeroContent">
            <p className="eyebrow">Tableau de bord</p>
            <h1>Vue par site</h1>
          </div>
        </section>

        {/* Cards sites */}
        <section className="adminStats" style={{ marginBottom: 24 }}>
          {kpis.map((kpi) => (
            <Link
              key={kpi.site}
              href={`/sites/${kpi.site.toLowerCase().replace(/ /g, "-")}`}
              style={{ textDecoration: "none" }}
            >
              <article style={{
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "16px 18px",
                background: "var(--surface)",
                cursor: "pointer",
                transition: "box-shadow 0.15s",
              }}>
                <span style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 4 }}>{kpi.site}</span>
                <strong style={{
                  fontSize: 28,
                  color: kpi.conformite >= 80 ? "#0f766e" : kpi.conformite >= 60 ? "#d97706" : "#dc2626",
                }}>
                  {kpi.conformite}%
                </strong>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, display: "flex", gap: 10 }}>
                  <span>{kpi.totalRecords} enreg.</span>
                  <span>{kpi.openItems} ouverts</span>
                  <span>{kpi.criticalItems} critiques</span>
                </div>
                <span style={{ fontSize: 11, color: "#0f766e", marginTop: 8, display: "block" }}>
                  Voir le site →
                </span>
              </article>
            </Link>
          ))}
        </section>

        {/* Calendrier HSE */}
        <CalendrierHSE />
      </section>
    </main>
  );
}
