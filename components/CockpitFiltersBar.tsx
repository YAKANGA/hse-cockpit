"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, FolderOpen, MapPin, X } from "lucide-react";
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
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left, width: Math.max(r.width, 220) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    setTimeout(() => document.addEventListener("mousedown", close), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const btnLabel = renderLabel ? renderLabel(selected) : selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} sélectionnés`;

  const dropdown = mounted && open && pos ? createPortal(
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        minWidth: pos.width,
        zIndex: 99999,
        background: "var(--panel, #fff)",
        border: "1px solid var(--line, #e2e8f0)",
        borderRadius: 12,
        boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        padding: 6,
        display: "flex",
        flexDirection: "column",
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
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.value)}
              style={{ width: 15, height: 15, accentColor: "var(--primary, #0f766e)", cursor: "pointer", flexShrink: 0 }}
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
    </div>,
    document.body
  ) : null;

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
      {dropdown}
    </>
  );
}

export function CockpitFiltersBar() {
  const [villes, setVilles]   = useState<string[]>([]);
  const [projets, setProjets] = useState<string[]>([]);

  useEffect(() => {
    const f = readCockpitFilter();
    setVilles(f.villes);
    setProjets(f.projets);
  }, []);

  function onVillesChange(next: string[]) {
    const available = getProjectsForCities(next).map((p) => p.id);
    const nextProjets = projets.filter((id) => available.includes(id));
    setVilles(next);
    setProjets(nextProjets);
    writeCockpitFilter({ villes: next, projets: nextProjets });
  }

  function onProjetsChange(next: string[]) {
    setProjets(next);
    writeCockpitFilter({ villes, projets: next });
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
          sel.length === 1 ? (projetOptions.find((o) => o.value === sel[0])?.label?.split(" — ")[0] ?? "1 projet") :
          `${sel.length} projets`
        }
      />
      {(villes.length > 0 || projets.length > 0) && (
        <button type="button" onClick={() => { setVilles([]); setProjets([]); writeCockpitFilter({ villes: [], projets: [] }); }} className="cockpitFilterClear">
          <X size={13} /> Effacer
        </button>
      )}
    </div>
  );
}
