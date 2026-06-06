"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronRight, Clock, Eye, EyeOff, MapPin, User } from "lucide-react";
import { getUpcomingEcheances, type EcheanceItem } from "@/lib/sites-data";
import { useCockpitFilter, dateInRange } from "@/lib/use-cockpit-filter";

type UrgencyKey = "overdue" | "urgent" | "week" | "soon";

const URGENCY_CONFIG: Record<UrgencyKey, { label: string; sublabel: string; cls: string }> = {
  overdue: { label: "En retard",     sublabel: "Echeance depassee", cls: "echeOverdue" },
  urgent:  { label: "Urgent",        sublabel: "Moins de 2 jours",  cls: "echeUrgent"  },
  week:    { label: "Cette semaine", sublabel: "Dans les 7 jours",  cls: "echeWeek"    },
  soon:    { label: "A venir",       sublabel: "Dans les 21 jours", cls: "echeSoon"    },
};

const MODULE_COLORS: Record<string, string> = {
  events:       "#c2410c",
  inspections:  "#047857",
  permits:      "#b45309",
  actions:      "#2563eb",
  indicators:   "#7c3aed",
  ppe:          "#0e7490",
  environment:  "#15803d",
  training:     "#1d4ed8",
  causeries:    "#0891b2",
  duerp:        "#7c3aed",
  medical:      "#be185d",
  acr:          "#c2410c",
  consumption:  "#0369a1",
  planification:"#6d28d9",
  vbg:          "#be185d",
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
      <div className="echeRowTitle">
        <span className="echeModuleChip" style={{ background: `${color}18`, color }}>
          {item.moduleName}
        </span>
        <span className="echeRowLabel">{item.label}</span>
      </div>
      <div className="echeRowContext">
        <span className="echeContextItem echeContextProject">
          <MapPin size={11} />
          {item.projectName}
        </span>
        <span className="echeContextItem">
          <User size={11} />
          {item.owner}
        </span>
      </div>
      <div className="echeRowRight">
        <CountdownChip item={item} />
        <span className="echeRowDate">{item.dueDate}</span>
        <ChevronRight size={13} className="echeRowChevron" />
      </div>
    </a>
  );
}

export function EcheancierPanel() {
  const { villes, projets, dateDebut, dateFin } = useCockpitFilter();
  const all = useMemo(() => {
    const items = getUpcomingEcheances();
    return items.filter((i) => {
      if (villes.length  && !villes.includes(i.site))             return false;
      if (projets.length && !projets.includes(i.projectId ?? "")) return false;
      if (!dateInRange(i.dueDate, dateDebut, dateFin))            return false;
      return true;
    });
  }, [villes, projets, dateDebut, dateFin]);
  const [filter, setFilter] = useState<"all" | UrgencyKey>("all");
  const [collapsed, setCollapsed] = useState<Set<UrgencyKey>>(new Set(["overdue", "urgent", "week", "soon"] as UrgencyKey[]));

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

  const allCollapsed = groups.every((u) => collapsed.has(u));

  function toggleGroup(u: UrgencyKey) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(u)) next.delete(u);
      else next.add(u);
      return next;
    });
  }

  function toggleAll() {
    if (allCollapsed) {
      setCollapsed(new Set());
    } else {
      setCollapsed(new Set(groups));
    }
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="echeToggleAllBtn"
            onClick={toggleAll}
            title={allCollapsed ? "Tout afficher" : "Tout masquer"}
          >
            {allCollapsed ? <Eye size={14} /> : <EyeOff size={14} />}
            {allCollapsed ? "Tout afficher" : "Tout masquer"}
          </button>
          <span className="echeTotalBadge">{all.length} element{all.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── Pills ── */}
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
            const isCollapsed = collapsed.has(u);

            return (
              <div key={u} className="echeGroup">
                {filter === "all" ? (
                  <button
                    className={`echeGroupHeader echeGroupHeaderBtn ${URGENCY_CONFIG[u].cls}`}
                    onClick={() => toggleGroup(u)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className={`echeGroupDot ${URGENCY_CONFIG[u].cls}`} />
                    {URGENCY_CONFIG[u].label}
                    <span className="echeGroupCount">{items.length}</span>
                    <span className="echeGroupChevron">
                      {isCollapsed
                        ? <ChevronRight size={13} />
                        : <ChevronDown size={13} />}
                    </span>
                  </button>
                ) : null}

                {!isCollapsed && (
                  <div className="echeGroupItems">
                    {items.map((item) => (
                      <EcheanceRow key={item.id} item={item} />
                    ))}
                  </div>
                )}

                {isCollapsed && filter === "all" && (
                  <div className="echeGroupCollapsed">
                    {items.map((item) => (
                      <span key={item.id} className={`echeCollapsedDot ${URGENCY_CONFIG[u].cls}`} title={item.label} />
                    ))}
                    <span className="echeCollapsedLabel">
                      {items.length} element{items.length > 1 ? "s" : ""} masque{items.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
