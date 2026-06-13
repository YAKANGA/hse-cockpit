"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Database,
  Download,
  FileDown,
  Loader2,
  UploadCloud,
  Zap,
} from "lucide-react";

type Props = {
  moduleId: string;
  moduleName: string;
  tenantId?: string;
};

const tenantQuery = (tenantId?: string) => (tenantId ? `?tenantId=${tenantId}` : "");

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return { open, setOpen, ref };
}

// ── Actions rapides ──────────────────────────────────────────────────────────

function ActionsRapidesDropdown({ moduleId, tenantId }: { moduleId: string; tenantId?: string }) {
  const { open, setOpen, ref } = useDropdown();
  const tq = tenantQuery(tenantId);

  const actions = [
    { label: "Telecharger le modele .xlsx",    href: `/api/templates/${moduleId}${tq}`,                    icon: Download  },
    { label: "Consulter les donnees dashboard", href: `/api/modules/${moduleId}/dashboard${tq}`,            icon: Database  },
    { label: "Exporter un rapport Word",        href: `/api/reports/modules/${moduleId}/docx${tq}`,         icon: FileDown  },
    { label: "Exporter un rapport PDF",         href: `/api/reports/modules/${moduleId}/pdf${tq}`,          icon: FileDown  },
    { label: "Exporter les donnees Excel",      href: `/api/exports/${moduleId}${tq}`,                      icon: Download  },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="secondaryButton"
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: "6px" }}
        type="button"
      >
        <Zap size={16} />
        Actions rapides
        <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          zIndex: 9999,
          background: "#1a2540",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "10px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          minWidth: "260px",
          overflow: "hidden",
        }}>
          <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Actions rapides
            </span>
          </div>
          {actions.map(({ label, href, icon: Icon }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                fontSize: "13px",
                gap: "10px",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span>{label}</span>
              <Icon size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Import Excel ─────────────────────────────────────────────────────────────

function ImportExcelDropdown({ moduleId, moduleName, tenantId }: Props) {
  const { open, setOpen, ref } = useDropdown();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!file) return;
    setStatus("loading");
    setMessage("Analyse en cours...");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("moduleId", moduleId);
      if (tenantId) form.append("tenantId", tenantId);

      const res = await fetch("/api/imports", { method: "POST", body: form });
      const data = await res.json() as { status?: string; integratedRows?: number; errors?: string[] };

      if (!res.ok || data.status === "rejected") {
        setStatus("error");
        setMessage(data.errors?.[0] ?? "Erreur import");
      } else if (data.status === "needs_correction") {
        setStatus("error");
        setMessage(`${data.errors?.length ?? 0} erreur(s) detectee(s)`);
      } else {
        setStatus("ok");
        setMessage(`${data.integratedRows ?? 0} ligne(s) integree(s)`);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    } catch {
      setStatus("error");
      setMessage("Erreur reseau");
    }
  }

  function handleClose() {
    setOpen(false);
    setStatus("idle");
    setMessage("");
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="secondaryButton"
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: "6px" }}
        type="button"
      >
        <UploadCloud size={16} />
        Import Excel
        <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          zIndex: 9999,
          background: "#1a2540",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "10px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          width: "300px",
          overflow: "hidden",
        }}>
          <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Import — {moduleName}
            </span>
            <button onClick={handleClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: "14px" }}>
            <label style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              padding: "16px",
              border: `2px dashed ${file ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: "8px",
              cursor: "pointer",
              background: file ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)",
              transition: "all 0.2s",
              marginBottom: "10px",
            }}>
              <UploadCloud size={20} style={{ color: file ? "rgba(16,185,129,0.8)" : "rgba(255,255,255,0.35)" }} />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
                {file ? file.name : "Glisser ou cliquer pour selectionner"}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setStatus("idle");
                  setMessage("");
                }}
              />
            </label>

            {message && (
              <p style={{ fontSize: "12px", color: status === "ok" ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)", marginBottom: "8px", textAlign: "center" }}>
                {message}
              </p>
            )}

            <button
              onClick={handleImport}
              disabled={!file || status === "loading"}
              style={{
                width: "100%",
                padding: "9px",
                borderRadius: "7px",
                border: "none",
                background: !file || status === "loading" ? "rgba(255,255,255,0.1)" : "rgba(16,185,129,0.85)",
                color: !file || status === "loading" ? "rgba(255,255,255,0.35)" : "#fff",
                cursor: !file || status === "loading" ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "background 0.2s",
              }}
            >
              {status === "loading"
                ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Analyse...</>
                : <><UploadCloud size={14} /> Importer</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────

export function ModuleHeaderDropdowns({ moduleId, moduleName, tenantId }: Props) {
  return (
    <>
      <ImportExcelDropdown moduleId={moduleId} moduleName={moduleName} tenantId={tenantId} />
      <ActionsRapidesDropdown moduleId={moduleId} tenantId={tenantId} />
    </>
  );
}
