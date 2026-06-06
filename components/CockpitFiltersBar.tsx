"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, FolderOpen, MapPin, X } from "lucide-react";
import {
  ALL_CITIES,
  getProjectsForCities,
  readCockpitFilter,
  writeCockpitFilter,
} from "@/lib/use-cockpit-filter";

type DropdownPos = { top: number; left: number; minWidth: number };

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
  renderLabel?: (selected: string[]) => string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Recalculate position whenever dropdown opens
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: rect.left,
      minWidth: Math.max(rect.width, 200),
    });
  }, [open]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        dropRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    function onScroll() { setOpen(false); }
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  function toggle(value: string) {
    onChange(selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]);
  }

  const displayLabel = renderLabel
    ? renderLabel(selected)
    : selected.length === 0 ? label
    : selected.length === 1 ? selected[0]
    : `${selected.length} sélectionnés`;

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
        <span>{displayLabel}</span>
        {selected.length > 0 && (
          <span className="cockpitFilterBadge">{selected.length}</span>
        )}
        <ChevronDown size={12} className={`cockpitFilterChevron${open ? " rotated" : ""}`} />
      </button>

      {open && pos && (
        <div
          ref={dropRef}
          className="cockpitMultiDropdown"
          style={{ position: "fixed", top: pos.top, left: pos.left, minWidth: pos.minWidth }}
        >
          {options.length === 0 && (
            <p style={{ padding: "8px 12px", fontSize: 13, color: "var(--muted)", margin: 0 }}>
              Aucun élément disponible
            </p>
          )}
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label key={opt.value} className={`cockpitMultiOption${checked ? " checked" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  className="cockpitMultiCheckbox"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
          {selected.length > 0 && (
            <button type="button" className="cockpitMultiClearAll" onClick={() => onChange([])}>
              <X size={11} /> Tout désélectionner
            </button>
          )}
        </div>
      )}
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

  function clearAll() {
    setVilles([]);
    setProjets([]);
    writeCockpitFilter({ villes: [], projets: [] });
  }

  const villeOptions = ALL_CITIES.map((c) => ({ value: c, label: c }));
  const projetOptions = getProjectsForCities(villes).map((p) => ({
    value: p.id,
    label: `${p.shortName} (${p.city})`,
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
          sel.length === 0 || sel.length === ALL_CITIES.length ? "Toutes les villes" :
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
          sel.length === 0 ? "Tous les projets" :
          sel.length === 1 ? (projetOptions.find((o) => o.value === sel[0])?.label?.split(" (")[0] ?? "1 projet") :
          `${sel.length} projets`
        }
      />

      {(villes.length > 0 || projets.length > 0) && (
        <button type="button" onClick={clearAll} className="cockpitFilterClear">
          <X size={13} /> Effacer
        </button>
      )}
    </div>
  );
}
