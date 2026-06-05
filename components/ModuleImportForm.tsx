"use client";

import { useEffect, useMemo, useState } from "react";
import { FileDown, LockKeyhole, UploadCloud } from "lucide-react";
import { demoSessions } from "@/lib/permissions";

type ImportResult = {
  status: "validated" | "needs_correction" | "rejected";
  moduleId?: string;
  filename?: string;
  rows?: number;
  integratedRows?: number;
  errors: string[];
  nextStep?: string;
};

type ModuleImportFormProps = {
  moduleId: string;
  moduleName: string;
  tenantId?: string;
};

export function ModuleImportForm({ moduleId, moduleName, tenantId }: ModuleImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [activeUserId, setActiveUserId] = useState("tenant-admin-acme");
  const activeSession = useMemo(
    () => demoSessions.find((session) => session.userId === activeUserId) ?? demoSessions[1] ?? demoSessions[0],
    [activeUserId],
  );
  const canImport = activeSession.permissions.includes("module:import");

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("hse-active-user");
    if (storedUserId && demoSessions.some((session) => session.userId === storedUserId)) {
      setActiveUserId(storedUserId);
    }

    function handleSessionChange(event: Event) {
      const nextUserId = event instanceof CustomEvent
        ? String(event.detail)
        : window.localStorage.getItem("hse-active-user") ?? "";
      if (nextUserId && demoSessions.some((session) => session.userId === nextUserId)) {
        setActiveUserId(nextUserId);
      }
    }

    window.addEventListener("hse-active-user-change", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);

    return () => {
      window.removeEventListener("hse-active-user-change", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, []);

  async function submitImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canImport) {
      setResult({
        status: "rejected",
        errors: ["Le profil actif ne dispose pas du droit d'import."],
      });
      return;
    }

    if (!file) {
      setResult({
        status: "rejected",
        errors: ["Veuillez selectionner un fichier Excel .xlsx."],
      });
      return;
    }

    const formData = new FormData();
    formData.append("moduleId", moduleId);
    if (tenantId) {
      formData.append("tenantId", tenantId);
    }
    formData.append("file", file);
    const searchParams = new URLSearchParams({ userId: activeUserId });
    if (tenantId) {
      searchParams.set("tenantId", tenantId);
    }

    setIsImporting(true);
    setResult(null);
    setProgress(0);

    const steps: [number, string][] = [
      [15, "Lecture du fichier Excel..."],
      [40, "Verification de la structure..."],
      [65, "Controle metier des donnees..."],
      [85, "Integration en cours..."],
    ];

    let stepIdx = 0;
    const ticker = setInterval(() => {
      if (stepIdx < steps.length) {
        const [pct, label] = steps[stepIdx++];
        setProgress(pct);
        setProgressLabel(label);
      }
    }, 600);

    try {
      const response = await fetch(`/api/imports?${searchParams.toString()}`, {
        method: "POST",
        body: formData,
      });
      clearInterval(ticker);
      setProgress(100);
      setProgressLabel("Traitement termine.");
      setTimeout(() => { setProgress(0); setProgressLabel(""); }, 1200);
      setResult((await response.json()) as ImportResult);
    } catch {
      clearInterval(ticker);
      setProgress(0);
      setProgressLabel("");
      setResult({
        status: "rejected",
        errors: ["Impossible de traiter le fichier pour le moment."],
      });
    } finally {
      setIsImporting(false);
    }
  }

  async function downloadErrorReport() {
    if (!result?.errors.length) {
      return;
    }

    const searchParams = new URLSearchParams({ userId: activeUserId });
    if (tenantId) {
      searchParams.set("tenantId", tenantId);
    }

    setIsDownloadingReport(true);

    try {
      const response = await fetch(`/api/imports/error-report?${searchParams.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          filename: result.filename ?? file?.name,
          errors: result.errors,
        }),
      });

      if (!response.ok) {
        throw new Error("Rapport indisponible");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rapport_erreurs_${moduleId}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setResult({
        status: "rejected",
        errors: ["Impossible de generer le rapport d'erreurs pour le moment."],
      });
    } finally {
      setIsDownloadingReport(false);
    }
  }

  return (
    <article className="panel moduleImportPanel">
      <div className="panelHeader">
        <div>
          <h2>Import Excel du module</h2>
          <p>{moduleName}</p>
        </div>
        {canImport ? <UploadCloud size={22} /> : <LockKeyhole size={22} />}
      </div>

      {!canImport ? (
        <div className="importResult warn">
          <strong>Import non autorise</strong>
          <span>Le profil actif {activeSession.role} ne peut pas importer de fichier Excel.</span>
        </div>
      ) : null}

      <form className="moduleImportForm" onSubmit={submitImport}>
        <label>
          Fichier Excel .xlsx
          <input
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <button className="primaryButton" disabled={isImporting || !canImport} type="submit">
          <UploadCloud size={18} />
          {isImporting ? "Traitement..." : "Valider le fichier"}
        </button>
      </form>

      {isImporting && progress > 0 && (
        <div className="importProgress">
          <div className="importProgressBar">
            <div className="importProgressFill" style={{ width: `${progress}%` }} />
          </div>
          <span className="importProgressLabel">{progressLabel} ({progress}%)</span>
        </div>
      )}

      {result ? (
        <div className={result.status === "validated" ? "importResult ok" : "importResult warn"}>
          <strong>
            {result.status === "validated"
              ? `Import integre: ${result.integratedRows ?? result.rows ?? 0} ligne(s)`
              : "Import a corriger"}
          </strong>
          <span>{result.nextStep ?? result.errors[0]}</span>
          {result.errors.length ? (
            <>
              <ul>
                {result.errors.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
              <button className="secondaryButton importErrorReportButton" disabled={isDownloadingReport} onClick={downloadErrorReport} type="button">
                <FileDown size={16} />
                {isDownloadingReport ? "Generation..." : "Rapport erreurs .xlsx"}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
