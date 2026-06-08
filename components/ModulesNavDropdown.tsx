"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { usePathname } from "next/navigation";
import { modules } from "@/lib/hse-data";

export function ModulesNavDropdown() {
  const pathname = usePathname();
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos]         = useState<{ top: number; left: number } | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left });
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

  const activeModule = modules.find((m) => pathname === `/modules/${m.id}`);

  const dropdown = (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        zIndex: 99999,
        background: "var(--panel, #fff)",
        border: "1px solid var(--line, #e2e8f0)",
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        padding: 8,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 4,
        minWidth: 340,
      }}
    >
      {modules.map((m) => {
        const Icon = m.icon;
        const isActive = pathname === `/modules/${m.id}`;
        return (
          <a
            key={m.id}
            href={`/modules/${m.id}`}
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 9,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? m.color : "var(--ink, #1e293b)",
              background: isActive ? m.accent : "transparent",
              transition: "background 120ms",
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--surface, #f8fafc)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 7,
                background: m.accent,
                color: m.color,
                flexShrink: 0,
              }}
            >
              <Icon size={14} />
            </span>
            <span style={{ lineHeight: 1.2 }}>{m.shortName}</span>
          </a>
        );
      })}
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`cockpitMultiSelectBtn${activeModule ? " hasSelection" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <LayoutGrid size={13} className="cockpitFilterIcon" />
        <span>{activeModule ? activeModule.shortName : "Modules"}</span>
        <ChevronDown size={12} className={`cockpitFilterChevron${open ? " rotated" : ""}`} />
      </button>

      {mounted && open && pos && createPortal(dropdown, document.body)}
    </>
  );
}
