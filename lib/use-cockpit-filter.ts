"use client";

import { useEffect, useState } from "react";
import { SITES } from "@/lib/sites-data";
import { projects } from "@/lib/projects-data";
import { dateInRange } from "@/lib/date-utils";

export { ddmmyyyyToISO, dateInRange } from "@/lib/date-utils";

export const ALL_CITIES = [...SITES] as string[];
export const ALL_PROJECTS_LABEL = "Tous les projets";

export type CockpitFilter = {
  villes: string[];
  projets: string[];
  dateDebut?: string; // YYYY-MM-DD
  dateFin?: string;   // YYYY-MM-DD
};

const STORAGE_KEY_VILLES      = "hse-cockpit-villes";
const STORAGE_KEY_PROJETS     = "hse-cockpit-projets";
const STORAGE_KEY_DATE_DEBUT  = "hse-cockpit-date-debut";
const STORAGE_KEY_DATE_FIN    = "hse-cockpit-date-fin";
export const COCKPIT_FILTER_EVENT = "hse-cockpit-filter-change";

export function getProjectsForCities(villes: string[]) {
  if (!villes.length) return projects;
  return projects.filter((p) => villes.includes(p.city));
}

export function readCockpitFilter(): CockpitFilter {
  if (typeof window === "undefined") return { villes: [], projets: [] };
  try {
    const villes     = JSON.parse(localStorage.getItem(STORAGE_KEY_VILLES)  ?? "[]") as string[];
    const projets    = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJETS) ?? "[]") as string[];
    const dateDebut  = localStorage.getItem(STORAGE_KEY_DATE_DEBUT) || undefined;
    const dateFin    = localStorage.getItem(STORAGE_KEY_DATE_FIN)   || undefined;
    return { villes, projets, dateDebut, dateFin };
  } catch {
    return { villes: [], projets: [] };
  }
}

export function writeCockpitFilter(filter: CockpitFilter) {
  localStorage.setItem(STORAGE_KEY_VILLES,  JSON.stringify(filter.villes));
  localStorage.setItem(STORAGE_KEY_PROJETS, JSON.stringify(filter.projets));
  if (filter.dateDebut) localStorage.setItem(STORAGE_KEY_DATE_DEBUT, filter.dateDebut);
  else localStorage.removeItem(STORAGE_KEY_DATE_DEBUT);
  if (filter.dateFin) localStorage.setItem(STORAGE_KEY_DATE_FIN, filter.dateFin);
  else localStorage.removeItem(STORAGE_KEY_DATE_FIN);
  window.dispatchEvent(new CustomEvent(COCKPIT_FILTER_EVENT, { detail: filter }));
}

export function useCockpitFilter(): CockpitFilter {
  const [filter, setFilter] = useState<CockpitFilter>({ villes: [], projets: [] });

  useEffect(() => {
    setFilter(readCockpitFilter());

    function onFilterChange(e: Event) {
      if (e instanceof CustomEvent) {
        setFilter(e.detail as CockpitFilter);
      } else {
        setFilter(readCockpitFilter());
      }
    }

    window.addEventListener(COCKPIT_FILTER_EVENT, onFilterChange);
    window.addEventListener("storage", onFilterChange);
    return () => {
      window.removeEventListener(COCKPIT_FILTER_EVENT, onFilterChange);
      window.removeEventListener("storage", onFilterChange);
    };
  }, []);

  return filter;
}

export function matchesFilter(
  record: { site?: string; projectId?: string; date?: string },
  filter: CockpitFilter
): boolean {
  const villeOk  = !filter.villes.length  || (record.site      ? filter.villes.includes(record.site)      : true);
  const projetOk = !filter.projets.length || (record.projectId ? filter.projets.includes(record.projectId) : true);
  const dateOk   = !record.date || dateInRange(record.date, filter.dateDebut, filter.dateFin);
  return villeOk && projetOk && dateOk;
}

/**
 * Returns the list of active sites derived from villes + projets filters.
 * Returns null when no site/project filter is active (= show all).
 */
export function getActiveSites(filter: CockpitFilter): string[] | null {
  const { villes, projets } = filter;
  if (!villes.length && !projets.length) return null;
  if (projets.length > 0) {
    const projectCities = projects.filter((p) => projets.includes(p.id)).map((p) => p.city);
    const unique = [...new Set(projectCities)];
    return villes.length ? villes.filter((v) => unique.includes(v)) : unique;
  }
  return villes;
}
