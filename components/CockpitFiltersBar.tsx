"use client";

import { useEffect, useState } from "react";
import { MapPin, FolderOpen, X } from "lucide-react";
import {
  ALL_CITIES,
  ALL_PROJECTS_LABEL,
  getProjectsForCity,
  readCockpitFilter,
  writeCockpitFilter,
} from "@/lib/use-cockpit-filter";

export function CockpitFiltersBar() {
  const [ville, setVille] = useState("");
  const [projet, setProjet] = useState("");

  useEffect(() => {
    const f = readCockpitFilter();
    setVille(f.ville);
    setProjet(f.projet);
  }, []);

  function onVilleChange(v: string) {
    const nextVille = v === "Toutes les villes" ? "" : v;
    setVille(nextVille);
    setProjet("");
    writeCockpitFilter({ ville: nextVille, projet: "" });
  }

  function onProjetChange(p: string) {
    const nextProjet = p === ALL_PROJECTS_LABEL ? "" : p;
    setProjet(nextProjet);
    writeCockpitFilter({ ville, projet: nextProjet });
  }

  function clearAll() {
    setVille("");
    setProjet("");
    writeCockpitFilter({ ville: "", projet: "" });
  }

  const projectOptions = getProjectsForCity(ville || "Toutes les villes");
  const hasFilter = !!ville || !!projet;

  return (
    <div className="cockpitFiltersBar">
      {/* Filtre Villes */}
      <div className="cockpitFilterSelect">
        <MapPin size={13} className="cockpitFilterIcon" />
        <select
          value={ville || "Toutes les villes"}
          onChange={(e) => onVilleChange(e.target.value)}
          aria-label="Filtrer par ville"
        >
          {ALL_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Filtre Projets */}
      <div className="cockpitFilterSelect">
        <FolderOpen size={13} className="cockpitFilterIcon" />
        <select
          value={projet || ALL_PROJECTS_LABEL}
          onChange={(e) => onProjetChange(e.target.value)}
          aria-label="Filtrer par projet"
        >
          <option value={ALL_PROJECTS_LABEL}>{ALL_PROJECTS_LABEL}</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.shortName}>{p.shortName}</option>
          ))}
        </select>
      </div>

      {/* Réinitialiser */}
      {hasFilter && (
        <button
          type="button"
          onClick={clearAll}
          className="cockpitFilterClear"
          title="Réinitialiser les filtres"
        >
          <X size={13} /> Effacer
        </button>
      )}
    </div>
  );
}
