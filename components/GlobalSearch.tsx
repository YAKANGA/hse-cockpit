"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { hseAlerts } from "@/lib/alerts-data";
import { modules } from "@/lib/hse-data";
import { moduleRecords } from "@/lib/module-records-data";

type SearchCategory = "modules" | "alertes" | "enregistrements" | "pages";

type SearchResult = {
  id: string;
  category: SearchCategory;
  label: string;
  description: string;
  href: string;
  badge?: string;
  badgeStyle?: string;
};

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  modules: "Modules HSE",
  alertes: "Alertes",
  enregistrements: "Enregistrements",
  pages: "Pages",
};

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  for (const m of modules) {
    results.push({
      id: `mod-${m.id}`,
      category: "modules",
      label: m.shortName,
      description: m.description,
      href: `/modules/${m.id}`,
      badge: `${m.compliance}% conf.`,
      badgeStyle: m.compliance >= 80 ? "ok" : "warn",
    });
  }

  for (const a of hseAlerts) {
    results.push({
      id: `alt-${a.id}`,
      category: "alertes",
      label: a.title,
      description: `${a.moduleName} · ${a.site} · ${a.owner}`,
      href: "/alerts",
      badge: a.severity,
      badgeStyle: a.severity === "Critique" ? "critical" : a.severity === "Haute" ? "warn" : "info",
    });
  }

  for (const r of moduleRecords) {
    const mod = modules.find((m) => m.id === r.moduleId);
    results.push({
      id: `rec-${r.id}`,
      category: "enregistrements",
      label: r.label,
      description: `${mod?.shortName ?? r.moduleId} · ${r.site} · ${r.owner}`,
      href: `/modules/${r.moduleId}`,
      badge: r.status,
      badgeStyle:
        r.status === "Clos" || r.status === "Valide"
          ? "ok"
          : r.priority === "Critique"
            ? "critical"
            : "info",
    });
  }

  const staticPages: Omit<SearchResult, "category">[] = [
    {
      id: "pg-cockpit",
      label: "Cockpit HSE",
      description: "Tableau de bord général consolidé",
      href: "/",
    },
    {
      id: "pg-reports",
      label: "Rapports & Exports",
      description: "PDF, Word, modèles Excel par module",
      href: "/reports",
    },
    {
      id: "pg-alerts",
      label: "Centre d'alertes",
      description: "Alertes HSE par module et priorité",
      href: "/alerts",
    },
    {
      id: "pg-admin",
      label: "Administration",
      description: "Comptes, rôles et paramètres entreprise",
      href: "/admin",
    },
    {
      id: "pg-admin-imports",
      label: "Historique des imports",
      description: "Traçabilité des fichiers importés par module",
      href: "/admin/imports",
    },
    {
      id: "pg-admin-validation",
      label: "Règles de validation",
      description: "Contrôles des imports Excel par champ",
      href: "/admin/validation",
    },
    {
      id: "pg-admin-referentiels",
      label: "Référentiels métier",
      description: "Sites, entités, catégories HSE",
      href: "/admin/referentiels",
    },
    {
      id: "pg-admin-security",
      label: "Sécurité & accès",
      description: "Droits effectifs et contrôle d'accès",
      href: "/admin/security",
    },
    {
      id: "pg-admin-audit",
      label: "Journal d'audit",
      description: "Historique des actions utilisateurs",
      href: "/admin/audit",
    },
    {
      id: "pg-super-admin",
      label: "Super Admin — Tenants",
      description: "Gestion multi-tenant et entreprises",
      href: "/super-admin/tenants",
    },
  ];

  for (const p of staticPages) {
    results.push({ ...p, category: "pages" });
  }

  return results;
}

const SEARCH_INDEX = buildIndex();

function score(result: SearchResult, q: string): number {
  const label = result.label.toLowerCase();
  const desc = result.description.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (desc.includes(q)) return 40;
  return 0;
}

function runSearch(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return SEARCH_INDEX.filter((r) => score(r, q) > 0)
    .sort((a, b) => score(b, q) - score(a, q))
    .slice(0, 14);
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => runSearch(query), [query]);

  const grouped = useMemo(() => {
    const map = new Map<SearchCategory, SearchResult[]>();
    for (const r of results) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [results]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setSelectedIdx(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        isOpen ? close() : open();
      }
      if (e.key === "Escape" && isOpen) close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, open, close]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  function onModalKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      window.location.href = results[selectedIdx].href;
      close();
    }
  }

  return (
    <>
      <button className="gsearchTrigger" onClick={open} aria-label="Recherche globale (Ctrl+K)">
        <Search size={15} />
        <span className="gsearchTriggerLabel">Rechercher…</span>
        <kbd className="gsearchKbd">Ctrl K</kbd>
      </button>

      {isOpen && (
        <div className="gsearchOverlay" onClick={close} aria-modal="true" role="dialog">
          <div className="gsearchModal" onClick={(e) => e.stopPropagation()} onKeyDown={onModalKey}>
            <div className="gsearchInputRow">
              <Search size={18} className="gsearchInputIcon" />
              <input
                ref={inputRef}
                className="gsearchInput"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIdx(0);
                }}
                placeholder="Modules, alertes, enregistrements, pages…"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button className="gsearchClear" onClick={() => setQuery("")} aria-label="Effacer">
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="gsearchBody">
              {!query && (
                <p className="gsearchHint">
                  Tapez un terme pour rechercher dans les modules, alertes, enregistrements et pages HSE.
                </p>
              )}

              {query && results.length === 0 && (
                <p className="gsearchHint">
                  Aucun résultat pour <strong>«&nbsp;{query}&nbsp;»</strong>
                </p>
              )}

              {results.length > 0 &&
                Array.from(grouped.entries()).map(([category, items]) => (
                  <div key={category} className="gsearchGroup">
                    <p className="gsearchGroupLabel">{CATEGORY_LABELS[category]}</p>
                    {items.map((item) => {
                      const idx = results.indexOf(item);
                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          className={`gsearchItem${idx === selectedIdx ? " selected" : ""}`}
                          onClick={close}
                          onMouseEnter={() => setSelectedIdx(idx)}
                        >
                          <div className="gsearchItemMain">
                            <span className="gsearchItemLabel">{item.label}</span>
                            <span className="gsearchItemDesc">{item.description}</span>
                          </div>
                          {item.badge && (
                            <span className={`gsearchBadge ${item.badgeStyle ?? ""}`}>
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight size={13} className="gsearchChevron" />
                        </a>
                      );
                    })}
                  </div>
                ))}
            </div>

            <div className="gsearchFooter">
              <span>
                <kbd>↑↓</kbd> Naviguer
              </span>
              <span>
                <kbd>↵</kbd> Ouvrir
              </span>
              <span>
                <kbd>Esc</kbd> Fermer
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
