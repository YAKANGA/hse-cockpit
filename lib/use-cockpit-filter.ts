"use client";

import { useEffect, useState } from "react";
import { SITES } from "@/lib/sites-data";
import { getProjectsForCities, getProjectsForSites, getProjectsByTenant, tenantIdForProjectId } from "@/lib/projects-data";
import { cityForSiteId } from "@/lib/sites-catalog";
import { dateInRange } from "@/lib/date-utils";

export { ddmmyyyyToISO, dateInRange } from "@/lib/date-utils";

export const ALL_CITIES = [...SITES] as string[];
export const ALL_PROJECTS_LABEL = "Tous les projets";

export type CockpitFilter = {
  /** Tenant actif (null = tous — uniquement pour SUPER_ADMIN). */
  tenantId?: string;
  /** IDs des sites sélectionnés (HSESite.id). [] = tous les sites du tenant. */
  siteIds: string[];
  /** Villes dérivées de siteIds — conservé pour rétro-compat des consommateurs legacy. */
  villes: string[];
  /** IDs des projets sélectionnés. */
  projets: string[];
  dateDebut?: string;
  dateFin?: string;
};

const STORAGE_KEY_TENANT     = "hse-cockpit-tenant";
const STORAGE_KEY_SITE_IDS   = "hse-cockpit-site-ids";
const STORAGE_KEY_VILLES     = "hse-cockpit-villes";
const STORAGE_KEY_PROJETS    = "hse-cockpit-projets";
const STORAGE_KEY_DATE_DEBUT = "hse-cockpit-date-debut";
const STORAGE_KEY_DATE_FIN   = "hse-cockpit-date-fin";
export const COCKPIT_FILTER_EVENT = "hse-cockpit-filter-change";

/** Projets disponibles pour les villes sélectionnées (legacy). */
export { getProjectsForCities };

/** Projets disponibles pour un tenant + liste de siteIds. */
export { getProjectsForSites };

export function readCockpitFilter(): CockpitFilter {
  if (typeof window === "undefined") return { siteIds: [], villes: [], projets: [] };
  try {
    const tenantId  = localStorage.getItem(STORAGE_KEY_TENANT) || undefined;
    const siteIds   = JSON.parse(localStorage.getItem(STORAGE_KEY_SITE_IDS) ?? "[]") as string[];
    const villes    = JSON.parse(localStorage.getItem(STORAGE_KEY_VILLES)   ?? "[]") as string[];
    const projets   = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJETS)  ?? "[]") as string[];
    const dateDebut = localStorage.getItem(STORAGE_KEY_DATE_DEBUT) || undefined;
    const dateFin   = localStorage.getItem(STORAGE_KEY_DATE_FIN)   || undefined;
    return { tenantId, siteIds, villes, projets, dateDebut, dateFin };
  } catch {
    return { siteIds: [], villes: [], projets: [] };
  }
}

export function writeCockpitFilter(filter: CockpitFilter) {
  if (filter.tenantId) localStorage.setItem(STORAGE_KEY_TENANT, filter.tenantId);
  else localStorage.removeItem(STORAGE_KEY_TENANT);

  localStorage.setItem(STORAGE_KEY_SITE_IDS, JSON.stringify(filter.siteIds));

  // Dériver les villes depuis siteIds pour rétro-compat
  const derivedVilles = filter.siteIds.length
    ? filter.siteIds.map((id) => cityForSiteId(id)).filter(Boolean) as string[]
    : filter.villes;
  localStorage.setItem(STORAGE_KEY_VILLES, JSON.stringify(derivedVilles));
  localStorage.setItem(STORAGE_KEY_PROJETS, JSON.stringify(filter.projets));

  if (filter.dateDebut) localStorage.setItem(STORAGE_KEY_DATE_DEBUT, filter.dateDebut);
  else localStorage.removeItem(STORAGE_KEY_DATE_DEBUT);
  if (filter.dateFin) localStorage.setItem(STORAGE_KEY_DATE_FIN, filter.dateFin);
  else localStorage.removeItem(STORAGE_KEY_DATE_FIN);

  window.dispatchEvent(new CustomEvent(COCKPIT_FILTER_EVENT, { detail: { ...filter, villes: derivedVilles } }));
}

export function useCockpitFilter(): CockpitFilter {
  const [filter, setFilter] = useState<CockpitFilter>({ siteIds: [], villes: [], projets: [] });

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
  filter: CockpitFilter,
): boolean {
  // Tenant isolation: if filter has a tenantId, reject records from other tenants
  if (filter.tenantId && record.projectId) {
    const recTenant = tenantIdForProjectId(record.projectId);
    if (recTenant && recTenant !== filter.tenantId) return false;
  }
  const effectiveVilles = filter.siteIds.length
    ? filter.siteIds.map((id) => cityForSiteId(id)).filter(Boolean) as string[]
    : filter.villes;
  const villeOk  = !effectiveVilles.length || (record.site      ? effectiveVilles.includes(record.site)      : true);
  const projetOk = !filter.projets.length  || (record.projectId ? filter.projets.includes(record.projectId) : true);
  const dateOk   = !record.date || dateInRange(record.date, filter.dateDebut, filter.dateFin);
  return villeOk && projetOk && dateOk;
}

/**
 * Retourne les villes actives dérivées du filtre (siteIds ou villes legacy).
 * null = aucun filtre actif (tout afficher).
 */
export function getActiveSites(filter: CockpitFilter): string[] | null {
  const { siteIds, villes, projets } = filter;

  if (!siteIds.length && !villes.length && !projets.length) return null;

  if (siteIds.length > 0) {
    const derived = siteIds.map((id) => cityForSiteId(id)).filter(Boolean) as string[];
    return derived.length ? derived : null;
  }

  if (projets.length > 0) {
    const allProjects = filter.tenantId ? getProjectsByTenant(filter.tenantId) : getProjectsForCities([]);
    const projectCities = allProjects.filter((p) => projets.includes(p.id)).map((p) => p.city);
    const unique = [...new Set(projectCities)];
    return villes.length ? villes.filter((v) => unique.includes(v)) : unique;
  }

  return villes;
}
