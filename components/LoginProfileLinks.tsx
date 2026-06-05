"use client";

import { ShieldCheck } from "lucide-react";
import type { AppSession } from "@/lib/permissions";

type LoginProfileLinksProps = {
  sessions: AppSession[];
};

export function LoginProfileLinks({ sessions }: LoginProfileLinksProps) {
  function activateSession(session: AppSession) {
    window.localStorage.setItem("hse-active-user", session.userId);
    if (session.tenantId) {
      window.localStorage.setItem("hse-active-tenant", session.tenantId);
    }
  }

  return (
    <div className="loginProfiles">
      {sessions.map((session) => (
        <a
          href={session.role === "SUPER_ADMIN" ? "/super-admin/tenants" : `/enterprise/${session.tenantId}`}
          key={session.userId}
          onClick={() => activateSession(session)}
        >
          <ShieldCheck size={20} />
          <div>
            <strong>{session.name}</strong>
            <span>{session.role} {session.tenantName ? `- ${session.tenantName}` : ""}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
