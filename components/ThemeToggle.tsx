"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("hse-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    if (isDark) {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("hse-theme", next ? "dark" : "light");
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  return (
    <button
      className="themeToggleBtn"
      onClick={toggle}
      title={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      type="button"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
