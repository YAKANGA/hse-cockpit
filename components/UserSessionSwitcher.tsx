"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { AppSession } from "@/lib/permissions";

type UserSessionSwitcherProps = {
  sessions: AppSession[];
};

export function UserSessionSwitcher({ sessions }: UserSessionSwitcherProps) {
  const [userId, setUserId] = useState("tenant-admin-acme");
  const selectedSession = useMemo(
    () => sessions.find((session) => session.userId === userId) ?? sessions[0],
    [sessions, userId],
  );

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("hse-active-user");
    if (storedUserId && sessions.some((session) => session.userId === storedUserId)) {
      setUserId(storedUserId);
    }
  }, [sessions]);

  function changeSession(nextUserId: string) {
    const nextSession = sessions.find((session) => session.userId === nextUserId);
    if (!nextSession) {
      return;
    }

    setUserId(nextUserId);
    window.localStorage.setItem("hse-active-user", nextUserId);
    window.dispatchEvent(new CustomEvent("hse-active-user-change", { detail: nextUserId }));

    if (nextSession.tenantId) {
      window.localStorage.setItem("hse-active-tenant", nextSession.tenantId);
      window.dispatchEvent(new CustomEvent("hse-active-tenant-change", { detail: nextSession.tenantId }));
    }
  }

  if (!selectedSession) {
    return null;
  }

  return (
    <div className="userSwitcher">
      <div className="tenantSwitcherHeader">
        <ShieldCheck size={16} />
        <span>Profil actif</span>
      </div>
      <div className="userSwitcherCurrent">
        <strong>{selectedSession.name}</strong>
        <small>{selectedSession.role} {selectedSession.tenantName ? `- ${selectedSession.tenantName}` : ""}</small>
      </div>
      <select value={selectedSession.userId} onChange={(event) => changeSession(event.target.value)}>
        {sessions.map((session) => (
          <option value={session.userId} key={session.userId}>
            {session.name} - {session.role}
          </option>
        ))}
      </select>
    </div>
  );
}
