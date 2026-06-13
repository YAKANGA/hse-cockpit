"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, FolderOpen, MapPin, X } from "lucide-react";
import { readCockpitFilter, writeCockpitFilter } from "@/lib/use-cockpit-filter";
import { getSitesByTenant, cityForSiteId } from "@/lib/sites-catalog";
import { getProjectsForSites } from "@/lib/projects-data";
import { demoSessions } from "@/lib/permissions";

type Pos = { top: number; left: number; width: number };
const fallbackTenantId = demoSessions.find((s) => s.tenantId)?.tenantId ?? "";

function MultiSelectDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
  renderLabel,
  disabled,
}: {
  label: string;
  icon: React.ElementType;
  options: { value: string; label: string; sub?: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  renderLabel?: (sel: string[], opts: { value: string; label: string }[]) => string;
  disabled?: boolean;
}) {
  const [open, setOpen]       = useState(false);
  const [pos, setPos]         = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left, width: Math.max(r.width, 240) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (dropRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(value: string) {
    onChange(selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]);
  }

  const btnLabel = renderLabel
    ? renderLabel(selected, options)
    : selected.length === 0 ? label
    : selected.length === 1 ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
    : `${selected.length} sélectionnés`;

  const dropdownContent = (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        minWidth: pos?.width ?? 240,
        zIndex: 99999,
        background: "var(--panel, #fff)",
        border: "1px solid var(--line, #e2e8f0)",
        borderRadius: 12,
        boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        padding: 6,
        display: "flex",
        flexDirection: "column" as const,
        gap: 2,
      }}
    >
      {options.length === 0 && (
        <p style={{ padding: "8px 12px", fontSize: 13, color: "#64748b", margin: 0 }}>
          Aucun élément disponible
        </p>
      )}
      {options.map((opt) => {
        const checked = selected.includes(opt.value);
        return (
          <label
            key={opt.value}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: checked ? 600 : 400,
              color: checked ? "var(--primary, #0f766e)" : "var(--ink, #1e293b)",
              background: checked ? "var(--primary-faint, #f0fdf4)" : "transparent",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.value)}
              style={{ width: 15, height: 15, accentColor: "#0f766e", cursor: "pointer", flexShrink: 0 }}
            />
            <span style={{ flex: 1 }}>
              {opt.label}
              {opt.sub && (
                <span style={{ display: "block", fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>
                  {opt.sub}
                </span>
              )}
            </span>
          </label>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            marginTop: 4, padding: "6px 12px",
            border: "none", borderTop: "1px solid var(--line, #e2e8f0)",
            background: "none", fontSize: 11, color: "#94a3b8",
            cursor: "pointer", width: "100%", borderRadius: "0 0 8px 8px",
          }}
        >
          <X size={11} /> Tout désélectionner
        </button>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`cockpitMultiSelectBtn${selected.length ? " hasSelection" : ""}${disabled ? " disabled" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-expanded={open}
        disabled={disabled}
      >
        <Icon size={13} className="cockpitFilterIcon" />
        <span>{btnLabel}</span>
        {selected.length > 0 && <span className="cockpitFilterBadge">{selected.length}</span>}
        <ChevronDown size={12} className={`cockpitFilterChevron${open ? " rotated" : ""}`} />
      </button>
      {mounted && open && pos && createPortal(dropdownContent, document.body)}
    </>
  );
}

// ── DateRangePicker ───────────────────────────────────────────────────────────
const dateInputStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px",
  border: "1px solid var(--line, #e2e8f0)", borderRadius: 8,
  fontSize: 13, color: "var(--ink, #1e293b)",
  background: "var(--surface, #f8fafc)", outline: "none",
  cursor: "pointer", boxSizing: "border-box",
};

function DateRangePicker({
  dateDebut, dateFin, onChange,
}: {
  dateDebut: string; dateFin: string;
  onChange: (debut: string, fin: string) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [pos, setPos]         = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left, width: Math.max(r.width, 280) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function fmt(d: string) {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  const hasDate = !!(dateDebut || dateFin);
  const btnLabel = !dateDebut && !dateFin ? "Toute période"
    : dateDebut && dateFin ? `${fmt(dateDebut)} – ${fmt(dateFin)}`
    : dateDebut ? `Depuis ${fmt(dateDebut)}`
    : `Jusqu'au ${fmt(dateFin)}`;

  const dropdownContent = (
    <div
      ref={dropRef}
      style={{
        position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0,
        minWidth: pos?.width ?? 280, zIndex: 99999,
        background: "var(--panel, #fff)", border: "1px solid var(--line, #e2e8f0)",
        borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        padding: 14, display: "flex", flexDirection: "column" as const, gap: 10,
      }}
    >
      <label style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Du</span>
        <input type="date" value={dateDebut} max={dateFin || undefined} onChange={(e) => onChange(e.target.value, dateFin)} style={dateInputStyle} />
      </label>
      <label style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Au</span>
        <input type="date" value={dateFin} min={dateDebut || undefined} onChange={(e) => onChange(dateDebut, e.target.value)} style={dateInputStyle} />
      </label>
      {hasDate && (
        <button
          type="button"
          onClick={() => { onChange("", ""); setOpen(false); }}
          style={{
            display: "flex", alignItems: "center", gap: 5, marginTop: 2, padding: "6px 12px",
            border: "none", borderTop: "1px solid var(--line, #e2e8f0)", background: "none",
            fontSize: 11, color: "#94a3b8", cursor: "pointer", width: "100%", borderRadius: "0 0 8px 8px",
          }}
        >
          <X size={11} /> Effacer les dates
        </button>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`cockpitMultiSelectBtn${hasDate ? " hasSelection" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <CalendarDays size={13} className="cockpitFilterIcon" />
        <span>{btnLabel}</span>
        <ChevronDown size={12} className={`cockpitFilterChevron${open ? " rotated" : ""}`} />
      </button>
      {mounted && open && pos && createPortal(dropdownContent, document.body)}
    </>
  );
}

// ── CockpitFiltersBar ─────────────────────────────────────────────────────────
export function CockpitFiltersBar() {
  const [userId, setUserId]       = useState("tenant-admin-acme");
  const [tenantId, setTenantId]   = useState<string>("");
  const [siteIds, setSiteIds]     = useState<string[]>([]);
  const [projets, setProjets]     = useState<string[]>([]);
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin]     = useState<string>("");

  // Charger la session et le filtre sauvegardé
  useEffect(() => {
    const stored = localStorage.getItem("hse-active-user") ?? "tenant-admin-acme";
    const session = demoSessions.find((s) => s.userId === stored) ?? demoSessions[1];
    setUserId(session.userId);

    const f = readCockpitFilter();
    setSiteIds(f.siteIds);
    setProjets(f.projets);
    setDateDebut(f.dateDebut ?? "");
    setDateFin(f.dateFin ?? "");

    // Initialiser le tenantId : soit depuis le filtre sauvegardé, soit depuis la session
    const savedTenant = f.tenantId ?? session.tenantId ?? fallbackTenantId;
    setTenantId(savedTenant);

    function onSession(e: Event) {
      const next = e instanceof CustomEvent ? String(e.detail) : localStorage.getItem("hse-active-user") ?? "";
      const nextSession = demoSessions.find((s) => s.userId === next) ?? demoSessions[1];
      setUserId(nextSession.userId);
      // Changer de session réinitialise les filtres au périmètre du nouveau user
      const newTenant = nextSession.tenantId ?? fallbackTenantId;
      setTenantId(newTenant);
      setSiteIds([]);
      setProjets([]);
      writeCockpitFilter({ tenantId: newTenant, siteIds: [], villes: [], projets: [] });
    }
    window.addEventListener("hse-active-user-change", onSession);
    return () => window.removeEventListener("hse-active-user-change", onSession);
  }, []);

  const session = useMemo(
    () => demoSessions.find((s) => s.userId === userId) ?? demoSessions[1],
    [userId],
  );

  const isSuperAdmin = session.role === "SUPER_ADMIN";

  // Sites disponibles pour le tenant + scope de la session
  const availableSites = useMemo(() => {
    const tid = tenantId || session.tenantId || "";
    if (!tid) return [];
    const allTenantSites = getSitesByTenant(tid);
    if (session.allowedSiteIds === null || isSuperAdmin) return allTenantSites;
    return allTenantSites.filter((s) => session.allowedSiteIds!.includes(s.id));
  }, [tenantId, session, isSuperAdmin]);

  const siteOptions = availableSites.map((s) => ({
    value: s.id,
    label: s.name,
    sub: s.region,
  }));

  // Projets disponibles pour les sites sélectionnés
  const availableProjects = useMemo(() => {
    const tid = tenantId || session.tenantId || "";
    if (!tid) return [];
    const effectiveSiteIds = siteIds.length ? siteIds : availableSites.map((s) => s.id);
    const pool = getProjectsForSites(tid, effectiveSiteIds.length ? effectiveSiteIds : null);
    if (session.allowedProjectIds === null || isSuperAdmin) return pool;
    return pool.filter((p) => session.allowedProjectIds!.includes(p.id));
  }, [tenantId, siteIds, availableSites, session, isSuperAdmin]);

  const projetOptions = availableProjects.map((p) => ({
    value: p.id,
    label: p.shortName,
    sub: p.city,
  }));

  function commit(next: Partial<{ tenantId: string; siteIds: string[]; projets: string[]; dateDebut: string; dateFin: string }>) {
    const newTenantId  = next.tenantId  ?? tenantId;
    const newSiteIds   = next.siteIds   ?? siteIds;
    const newProjets   = next.projets   ?? projets;
    const newDateDebut = next.dateDebut ?? dateDebut;
    const newDateFin   = next.dateFin   ?? dateFin;
    const villes = newSiteIds.map((id) => cityForSiteId(id)).filter(Boolean) as string[];
    writeCockpitFilter({
      tenantId: newTenantId, siteIds: newSiteIds, villes, projets: newProjets,
      dateDebut: newDateDebut || undefined, dateFin: newDateFin || undefined,
    });
  }

  function onSitesChange(next: string[]) {
    // Purger les projets hors des nouveaux sites
    const newSitesSet = new Set(next.length ? next : availableSites.map((s) => s.id));
    const tid = tenantId || session.tenantId || "";
    const keepProjets = projets.filter((pid) => {
      const p = availableProjects.find((ap) => ap.id === pid);
      return p && newSitesSet.has(p.siteId);
    });
    setSiteIds(next);
    setProjets(keepProjets);
    commit({ siteIds: next, projets: keepProjets });
  }

  function onProjetsChange(next: string[]) {
    setProjets(next);
    commit({ projets: next });
  }

  function onDateChange(debut: string, fin: string) {
    setDateDebut(debut);
    setDateFin(fin);
    commit({ dateDebut: debut, dateFin: fin });
  }

  const hasFilter = siteIds.length > 0 || projets.length > 0 || !!dateDebut || !!dateFin;

  return (
    <div className="cockpitFiltersBar">
      {/* Sites — cascade depuis le tenant */}
      <MultiSelectDropdown
        label="Tous les sites"
        icon={MapPin}
        options={siteOptions}
        selected={siteIds}
        onChange={onSitesChange}
        renderLabel={(sel, opts) =>
          !sel.length ? "Tous les sites"
          : sel.length === 1 ? (opts.find((o) => o.value === sel[0])?.label ?? "1 site")
          : `${sel.length} sites`
        }
      />

      {/* Projets — cascade depuis les sites */}
      <MultiSelectDropdown
        label="Tous les projets"
        icon={FolderOpen}
        options={projetOptions}
        selected={projets}
        onChange={onProjetsChange}
        renderLabel={(sel, opts) =>
          !sel.length ? "Tous les projets"
          : sel.length === 1 ? (opts.find((o) => o.value === sel[0])?.label ?? "1 projet")
          : `${sel.length} projets`
        }
      />

      {/* Période */}
      <DateRangePicker dateDebut={dateDebut} dateFin={dateFin} onChange={onDateChange} />

      {/* Réinitialiser */}
      {hasFilter && (
        <button
          type="button"
          className="cockpitFilterClear"
          onClick={() => {
            setSiteIds([]);
            setProjets([]);
            setDateDebut("");
            setDateFin("");
            writeCockpitFilter({ tenantId, siteIds: [], villes: [], projets: [] });
          }}
        >
          <X size={13} /> Effacer
        </button>
      )}
    </div>
  );
}
