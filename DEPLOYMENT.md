# 🚀 Déploiement - FVS Cartes d'Identité

Guide complet pour déployer en production sur **Render** (gratuit tier).

## 📋 Checklist pré-déploiement

- [ ] Tout est en Git
- [ ] `.env` n'est PAS commité
- [ ] Logs configurés
- [ ] JWT_SECRET généré (pas default)
- [ ] Test local en production mode: `NODE_ENV=production npm start`
- [ ] DB Supabase configurée
- [ ] CORS correctement configuré

---

## 🎯 Déploiement Backend (Render)

### 1. Préparer le repo

```bash
# À la racine du projet
cat > backend/Procfile << 'EOF'
web: npm start
EOF

# Commit
git add .
git commit -m "Add Procfile and deployment config"
git push origin main
```

### 2. Sur render.com

1. **Créer un compte** → render.com
2. **New +** → **Web Service**
3. Connecter votre repo GitHub
4. Remplir les infos:

| Champ | Valeur |
|-------|--------|
| Name | `fvs-cartes-api` |
| Root Directory | `backend` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | `Free` |

### 3. Ajouter variables d'env

Dashboard → **Environment** → Ajouter:

```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
JWT_SECRET=your-super-secure-random-key-generate-one!
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
```

**Générer JWT_SECRET:**
```bash
openssl rand -base64 32
# Copier la sortie dans JWT_SECRET
```

### 4. Deploy

- Render auto-redéploie au push
- Voir logs: **Logs** tab dans Render
- URL backend: `https://fvs-cartes-api.onrender.com`

**Test:**
```bash
curl https://fvs-cartes-api.onrender.com/health
# {"status":"ok","timestamp":"..."}
```

---

## 🎨 Déploiement Frontend (Vercel)

Vercel est plus simple pour React + Vite.

### 1. Préparer

```bash
# Build test local
cd frontend
npm run build

# Voir le dist/
ls dist/
```

### 2. Sur vercel.com

1. **Import Project** → GitHub
2. Sélectionner votre repo
3. Remplir:

| Champ | Valeur |
|-------|--------|
| Project Name | `fvs-cartes` |
| Framework | `Vite` |
| Root Directory | `frontend` |

### 3. Environment Variables

Ajouter:
```
VITE_API_URL=https://fvs-cartes-api.onrender.com/api
```

### 4. Deploy

- Auto-redéploie au push
- URL: `https://fvs-cartes.vercel.app` (ou custom domain)

---

## 🔗 Alternative: Render pour Frontend aussi

Si vous préférez garder tout sur Render:

### 1. Create Static Site

- **New +** → **Static Site**
- Connecter GitHub
- Root Directory: `frontend`
- Build Command: `npm run build`
- Publish Directory: `frontend/dist`

### 2. Environment

Ajouter:
```
VITE_API_URL=https://fvs-cartes-api.onrender.com/api
```

---

## 🗄️ Database Setup en Production

### Via Supabase Console

1. **Tables:** Créer via SQL (voir `DATABASE.md`)
   ```bash
   # Ou depuis CLI:
   npm run setup-db
   ```

2. **Backups:** Supabase fait auto (gratuit)

3. **Sécurité:**
   - Activer Row Level Security (RLS)
   - Policies sur `colleges` et `eleves`
   - Authentification JWT

### RLS Policies (exemple)

```sql
-- Permettre admin de lire toutes les données
CREATE POLICY "Admin access all" ON colleges
  FOR ALL USING (true);

-- Empêcher autres utilisateurs
CREATE POLICY "Deny anonymous" ON colleges
  FOR ALL USING (false) WITH CHECK (false);
```

---

## 🔒 Sécurité Production

### 1. JWT Secret
```bash
# Générer un secret fort
openssl rand -hex 32
# OU
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. CORS
```
CORS_ORIGIN=https://fvs-cartes.vercel.app
```

### 3. Rate Limiting
```bash
# Installer express-rate-limit
npm install express-rate-limit
```

```javascript
// Dans index.js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // 100 requêtes par IP
});

app.use('/api/', limiter);
```

### 4. HTTPS
- Render: Automatique
- Vercel: Automatique

---

## 📊 Monitoring

### Logs Render
```bash
# Dans le dashboard Render
# "Logs" tab → voir erreurs en temps réel
```

### Logs Fichier
```bash
# Backend logs
tail -f logs/app.log
tail -f logs/error.log
```

### Health Check
```bash
curl https://fvs-cartes-api.onrender.com/health
```

---

## 🐛 Troubleshooting Deploy

### Backend n'active pas
**Vérifier:**
```bash
# Logs Render
# Erreur commune: DATABASE_URL invalide

# Tester localement
DATABASE_URL="..." npm start
```

### Frontend blanc
```bash
# Vérifier VITE_API_URL
# Console browser (F12) → Network → /api/auth/verify
# Erreur CORS? Vérifier CORS_ORIGIN backend
```

### "Cannot find module"
```bash
# Render rebuild pas capturée
# Solution: Force rebuild
# Render dashboard → Manual Deploy
```

### Photos/Uploads perdus
**Problème:** Render recrée filesystem à chaque restart

**Solutions:**
1. Utiliser Supabase Storage (recommandé)
2. Utiliser AWS S3
3. Keep-alive service (pay tier)

**Supabase Storage:**
```javascript
// Importer client
import { supabase } from './config/database.js';

// Upload photo
const { data, error } = await supabase.storage
  .from('photos')
  .upload(`${college_id}/${matricule}.jpg`, file);
```

---

## 📦 Migration BD Production

### Backup avant migration
```sql
-- Supabase Dashboard
-- "SQL Editor" → nouvelle query
SELECT * INTO colleges_backup FROM colleges;
```

### Ajouter colonne
```sql
ALTER TABLE eleves ADD COLUMN parent_email VARCHAR(255);
```

### Test sur dev d'abord!
```bash
# Tester sur localhost avant prod
npm run migrate
```

---

## 📈 Scaling Future

Si vous dépassez free tier Render:

### Options:
1. **Railway.app** (~$5/mois)
2. **Heroku** ($7/mois)
3. **DigitalOcean** ($5/mois)
4. **Fly.io** (pay-as-you-go)

### Avant de upgrader:
- Ajouter caching (Redis)
- Optimiser requêtes DB
- Compression images
- Vérifier utilisation réelle

---

## ✅ Checklist Post-Déploiement

- [ ] Backend accessible
- [ ] Frontend accessible
- [ ] Login fonctionne
- [ ] Upload fichiers fonctionne
- [ ] Import Excel fonctionne
- [ ] Photos s'affichent
- [ ] Logs configurés
- [ ] Backup BD activé
- [ ] SSL/HTTPS partout
- [ ] Domain custom (optionnel)

---

## 🎓 Commandes Utiles

```bash
# Backend
npm run dev                # Dev local
npm start                  # Production
npm run setup-db          # Setup DB

# Frontend
npm run dev               # Dev local
npm run build             # Build prod
npm run preview           # Preview prod

# Database
psql $DATABASE_URL -c "SELECT 1"  # Test connection
```

---

## 📞 Support

- Render Issues: render.com/support
- Vercel Issues: vercel.com/support
- Supabase: supabase.com/docs
