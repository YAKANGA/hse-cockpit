"use client";

import { useState } from "react";
import { Calendar, ChevronRight, Clock, MapPin, User } from "lucide-react";
import { getUpcomingEcheances, type EcheanceItem } from "@/lib/sites-data";

type UrgencyKey = "overdue" | "urgent" | "week" | "soon";

const URGENCY_CONFIG: Record<UrgencyKey, { label: string; sublabel: string; cls: string }> = {
  overdue: { label: "En retard",     sublabel: "Echeance depassee", cls: "echeOverdue" },
  urgent:  { label: "Urgent",        sublabel: "Moins de 2 jours",  cls: "echeUrgent"  },
  week:    { label: "Cette semaine", sublabel: "Dans les 7 jours",  cls: "echeWeek"    },
  soon:    { label: "A venir",       sublabel: "Dans les 21 jours", cls: "echeSoon"    },
};

const MODULE_COLORS: Record<string, string> = {
  events:      "#c2410c",
  inspections: "#047857",
  permits:     "#b45309",
  actions:     "#2563eb",
  indicators:  "#7c3aed",
  ppe:         "#0e7490",
};

function CountdownChip({ item }: { item: EcheanceItem }) {
  const cls = URGENCY_CONFIG[item.urgency].cls;
  if (item.daysLeft < 0)   return <span className={`echeChip ${cls}`}>J+{Math.abs(item.daysLeft)}</span>;
  if (item.daysLeft === 0) return <span className={`echeChip ${cls}`}>Aujourd'hui</span>;
  if (item.daysLeft === 1) return <span className={`echeChip ${cls}`}>Demain</span>;
  return <span className={`echeChip ${cls}`}>{item.daysLeft} j</span>;
}

function EcheanceRow({ item }: { item: EcheanceItem }) {
  const color = MODULE_COLORS[item.moduleId] ?? "#64748b";
  return (
    <a href={item.href} className={`echeRow ${URGENCY_CONFIG[item.urgency].cls}`}>
      {/* Zone 1 — titre + module */}
      <div className="echeRowTitle">
        <span className="echeModuleChip" style={{ background: `${color}18`, color }}>
          {item.moduleName}
        </span>
        <span className="echeRowLabel">{item.label}</span>
      </div>

      {/* Zone 2 — site + responsable */}
      <div className="echeRowContext">
        <span className="echeContextItem">
          <MapPin size={11} />
          {item.site}
        </span>
        <span className="echeContextItem">
          <User size={11} />
          {item.owner}
        </span>
      </div>

      {/* Zone 3 — échéance */}
      <div className="echeRowRight">
        <CountdownChip item={item} />
        <span className="echeRowDate">{item.dueDate}</span>
        <ChevronRight size={13} className="echeRowChevron" />
      </div>
    </a>
  );
}

export function EcheancierPanel() {
  const all = getUpcomingEcheances();
  const [filter, setFilter] = useState<"all" | UrgencyKey>("all");

  const counts: Record<UrgencyKey, number> = {
    overdue: all.filter((i) => i.urgency === "overdue").length,
    urgent:  all.filter((i) => i.urgency === "urgent").length,
    week:    all.filter((i) => i.urgency === "week").length,
    soon:    all.filter((i) => i.urgency === "soon").length,
  };

  const filtered = filter === "all" ? all : all.filter((i) => i.urgency === filter);
  const groups = (["overdue", "urgent", "week", "soon"] as UrgencyKey[]).filter(
    (u) => (filter === "all" ? counts[u] > 0 : filter === u),
  );

  return (
    <section className="cockpitBlock echeancierBlock">
      <div className="sectionTitle">
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} />
            Echeancier HSE
          </h2>
          <p>Enregistrements et alertes dont l'echeance approche ou est depassee.</p>
        </div>
        <span className="echeTotalBadge">{all.length} element{all.length > 1 ? "s" : ""}</span>
      </div>

      {/* ── Pills compactes ── */}
      <div className="echePillRow">
        {(["overdue", "urgent", "week", "soon"] as UrgencyKey[]).map((u) => {
          const cfg = URGENCY_CONFIG[u];
          return (
            <button
              key={u}
              className={`echePill ${cfg.cls}${filter === u ? " selected" : ""}`}
              onClick={() => setFilter(filter === u ? "all" : u)}
            >
              <strong className="echePillCount">{counts[u]}</strong>
              <div className="echePillText">
                <span>{cfg.label}</span>
                <small>{cfg.sublabel}</small>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Liste groupée ── */}
      {filtered.length === 0 ? (
        <div className="echeEmpty">
          <Clock size={15} />
          Aucune echeance dans cette categorie.
        </div>
      ) : (
        <div className="echeGroupedList">
          {groups.map((u) => {
            const items = filter === "all"
              ? filtered.filter((i) => i.urgency === u)
              : filtered;
            if (!items.length) return null;
            return (
              <div key={u} className="echeGroup">
                {filter === "all" && (
                  <div className={`echeGroupHeader ${URGENCY_CONFIG[u].cls}`}>
                    <span className={`echeGroupDot ${URGENCY_CONFIG[u].cls}`} />
                    {URGENCY_CONFIG[u].label}
                    <span className="echeGroupCount">{items.length}</span>
                  </div>
                )}
                {items.map((item) => (
                  <EcheanceRow key={item.id} item={item} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
