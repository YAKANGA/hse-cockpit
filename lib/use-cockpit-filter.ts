"use client";

import { useEffect, useState } from "react";
import { SITES } from "@/lib/sites-data";
import { projects } from "@/lib/projects-data";

export const ALL_CITIES = ["Toutes les villes", ...SITES] as const;
export const ALL_PROJECTS_LABEL = "Tous les projets";

export type CockpitFilter = {
  ville: string;
  projet: string;
};

const STORAGE_KEY_VILLE = "hse-cockpit-ville";
const STORAGE_KEY_PROJET = "hse-cockpit-projet";
export const COCKPIT_FILTER_EVENT = "hse-cockpit-filter-change";

export function getProjectsForCity(city: string) {
  if (!city || city === "Toutes les villes") return projects;
  return projects.filter((p) => p.city === city);
}

export function readCockpitFilter(): CockpitFilter {
  if (typeof window === "undefined") return { ville: "", projet: "" };
  return {
    ville: localStorage.getItem(STORAGE_KEY_VILLE) ?? "",
    projet: localStorage.getItem(STORAGE_KEY_PROJET) ?? "",
  };
}

export function writeCockpitFilter(filter: CockpitFilter) {
  localStorage.setItem(STORAGE_KEY_VILLE, filter.ville);
  localStorage.setItem(STORAGE_KEY_PROJET, filter.projet);
  window.dispatchEvent(new CustomEvent(COCKPIT_FILTER_EVENT, { detail: filter }));
}

export function useCockpitFilter(): CockpitFilter {
  const [filter, setFilter] = useState<CockpitFilter>({ ville: "", projet: "" });

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

export function matchesFilter(record: { site?: string; entity?: string }, filter: CockpitFilter): boolean {
  const villeOk = !filter.ville || record.site === filter.ville;
  const projetOk = !filter.projet || record.entity === filter.projet || record.site === filter.projet;
  return villeOk && projetOk;
}
