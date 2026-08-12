# ⚙️ Configuration - Supabase & Render

Guide complet pour configurer les services externes.

---

## 🗄️ Supabase Setup

Supabase fournit PostgreSQL + Auth + Storage gratuitement.

### 1. Créer un compte

1. Aller à [supabase.com](https://supabase.com)
2. Sign up avec email ou GitHub
3. Créer nouvelle organisation

### 2. Créer un projet

1. **New Project**
2. Remplir:

| Champ | Valeur |
|-------|--------|
| Project Name | `fvs-cartes` |
| Database Password | (générer un strong, noter quelque part!) |
| Region | `eu-west-1` (ou votre région) |
| Plan | `Free` |

3. **Create new project** → Attendre ~2min

### 3. Récupérer les credentials

Dans Supabase Dashboard:

1. **Settings** → **API**
2. Copier:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY`

3. **Settings** → **Database**
   - Note le `connection string` → `DATABASE_URL`
   - Format: `postgresql://postgres:password@...`

### 4. Remplir `.env` Backend

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:YourPassword@db.supabase.co:5432/postgres
```

### 5. Setup Tables

**Option A: Via script**
```bash
npm run setup-db
# Crée toutes les tables automatiquement
```

**Option B: Via SQL Editor**

1. Supabase Dashboard → **SQL Editor**
2. Coller le contenu de `backend/src/utils/setupDatabase.js`
3. Exécuter

### 6. Supabase Storage (optionnel, pour photos)

1. Supabase Dashboard → **Storage**
2. **New bucket** → `photos`
   - RLS Policy: Private
3. **New bucket** → `signatures`
4. **New bucket** → `brouillons`

```javascript
// Code pour utiliser storage
import { supabase } from './config/database.js';

// Upload photo
const { data, error } = await supabase.storage
  .from('photos')
  .upload(`${collegeId}/${studentId}.jpg`, file);
```

---

## 🚀 Render Setup

Render héberge votre API Node.js gratuitement.

### 1. Créer un compte

1. [render.com](https://render.com)
2. Sign up avec GitHub (recommandé)
3. Autoriser Render d'accéder à vos repos

### 2. Déployer Backend

1. Render Dashboard → **+ New**
2. **Web Service**
3. Connecter GitHub
4. Choisir repo `fvs-cartes-platform`

**Configuration:**

```
Name:             fvs-cartes-api
Root Directory:   backend
Environment:      Node
Build Command:    npm install
Start Command:    npm start
Plan:             Free
```

5. **Create Web Service** → Attendre build

### 3. Ajouter Environment Variables

1. Web Service Dashboard → **Environment**
2. **Add Environment Variable** pour chaque:

```
NODE_ENV                 production
PORT                     3001
SUPABASE_URL             https://your-project.supabase.co
SUPABASE_KEY             eyJ...
SUPABASE_SERVICE_KEY     eyJ...
DATABASE_URL             postgresql://...
JWT_SECRET               (générer: openssl rand -hex 32)
CORS_ORIGIN              https://votre-frontend.com
LOG_LEVEL                info
FVS_COMPANY_NAME         FVS
FVS_CONTACT_EMAIL        contact@fvs.com
FVS_PHONE                +229 97 268 741
```

3. **Save** → Redéploie automatiquement

### 4. Vérifier le Deploy

```bash
# Voir URL générée
https://fvs-cartes-api-xxxxx.onrender.com

# Tester
curl https://fvs-cartes-api-xxxxx.onrender.com/health
# {"status":"ok","timestamp":"..."}
```

### 5. (Optionnel) Custom Domain

1. Web Service → **Settings**
2. **Custom Domain**
3. Ajouter: `api.your-domain.com`
4. Suivre instructions DNS

---

## 🎨 Vercel Setup (Frontend)

Vercel est idéal pour React/Vite.

### 1. Créer un compte

1. [vercel.com](https://vercel.com)
2. Sign up avec GitHub
3. Autoriser Vercel

### 2. Importer Projet

1. Vercel Dashboard → **Add New**
2. **Project**
3. Importer `fvs-cartes-platform` du GitHub

### 3. Configuration

```
Project Name:        fvs-cartes
Framework:           Vite
Root Directory:      frontend
Build Command:       npm run build
Output Directory:    frontend/dist
```

4. **Deploy** → Attendre ~3min

### 4. Environment Variables

1. Project Settings → **Environment Variables**
2. Ajouter:

```
VITE_API_URL    https://fvs-cartes-api-xxxxx.onrender.com/api
VITE_APP_NAME   FVS - Cartes d'Identité Scolaires
```

3. **Save** → Redéploie

### 5. (Optionnel) Custom Domain

1. Project Settings → **Domains**
2. Add domain
3. Configurer DNS

---

## 🔐 Sécurité - Bonnes pratiques

### JWT Secret

```bash
# ❌ MAUVAIS
JWT_SECRET=my-secret

# ✅ BON
JWT_SECRET=$(openssl rand -hex 32)
# OU
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

**Jamais commit le `.env` en Git:**
```bash
echo .env >> .gitignore
git rm --cached .env
git commit -m "Remove .env from git"
```

### CORS

**Local:**
```
CORS_ORIGIN=http://localhost:3000
```

**Production:**
```
CORS_ORIGIN=https://fvs-cartes.vercel.app
```

### Database Password

- Supabase génère un strong password
- Le changer régulièrement
- Ne jamais exposer en public

---

## 📊 Vérifier Configs

### Backend

```bash
# 1. Logs
# Render Dashboard → Logs
# Chercher: "✅ Database setup completed"

# 2. Health Check
curl https://fvs-cartes-api.onrender.com/health

# 3. Login Test
curl -X POST https://fvs-cartes-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fvs.com","password":"password123"}'
```

### Frontend

```bash
# 1. Accéder à l'app
https://fvs-cartes.vercel.app

# 2. Vérifier API call
# F12 → Console → devez voir pas d'erreur CORS
# F12 → Network → https://api.../health
```

### Database

```bash
# Depuis Supabase Console
# SQL Editor → taper:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# Doit voir: users, colleges, classes, groupes, eleves, brouillons_cartes
```

---

## 🔄 Workflows Courants

### Ajouter une colonne à `eleves`

```sql
-- 1. Supabase SQL Editor
ALTER TABLE eleves ADD COLUMN parent_email VARCHAR(255);

-- 2. Mettre à jour backend/src/models/Student.js
-- Ajouter champ dans les create/update

-- 3. Commit & Push
-- 4. Render redéploie automatiquement
```

### Changer JWT Secret

```bash
# 1. Générer nouveau
openssl rand -hex 32

# 2. Render Dashboard
# Settings → Environment → JWT_SECRET → Edit → Paste new value

# 3. Save → Redéploie
```

### Augmenter Storage

Render Free → Upgrade vers Starter ($7/mois):
1. Dashboard → Settings → Plan
2. Upgrade
3. Pas besoin de redéployer

---

## 🐛 Problèmes Courants

| Problème | Cause | Solution |
|----------|-------|----------|
| 502 Bad Gateway | App crash | Voir Render logs, vérifier ENV vars |
| "Cannot GET /" | Frontend pas builté | Vérifier build output sur Vercel |
| CORS error | Domaine pas en CORS_ORIGIN | Ajouter domaine à Render ENV |
| Photos 404 | Path invalide | Vérifier photo_path en DB |
| Login échoue | JWT_SECRET vide | Remplir JWT_SECRET en Render |
| DB connection failed | DATABASE_URL invalide | Copier exactement depuis Supabase |

---

## 📝 Checklist Configuration

- [ ] Supabase account créé
- [ ] Tables setup (setup-db lancé)
- [ ] Credentials copiés dans .env
- [ ] Render account créé
- [ ] Backend déployé
- [ ] Environment variables ajoutées
- [ ] Vercel frontend déployé
- [ ] VITE_API_URL correcte
- [ ] Health check OK
- [ ] Login test OK
- [ ] Photos uploadent
- [ ] Logs configurés

---

## 📞 Resources

- Supabase: supabase.com/docs
- Render: render.com/docs
- Vercel: vercel.com/docs
- PostgreSQL: postgresql.org/docs
