"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FolderOpen, MapPin, X } from "lucide-react";
import {
  ALL_CITIES,
  getProjectsForCities,
  readCockpitFilter,
  writeCockpitFilter,
} from "@/lib/use-cockpit-filter";

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  }

  const displayLabel = renderLabel
    ? renderLabel(selected)
    : selected.length === 0
      ? label
      : selected.length === 1
        ? selected[0]
        : `${selected.length} sélectionnés`;

  return (
    <div className="cockpitMultiSelect" ref={ref}>
      <button
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

      {open && (
        <div className="cockpitMultiDropdown">
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
            <button
              type="button"
              className="cockpitMultiClearAll"
              onClick={() => onChange([])}
            >
              <X size={11} /> Tout désélectionner
            </button>
          )}
        </div>
      )}
    </div>
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
    setVilles(next);
    // Reset projets that belong to deselected cities
    const availableProjects = getProjectsForCities(next).map((p) => p.id);
    const nextProjets = projets.filter((id) => availableProjects.includes(id));
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

  const hasFilter = villes.length > 0 || projets.length > 0;

  return (
    <div className="cockpitFiltersBar">
      <MultiSelectDropdown
        label="Toutes les villes"
        icon={MapPin}
        options={villeOptions}
        selected={villes}
        onChange={onVillesChange}
        renderLabel={(sel) =>
          sel.length === 0 ? "Toutes les villes" :
          sel.length === ALL_CITIES.length ? "Toutes les villes" :
          sel.length === 1 ? sel[0] :
          `${sel.length} villes`
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
          sel.length === 1 ? projetOptions.find((o) => o.value === sel[0])?.label?.split(" (")[0] ?? "1 projet" :
          `${sel.length} projets`
        }
      />

      {hasFilter && (
        <button type="button" onClick={clearAll} className="cockpitFilterClear" title="Réinitialiser tous les filtres">
          <X size={13} /> Effacer
        </button>
      )}
    </div>
  );
}
