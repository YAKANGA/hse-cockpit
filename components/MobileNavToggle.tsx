"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileNavToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-mobile-nav", open ? "open" : "closed");
  }, [open]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1180) {
        setOpen(false);
        document.documentElement.removeAttribute("data-mobile-nav");
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <button
      aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      className="mobileNavToggle"
      onClick={() => setOpen((prev) => !prev)}
      type="button"
    >
      {open ? <X size={22} /> : <Menu size={22} />}
    </button>
  );
}
