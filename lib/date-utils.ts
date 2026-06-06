/** Converts DD/MM/YYYY → YYYY-MM-DD for ISO string comparison. Returns "" if input is invalid. */
export function ddmmyyyyToISO(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/** Returns true if ddmmyyyy falls within [debut, fin] (both optional). Invalid dates are never excluded. */
export function dateInRange(ddmmyyyy: string, debut?: string, fin?: string): boolean {
  if (!debut && !fin) return true;
  const iso = ddmmyyyyToISO(ddmmyyyy);
  if (!iso) return true; // date invalide → ne pas exclure
  if (debut && iso < debut) return false;
  if (fin   && iso > fin)   return false;
  return true;
}

/** Returns true if an ISO date (YYYY-MM-DD or YYYY-MM) falls within [debut, fin] (both YYYY-MM-DD). */
export function isoDateInRange(isoDate: string, debut?: string, fin?: string): boolean {
  if (!debut && !fin) return true;
  if (!isoDate) return true;
  if (debut && isoDate < debut.slice(0, isoDate.length)) return false;
  if (fin   && isoDate > fin.slice(0, isoDate.length))   return false;
  return true;
}
