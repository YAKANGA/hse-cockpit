import { Calendar } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { CalendrierHSE } from "@/components/CalendrierHSE";
import { AccessGate } from "@/components/AccessGate";
import { getUpcomingEcheances } from "@/lib/sites-data";
import "../globals.css";

export default function CalendrierPage() {
  const echeances = getUpcomingEcheances();
  const overdue = echeances.filter((e) => e.urgency === "overdue").length;
  const urgent = echeances.filter((e) => e.urgency === "urgent").length;
  const week = echeances.filter((e) => e.urgency === "week").length;

  return (
    <main className="appShell">
      <AppSidebar />
      <AccessGate anyOf={["module:view"]} label="Calendrier HSE">
        <section className="workspace">
          <section className="heroBand ultraHero" id="calendrier">
            <div className="ultraHeroContent">
              <p className="eyebrow">Planification</p>
              <h1>Calendrier HSE</h1>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {overdue > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(220,38,38,0.18)", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#fca5a5", fontWeight: 600 }}>
                  <Calendar size={14} /> {overdue} en retard
                </div>
              )}
              {urgent > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(234,88,12,0.18)", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#fdba74", fontWeight: 600 }}>
                  <Calendar size={14} /> {urgent} urgent
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(37,99,235,0.18)", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#93c5fd", fontWeight: 600 }}>
                <Calendar size={14} /> {week} cette semaine
              </div>
            </div>
          </section>

          <div style={{ marginTop: 20 }}>
            <CalendrierHSE />
          </div>
        </section>
      </AccessGate>
    </main>
  );
}
