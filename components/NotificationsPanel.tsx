"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Clock, FileWarning, X } from "lucide-react";
import { hseAlerts } from "@/lib/alerts-data";
import { getImportHistory } from "@/lib/import-store";
import { ppeRecords } from "@/lib/ppe-data";

type Notif = {
  id: string;
  type: "critique" | "retard" | "expiration" | "import";
  title: string;
  detail: string;
  href: string;
};

const TODAY = new Date("2026-06-05");

function buildNotifications(): Notif[] {
  const notifs: Notif[] = [];

  // Alertes critiques ouvertes
  hseAlerts
    .filter((a) => a.severity === "Critique" && a.status === "Ouvert")
    .slice(0, 5)
    .forEach((a) => {
      notifs.push({
        id: `alert-${a.id}`,
        type: "critique",
        title: a.title,
        detail: `${a.moduleName} · ${a.site}`,
        href: "/alerts",
      });
    });

  // EPI expirants sous 30 jours
  ppeRecords
    .filter((r) => {
      const [d, m, y] = r.dateExpiration.split("/").map(Number);
      const exp = new Date(y, m - 1, d);
      const days = Math.floor((exp.getTime() - TODAY.getTime()) / 86_400_000);
      return days >= 0 && days <= 30;
    })
    .slice(0, 3)
    .forEach((r) => {
      notifs.push({
        id: `epi-${r.reference}`,
        type: "expiration",
        title: `EPI expirant bientot`,
        detail: `${r.designation} — expire le ${r.dateExpiration}`,
        href: "/modules/ppe",
      });
    });

  // Imports à corriger
  getImportHistory()
    .filter((i) => i.status === "A corriger")
    .slice(0, 3)
    .forEach((i) => {
      notifs.push({
        id: `import-${i.id}`,
        type: "import",
        title: `Import a corriger`,
        detail: `${i.module} · ${i.filename} · ${i.rejectedRows} ligne(s) rejetee(s)`,
        href: "/admin/imports",
      });
    });

  return notifs;
}

const ICONS = {
  critique: <AlertTriangle size={14} style={{ color: "#dc2626" }} />,
  retard: <Clock size={14} style={{ color: "#d97706" }} />,
  expiration: <Clock size={14} style={{ color: "#d97706" }} />,
  import: <FileWarning size={14} style={{ color: "#7c3aed" }} />,
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const allNotifs = buildNotifications();
  const notifs = allNotifs.filter((n) => !dismissed.has(n.id));

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <div className="notifPanel" ref={ref}>
      <button
        className="notifTrigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications (${notifs.length})`}
        type="button"
      >
        <Bell size={18} />
        {notifs.length > 0 && (
          <span className="notifBadge">{notifs.length > 9 ? "9+" : notifs.length}</span>
        )}
      </button>

      {open && (
        <div className="notifDropdown" role="dialog" aria-label="Notifications HSE">
          <div className="notifHeader">
            <strong>Notifications</strong>
            {notifs.length > 0 && (
              <button
                className="notifDismissAll"
                onClick={() => setDismissed(new Set(allNotifs.map((n) => n.id)))}
                type="button"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="notifEmpty">
              <CheckCircle2 size={20} style={{ color: "#0f766e" }} />
              <p>Aucune notification active</p>
            </div>
          ) : (
            <ul className="notifList">
              {notifs.map((n) => (
                <li key={n.id} className={`notifItem notifItem--${n.type}`}>
                  <a href={n.href} className="notifItemLink" onClick={() => setOpen(false)}>
                    <span className="notifItemIcon">{ICONS[n.type]}</span>
                    <span className="notifItemText">
                      <span className="notifItemTitle">{n.title}</span>
                      <span className="notifItemDetail">{n.detail}</span>
                    </span>
                  </a>
                  <button
                    className="notifDismiss"
                    onClick={() => dismiss(n.id)}
                    aria-label="Ignorer"
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
