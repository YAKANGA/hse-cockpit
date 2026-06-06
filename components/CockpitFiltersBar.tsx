"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, FolderOpen, MapPin, X } from "lucide-react";
import {
  ALL_CITIES,
  getProjectsForCities,
  readCockpitFilter,
  writeCockpitFilter,
} from "@/lib/use-cockpit-filter";

type Pos = { top: number; left: number; width: number };

function MultiSelectDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
  renderLabel,
}: {
  label: string;
  icon: React.ElementType;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  renderLabel?: (sel: string[]) => string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
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
      // Keep open if click is inside the button OR inside the portal dropdown
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
    ? renderLabel(selected)
    : selected.length === 0 ? label
    : selected.length === 1 ? selected[0]
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
            {opt.label}
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
        className={`cockpitMultiSelectBtn${selected.length ? " hasSelection" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
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

const dateInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid var(--line, #e2e8f0)",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--ink, #1e293b)",
  background: "var(--surface, #f8fafc)",
  outline: "none",
  cursor: "pointer",
  boxSizing: "border-box",
};

function DateRangePicker({
  dateDebut,
  dateFin,
  onChange,
}: {
  dateDebut: string;
  dateFin: string;
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

  function fmt(d: string) {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  const hasDate = !!(dateDebut || dateFin);
  const btnLabel = !dateDebut && !dateFin
    ? "Toute période"
    : dateDebut && dateFin ? `${fmt(dateDebut)} – ${fmt(dateFin)}`
    : dateDebut ? `Depuis ${fmt(dateDebut)}`
    : `Jusqu'au ${fmt(dateFin)}`;

  const dropdownContent = (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        minWidth: pos?.width ?? 280,
        zIndex: 99999,
        background: "var(--panel, #fff)",
        border: "1px solid var(--line, #e2e8f0)",
        borderRadius: 12,
        boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        padding: 14,
        display: "flex",
        flexDirection: "column" as const,
        gap: 10,
      }}
    >
      <label style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Du</span>
        <input
          type="date"
          value={dateDebut}
          max={dateFin || undefined}
          onChange={(e) => onChange(e.target.value, dateFin)}
          style={dateInputStyle}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Au</span>
        <input
          type="date"
          value={dateFin}
          min={dateDebut || undefined}
          onChange={(e) => onChange(dateDebut, e.target.value)}
          style={dateInputStyle}
        />
      </label>
      {hasDate && (
        <button
          type="button"
          onClick={() => { onChange("", ""); setOpen(false); }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            marginTop: 2, padding: "6px 12px",
            border: "none", borderTop: "1px solid var(--line, #e2e8f0)",
            background: "none", fontSize: 11, color: "#94a3b8",
            cursor: "pointer", width: "100%", borderRadius: "0 0 8px 8px",
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

export function CockpitFiltersBar() {
  const [villes, setVilles]         = useState<string[]>([]);
  const [projets, setProjets]       = useState<string[]>([]);
  const [dateDebut, setDateDebut]   = useState<string>("");
  const [dateFin, setDateFin]       = useState<string>("");

  useEffect(() => {
    const f = readCockpitFilter();
    setVilles(f.villes);
    setProjets(f.projets);
    setDateDebut(f.dateDebut ?? "");
    setDateFin(f.dateFin ?? "");
  }, []);

  function onVillesChange(next: string[]) {
    const available = getProjectsForCities(next).map((p) => p.id);
    const nextProjets = projets.filter((id) => available.includes(id));
    setVilles(next);
    setProjets(nextProjets);
    writeCockpitFilter({ villes: next, projets: nextProjets, dateDebut: dateDebut || undefined, dateFin: dateFin || undefined });
  }

  function onProjetsChange(next: string[]) {
    setProjets(next);
    writeCockpitFilter({ villes, projets: next, dateDebut: dateDebut || undefined, dateFin: dateFin || undefined });
  }

  function onDateChange(debut: string, fin: string) {
    setDateDebut(debut);
    setDateFin(fin);
    writeCockpitFilter({ villes, projets, dateDebut: debut || undefined, dateFin: fin || undefined });
  }

  const villeOptions = ALL_CITIES.map((c) => ({ value: c, label: c }));
  const projetOptions = getProjectsForCities(villes).map((p) => ({
    value: p.id,
    label: `${p.shortName} — ${p.city}`,
  }));

  return (
    <div className="cockpitFiltersBar">
      <MultiSelectDropdown
        label="Toutes les villes"
        icon={MapPin}
        options={villeOptions}
        selected={villes}
        onChange={onVillesChange}
        renderLabel={(sel) =>
          !sel.length || sel.length === ALL_CITIES.length ? "Toutes les villes" :
          sel.length === 1 ? sel[0] : `${sel.length} villes`
        }
      />
      <MultiSelectDropdown
        label="Tous les projets"
        icon={FolderOpen}
        options={projetOptions}
        selected={projets}
        onChange={onProjetsChange}
        renderLabel={(sel) =>
          !sel.length ? "Tous les projets" :
          sel.length === 1
            ? (projetOptions.find((o) => o.value === sel[0])?.label?.split(" — ")[0] ?? "1 projet")
            : `${sel.length} projets`
        }
      />
      <DateRangePicker
        dateDebut={dateDebut}
        dateFin={dateFin}
        onChange={onDateChange}
      />
      {(villes.length > 0 || projets.length > 0 || dateDebut || dateFin) && (
        <button
          type="button"
          className="cockpitFilterClear"
          onClick={() => {
            setVilles([]);
            setProjets([]);
            setDateDebut("");
            setDateFin("");
            writeCockpitFilter({ villes: [], projets: [] });
          }}
        >
          <X size={13} /> Effacer
        </button>
      )}
    </div>
  );
}
