"use client";

import { useEffect, useMemo, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { demoSessions, type Permission } from "@/lib/permissions";

type AccessGateProps = {
  anyOf: Permission[];
  children: React.ReactNode;
  label: string;
};

export function AccessGate({ anyOf, children, label }: AccessGateProps) {
  const [userId, setUserId] = useState("tenant-admin-acme");
  const session = useMemo(
    () => demoSessions.find((item) => item.userId === userId) ?? demoSessions[1] ?? demoSessions[0],
    [userId],
  );
  const allowed = anyOf.some((permission) => session.permissions.includes(permission));

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("hse-active-user");
    if (storedUserId && demoSessions.some((item) => item.userId === storedUserId)) {
      setUserId(storedUserId);
    }

    function handleSessionChange(event: Event) {
      const nextUserId = event instanceof CustomEvent
        ? String(event.detail)
        : window.localStorage.getItem("hse-active-user") ?? "";
      if (nextUserId && demoSessions.some((item) => item.userId === nextUserId)) {
        setUserId(nextUserId);
      }
    }

    window.addEventListener("hse-active-user-change", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);

    return () => {
      window.removeEventListener("hse-active-user-change", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, []);

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <section className="workspace">
      <article className="accessDeniedPanel">
        <LockKeyhole size={34} />
        <p className="eyebrow">Acces refuse</p>
        <h1>{label}</h1>
        <p>
          Le profil actif {session.role} ne dispose pas des droits requis pour consulter cet ecran.
          Selectionner un profil autorise dans la barre laterale.
        </p>
      </article>
    </section>
  );
}
