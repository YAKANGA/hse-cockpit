"use client";

import { useEffect, useState } from "react";
import { AlignJustify } from "lucide-react";

type Density = "Normal" | "Compact" | "Detaille";

const OPTIONS: Density[] = ["Compact", "Normal", "Detaille"];

export function DashboardDensityToggle() {
  const [density, setDensity] = useState<Density>("Normal");

  useEffect(() => {
    const stored = localStorage.getItem("hse-density") as Density | null;
    if (stored && OPTIONS.includes(stored)) {
      setDensity(stored);
      document.documentElement.setAttribute("data-dashboard-density", stored);
    }
  }, []);

  function handleChange(next: Density) {
    setDensity(next);
    localStorage.setItem("hse-density", next);
    if (next === "Normal") {
      document.documentElement.removeAttribute("data-dashboard-density");
    } else {
      document.documentElement.setAttribute("data-dashboard-density", next);
    }
  }

  return (
    <div className="densityToggle" title="Densite d'affichage">
      <AlignJustify size={16} />
      {OPTIONS.map((option) => (
        <button
          key={option}
          className={option === density ? "densityOption active" : "densityOption"}
          onClick={() => handleChange(option)}
          type="button"
        >
          {option === "Compact" ? "C" : option === "Normal" ? "N" : "D"}
        </button>
      ))}
    </div>
  );
}
