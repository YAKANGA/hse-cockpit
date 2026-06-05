import { AppSidebar } from "@/components/AppSidebar";
import { BookOpen, Download, FileSpreadsheet, LogIn, Shield, Upload, Users } from "lucide-react";
import "../globals.css";

export default function AidePage() {
  return (
    <main className="appShell">
      <AppSidebar />
      <section className="workspace">
        <section className="adminHeader">
          <p className="eyebrow">Documentation</p>
          <h1>Guide d&apos;utilisation — HSE Cockpit</h1>
          <p>Tout ce que vous devez savoir pour utiliser la plateforme HSE au quotidien.</p>
        </section>

        <div className="aideGrid">

          <article className="panel aideCard">
            <div className="aideCardHeader">
              <LogIn size={22} className="aideIcon" />
              <h2>Connexion &amp; Profils</h2>
            </div>
            <ol className="aideSteps">
              <li>Accédez à <strong>/login</strong> et saisissez votre email et mot de passe.</li>
              <li>Votre rôle détermine vos accès : <em>VIEWER</em> (lecture), <em>IMPORT_USER</em> (import + lecture), <em>HSE_SITE</em> (import + validation), <em>HSE_GROUP</em> (validation + export), <em>TENANT_ADMIN</em> (administration), <em>SUPER_ADMIN</em> (plateforme).</li>
              <li>En cas d&apos;oubli de mot de passe, contactez votre administrateur HSE.</li>
            </ol>
          </article>

          <article className="panel aideCard">
            <div className="aideCardHeader">
              <Download size={22} className="aideIcon" />
              <h2>Télécharger un modèle Excel</h2>
            </div>
            <ol className="aideSteps">
              <li>Dans le menu <strong>Modules</strong>, choisissez le module souhaité (Événements, Inspections, Permis, etc.).</li>
              <li>Cliquez sur <strong>Télécharger le modèle Excel</strong> — un fichier .xlsx standardisé se télécharge.</li>
              <li>Ouvrez le fichier dans Excel et renseignez les données dans la feuille <strong>Saisie</strong>.</li>
              <li>Respectez les formats indiqués : dates en JJ/MM/AAAA, listes déroulantes, champs obligatoires en rouge.</li>
            </ol>
          </article>

          <article className="panel aideCard">
            <div className="aideCardHeader">
              <Upload size={22} className="aideIcon" />
              <h2>Importer un fichier Excel</h2>
            </div>
            <ol className="aideSteps">
              <li>Dans la page du module, cliquez sur <strong>Importer un fichier</strong>.</li>
              <li>Sélectionnez votre fichier .xlsx renseigné.</li>
              <li>Le système vérifie automatiquement la structure, les formats, les doublons et la cohérence métier.</li>
              <li>Si des erreurs sont détectées, elles sont affichées ligne par ligne — corrigez le fichier et relancez.</li>
              <li>Si tout est valide, les données sont intégrées et le tableau de bord se met à jour immédiatement.</li>
            </ol>
          </article>

          <article className="panel aideCard">
            <div className="aideCardHeader">
              <FileSpreadsheet size={22} className="aideIcon" />
              <h2>Exporter les données</h2>
            </div>
            <ol className="aideSteps">
              <li>Depuis n&apos;importe quel module ou la page Rapports, cliquez sur <strong>Exporter Excel</strong> ou <strong>Exporter CSV</strong>.</li>
              <li>Les exports respectent vos filtres actifs (période, site, statut…).</li>
              <li>Pour générer un rapport PDF ou Word complet, rendez-vous dans <strong>Rapports → Centre rapports</strong>.</li>
              <li>Choisissez la période (mensuel / trimestriel / annuel) et le périmètre (module, site, global).</li>
            </ol>
          </article>

          <article className="panel aideCard">
            <div className="aideCardHeader">
              <Shield size={22} className="aideIcon" />
              <h2>Alertes &amp; Seuils</h2>
            </div>
            <ol className="aideSteps">
              <li>Les alertes sont générées automatiquement quand un indicateur dépasse un seuil configuré.</li>
              <li>Consultez le <strong>Centre d&apos;alertes</strong> via le menu Alertes pour voir toutes les alertes actives.</li>
              <li>Votre administrateur peut ajuster les seuils dans <strong>Alertes → Seuils d&apos;alerte</strong>.</li>
              <li>Les alertes critiques sont visibles en haut du Cockpit général.</li>
            </ol>
          </article>

          <article className="panel aideCard">
            <div className="aideCardHeader">
              <Users size={22} className="aideIcon" />
              <h2>Administration</h2>
            </div>
            <ol className="aideSteps">
              <li><strong>Gérer les utilisateurs :</strong> Admin → Utilisateurs → Inviter un utilisateur. Un email temporaire et un mot de passe provisoire sont assignés.</li>
              <li><strong>Activer/désactiver des modules :</strong> Admin → Référentiels → Modules actifs.</li>
              <li><strong>Règles de validation :</strong> Admin → Règles de validation — définissez les contrôles métier par module.</li>
              <li><strong>Journal d&apos;audit :</strong> Admin → Journal d&apos;audit — toutes les actions critiques sont tracées avec utilisateur et horodatage.</li>
            </ol>
          </article>

          <article className="panel aideCard" style={{ gridColumn: "1 / -1" }}>
            <div className="aideCardHeader">
              <BookOpen size={22} className="aideIcon" />
              <h2>Règles de saisie par module</h2>
            </div>
            <div className="aideModulesGrid">
              {[
                { name: "Événements", rules: "Date, site et description sont obligatoires. La gravité doit être renseignée (Mineur/Modéré/Grave/Critique)." },
                { name: "Inspections", rules: "Thème, date et site sont obligatoires. Si conformité = Non conforme, l'écart doit être renseigné." },
                { name: "Permis", rules: "Type de permis, zone, dates debut/fin et validation HSE sont obligatoires. Un permis Actif sans validation HSE est bloqué." },
                { name: "Actions", rules: "Action, statut et responsable sont obligatoires si statut = En cours. L'échéance est obligatoire pour toute action non clôturée." },
                { name: "Indicateurs", rules: "Mois, heures travaillées sont obligatoires. Les accidents, jours perdus, causeries et formations permettent le calcul TF/TG." },
                { name: "EPI", rules: "Désignation, catégorie, quantités stock/attribuée/disponible sont obligatoires. Stock - Attribuée doit égaler Disponible." },
                { name: "Environnement", rules: "Impact, milieu affecté, intensité/portée/durée (1-3) sont obligatoires. Score = I×P×D : ≥18 Critique, ≥12 Élevé." },
              ].map((mod) => (
                <div key={mod.name} className="aideModuleRule">
                  <strong>{mod.name}</strong>
                  <p>{mod.rules}</p>
                </div>
              ))}
            </div>
          </article>

        </div>
      </section>
    </main>
  );
}
