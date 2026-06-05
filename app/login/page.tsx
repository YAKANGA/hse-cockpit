import { Suspense } from "react";
import { LoginProfileLinks } from "@/components/LoginProfileLinks";
import { LoginForm } from "@/components/LoginForm";
import { demoSessions } from "@/lib/permissions";
import "../globals.css";

export default function LoginPage() {
  return (
    <main className="loginPage">
      <section className="loginPanel">
        <div className="brand">
          <div className="brandMark">HSE</div>
          <div>
            <strong>Cockpit HSE</strong>
            <span>Plateforme de gestion HSE</span>
          </div>
        </div>

        <h1>Connexion</h1>

        <Suspense fallback={<div style={{ height: 200 }} />}>
          <LoginForm />
        </Suspense>

        <div className="loginDivider">
          <span>ou acces demonstration</span>
        </div>

        <p className="loginDemoNote">
          Profils demonstration — aucune persistance entre sessions.
        </p>
        <LoginProfileLinks sessions={demoSessions} />
      </section>
    </main>
  );
}
