# Guide de déploiement — HSE Cockpit sur Vercel

## Prérequis
- Compte Vercel (Pro recommandé pour la production)
- Compte GitHub avec le dépôt connecté
- Base de données PostgreSQL (Neon ou Supabase — gratuit)

---

## 1. Base de données PostgreSQL (Neon — recommandé)

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un projet → copier l'URL de connexion :
   ```
   postgresql://user:password@host.neon.tech/hse_db?sslmode=require
   ```
3. Le schéma sera créé automatiquement au premier démarrage

---

## 2. Déploiement Vercel

### Via l'interface Vercel

1. Aller sur [vercel.com](https://vercel.com) → **Add New Project**
2. Importer le dépôt GitHub
3. Framework : **Next.js** (détecté automatiquement)
4. Configurer les variables d'environnement (voir section 3)
5. Cliquer sur **Deploy**

### Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 3. Variables d'environnement Vercel

Configurer dans **Settings → Environment Variables** :

| Variable | Valeur | Requis |
|---|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` | ✅ |
| `NEXTAUTH_URL` | `https://votre-app.vercel.app` | ✅ |
| `DATABASE_URL` | URL PostgreSQL Neon/Supabase | ✅ |
| `SMTP_HOST` | ex: `smtp.gmail.com` | ⚠️ (email) |
| `SMTP_PORT` | `587` | ⚠️ (email) |
| `SMTP_USER` | votre email SMTP | ⚠️ (email) |
| `SMTP_PASS` | mot de passe SMTP | ⚠️ (email) |
| `SMTP_FROM` | `"HSE Cockpit" <noreply@acme.ci>` | ⚠️ (email) |
| `NOTIFICATION_EMAIL` | email direction pour alertes | ⚠️ (email) |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob | ⚠️ (stockage) |

### Générer AUTH_SECRET

```bash
# Linux/Mac/WSL
openssl rand -base64 32

# Node.js (Windows)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 4. Configuration GitHub Actions (CI/CD)

Ajouter ces secrets dans **GitHub → Settings → Secrets** :

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Token Vercel (Profile → Settings → Tokens) |
| `VERCEL_ORG_ID` | ID organisation Vercel (`.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | ID projet Vercel (`.vercel/project.json`) |

Le pipeline CI se déclenche automatiquement à chaque push sur `main`.

---

## 5. Premier démarrage

Au premier démarrage, la base PostgreSQL est initialisée automatiquement avec :
- Le schéma complet (users, import_history, audit_logs)
- 5 comptes de démonstration

### Comptes initiaux

| Email | Mot de passe | Rôle |
|---|---|---|
| `superadmin@platform.local` | `Admin@2026` | Super Admin |
| `a.kouadio@acme.local` | `Acme@2026` | Admin ACME BTP |
| `s.traore@acme.local` | `Hse@2026` | HSE Groupe |
| `n.kone@medlog.local` | `Viewer@2026` | Lecteur |
| `m.diallo@acme.local` | `Import@2026` | Import |

**⚠️ Changer tous les mots de passe dès le premier accès en production.**

---

## 6. Vérification post-déploiement

```bash
# Health check
curl https://votre-app.vercel.app/health

# Test auth
curl -X POST https://votre-app.vercel.app/api/auth/callback/credentials \
  -d '{"email":"a.kouadio@acme.local","password":"Acme@2026"}'

# Test import history
curl https://votre-app.vercel.app/api/imports/history \
  -H "x-user-id: tenant-admin-acme"
```

---

## 7. Mise à l'échelle

### Plan Vercel recommandé

| Usage | Plan |
|---|---|
| < 100 utilisateurs | Hobby (gratuit) |
| 100–1000 utilisateurs | Pro ($20/mois) |
| > 1000 ou SLA requis | Enterprise |

### Optimisations production

1. **Redis (Upstash)** — ajouter `@upstash/redis` + `@upstash/ratelimit` pour le rate limiting multi-instances
2. **Vercel Blob** — activer pour stocker les fichiers Excel importés
3. **Vercel Analytics** — activer dans le dashboard pour le monitoring
4. **Neon autoscaling** — activer pour les pics de charge

---

## 8. Sauvegarde

### PostgreSQL (Neon)
- Neon effectue des backups automatiques (7 jours sur Free, 30 jours sur Pro)
- Export manuel : `pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql`

### SQLite (développement local)
- Copier `data/hse.db` régulièrement

---

## Support

- Issues : GitHub Issues du dépôt
- Email : [boxcenter.info@gmail.com](mailto:boxcenter.info@gmail.com)
