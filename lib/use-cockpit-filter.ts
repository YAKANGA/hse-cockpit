"use client";

import { useEffect, useState } from "react";
import { SITES } from "@/lib/sites-data";
import { projects } from "@/lib/projects-data";

export const ALL_CITIES = [...SITES] as string[];
export const ALL_PROJECTS_LABEL = "Tous les projets";

export type CockpitFilter = {
  villes: string[];
  projets: string[];
};

const STORAGE_KEY_VILLES  = "hse-cockpit-villes";
const STORAGE_KEY_PROJETS = "hse-cockpit-projets";
export const COCKPIT_FILTER_EVENT = "hse-cockpit-filter-change";

export function getProjectsForCities(villes: string[]) {
  if (!villes.length) return projects;
  return projects.filter((p) => villes.includes(p.city));
}

export function readCockpitFilter(): CockpitFilter {
  if (typeof window === "undefined") return { villes: [], projets: [] };
  try {
    const villes  = JSON.parse(localStorage.getItem(STORAGE_KEY_VILLES)  ?? "[]") as string[];
    const projets = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJETS) ?? "[]") as string[];
    return { villes, projets };
  } catch {
    return { villes: [], projets: [] };
  }
}

export function writeCockpitFilter(filter: CockpitFilter) {
  localStorage.setItem(STORAGE_KEY_VILLES,  JSON.stringify(filter.villes));
  localStorage.setItem(STORAGE_KEY_PROJETS, JSON.stringify(filter.projets));
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

export function matchesFilter(record: { site?: string; projectId?: string }, filter: CockpitFilter): boolean {
  const villeOk  = !filter.villes.length  || (record.site      ? filter.villes.includes(record.site)      : true);
  const projetOk = !filter.projets.length || (record.projectId ? filter.projets.includes(record.projectId) : true);
  return villeOk && projetOk;
}
