"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Camera, ChevronDown, KeyRound, LogIn, LogOut } from "lucide-react";
import { hseAlerts } from "@/lib/alerts-data";
import { demoSessions } from "@/lib/permissions";

export function TopBarUser() {
  const [userId, setUserId] = useState("tenant-admin-acme");

  useEffect(() => {
    const stored = localStorage.getItem("hse-active-user");
    if (stored && demoSessions.some((s) => s.userId === stored)) setUserId(stored);

    function onSessionChange(e: Event) {
      const next = e instanceof CustomEvent ? String(e.detail) : localStorage.getItem("hse-active-user") ?? "";
      if (next && demoSessions.some((s) => s.userId === next)) setUserId(next);
    }
    window.addEventListener("hse-active-user-change", onSessionChange);
    window.addEventListener("storage", onSessionChange);
    return () => {
      window.removeEventListener("hse-active-user-change", onSessionChange);
      window.removeEventListener("storage", onSessionChange);
    };
  }, []);

  const session = useMemo(
    () => demoSessions.find((s) => s.userId === userId) ?? demoSessions[0],
    [userId],
  );

  const criticalAlerts = hseAlerts.filter(
    (a) => a.severity === "Critique" && a.status === "Ouvert",
  ).length;

  const initials = session.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="topBarUser">
      <a className="topBarBellBtn" href="/alerts" title="Alertes HSE">
        <Bell size={18} />
        {criticalAlerts > 0 && (
          <span className="topBarBadge">{criticalAlerts}</span>
        )}
      </a>

      <details className="topBarUserDropdown">
        <summary className="topBarUserInfo">
          <div className="topBarAvatar">{initials}</div>
          <div className="topBarUserText">
            <strong>{session.name}</strong>
            <small>{session.role.replace(/_/g, " ")}</small>
          </div>
          <ChevronDown size={14} className="topBarUserChevron" />
        </summary>

        <div className="topBarUserPanel">
          {/* En-tête profil */}
          <div className="topBarUserPanelHeader">
            <div className="topBarAvatarLg">{initials}</div>
            <div className="topBarUserPanelInfo">
              <strong>{session.name}</strong>
              <span>{session.email}</span>
              <span className="topBarUserPanelRole">{session.role.replace(/_/g, " ")}</span>
            </div>
          </div>

          <hr className="topBarUserPanelSep" />

          <button className="topBarProfileItem" type="button">
            <Camera size={15} />
            Ajouter une photo
          </button>
          <button className="topBarProfileItem" type="button">
            <KeyRound size={15} />
            Changer mot de passe
          </button>

          <hr className="topBarUserPanelSep" />

          <a className="topBarProfileItem" href="/login">
            <LogIn size={15} />
            Connexion
          </a>
          <button
            className="topBarProfileItem danger"
            type="button"
            onClick={() => {
              localStorage.removeItem("hse-active-user");
              window.location.href = "/login";
            }}
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </details>
    </div>
  );
}
