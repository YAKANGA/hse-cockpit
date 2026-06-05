import { LockKeyhole, Server } from "lucide-react";
import "../globals.css";

type Props = {
  searchParams: Promise<{ required?: string; from?: string; path?: string }>;
};

export default async function PortAccessDeniedPage({ searchParams }: Props) {
  const { required = "3001", from = "inconnu", path = "/" } = await searchParams;

  return (
    <main className="portDeniedPage">
      <section className="portDeniedPanel">
        <div className="portDeniedIcon">
          <LockKeyhole size={32} />
        </div>

        <p className="eyebrow" style={{ color: "#f87171" }}>Acces refuse</p>
        <h1>Port non autorise</h1>
        <p>
          La ressource demandee est reservee au port d&apos;administration
          securisee. Vous avez tente d&apos;y acceder depuis le port{" "}
          <strong>{from}</strong>.
        </p>

        <div className="portDeniedInfo">
          <div className="portDeniedRow">
            <Server size={16} />
            <span>Page demandee</span>
            <code>{decodeURIComponent(path)}</code>
          </div>
          <div className="portDeniedRow">
            <LockKeyhole size={16} />
            <span>Port requis</span>
            <code>:{required}</code>
          </div>
          <div className="portDeniedRow">
            <Server size={16} />
            <span>Port utilise</span>
            <code>:{from}</code>
          </div>
        </div>

        <div className="portDeniedActions">
          <a className="primaryButton" href="/">
            Retour application principale
          </a>
          <a
            className="secondaryButton"
            href={`http://localhost:${required}${decodeURIComponent(path)}`}
          >
            Ouvrir sur le port :{required}
          </a>
        </div>

        <p className="portDeniedNote">
          Si vous etes administrateur plateforme, demarrez l&apos;instance
          super-admin avec la commande <code>npm run dev:superadmin</code> puis
          accedez a l&apos;interface sur le port <strong>:{required}</strong>.
        </p>
      </section>
    </main>
  );
}
