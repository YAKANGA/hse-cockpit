/**
 * Catalogue canonique des sites par entreprise (tenant).
 * Invariant critique : HSESite.name === project.city === moduleRecord.site (valeur legacy).
 * Ne jamais modifier .name sans migrer simultanément tous les records.
 */

export type HSESite = {
  id: string;
  tenantId: string;
  name: string;    // clé de jointure legacy : égale à project.city et record.site
  region?: string;
  active: boolean;
};

export const allSites: HSESite[] = [
  // ── ACME BTP ──────────────────────────────────────────────
  { id: "SITE-ACME-ABJ", tenantId: "acme-btp",    name: "Abidjan",      region: "Lagunes",           active: true  },
  { id: "SITE-ACME-BKE", tenantId: "acme-btp",    name: "Bouake",       region: "Vallée du Bandama", active: true  },
  { id: "SITE-ACME-SPD", tenantId: "acme-btp",    name: "San Pedro",    region: "San-Pédro",         active: true  },
  { id: "SITE-ACME-YMK", tenantId: "acme-btp",    name: "Yamoussoukro", region: "Yamoussoukro",      active: true  },

  // ── Delta Mining ──────────────────────────────────────────
  { id: "SITE-DM-KOR",   tenantId: "delta-mining", name: "Korhogo",      region: "Savanes",           active: true  },
  { id: "SITE-DM-FER",   tenantId: "delta-mining", name: "Ferké",        region: "Savanes",           active: false },

  // ── Medlog CI ─────────────────────────────────────────────
  { id: "SITE-MDL-ABJ",  tenantId: "medlog-ci",   name: "Abidjan Port", region: "Lagunes",           active: true  },
  { id: "SITE-MDL-BSM",  tenantId: "medlog-ci",   name: "Grand-Bassam", region: "Sud-Comoé",         active: true  },
];

/** Sites actifs d'un tenant donné. */
export function getSitesByTenant(tenantId: string): HSESite[] {
  return allSites.filter((s) => s.tenantId === tenantId && s.active);
}

/** Site par son ID. */
export function getSiteById(siteId: string): HSESite | undefined {
  return allSites.find((s) => s.id === siteId);
}

/** Pont legacy : siteId depuis (tenantId + nom de ville). */
export function siteIdForCity(tenantId: string, city: string): string | undefined {
  return allSites.find((s) => s.tenantId === tenantId && s.name === city)?.id;
}

/** Pont inverse : nom de ville (valeur legacy) depuis siteId. */
export function cityForSiteId(siteId: string): string | undefined {
  return getSiteById(siteId)?.name;
}

/** Sites filtrés par une liste de siteIds (null = tous les sites du tenant). */
export function filterSites(tenantId: string, allowedSiteIds: string[] | null): HSESite[] {
  const tenantSites = getSitesByTenant(tenantId);
  if (!allowedSiteIds) return tenantSites;
  return tenantSites.filter((s) => allowedSiteIds.includes(s.id));
}
