# 🚀 GUIDE COMPLET D'INSTALLATION - FVS Cartes d'Identité (Phase 3-4)

**Date:** Août 2026  
**Version:** 2.0 - Complète + Prête Production  
**Status:** ✅ 4 Pages React + PDF Generation + Routes

---

## 📋 Sommaire

1. [Fichiers à télécharger](#fichiers-à-télécharger)
2. [Installation NPM](#installation-npm)
3. [Intégration des fichiers](#intégration-des-fichiers)
4. [Configuration](#configuration)
5. [Démarrage](#démarrage)
6. [Tests](#tests)
7. [Troubleshooting](#troubleshooting)

---

## 📥 Fichiers à Télécharger

Téléchargez TOUS ces fichiers depuis la session Claude:

### Pages React (Frontend):
```
1. CollegeForm.jsx
2. StudentsManagement.jsx
3. BrouillonExport.jsx
4. FinalCards.jsx
5. App_updated.jsx (remplace App.jsx)
```

### Fichiers Utilitaires:
```
6. pdfUtils.js (générateur PDF + images)
```

### Documentation:
```
7. INSTALLATION_GUIDE.md (ce fichier)
8. ROUTES_DOCUMENTATION.md (API doc)
9. COMPONENT_SPECS.md (spécifications complètes)
```

**Taille totale:** ~150KB (code source)

---

## 💻 Installation NPM

### Étape 1: Vérifier Node.js

```bash
node --version  # v18+ requis
npm --version   # v8+ requis
```

### Étape 2: Frontend - Ajouter Libraries

Naviguez dans le dossier `frontend` et installez les packages manquants:

```bash
cd frontend

# PDF generation
npm install pdf-lib pdfkit

# QR codes (déjà installé)
npm install qrcode

# Canvas (optionnel, déjà en dev)
npm install html2canvas

# Excel (déjà installé)
npm install exceljs

# Axios (déjà installé)
npm install axios
```

**Résultat attendu:**
```
added X packages, removed Y packages, updated Z packages
```

### Étape 3: Backend - Vérifier Installation

Le backend doit avoir ces packages (vérifiez `backend/package.json`):

```json
{
  "dependencies": {
    "express": "^4.18",
    "pg": "^8.10",
    "axios": "^1.4",
    "bcryptjs": "^2.4",
    "jsonwebtoken": "^9.0",
    "multer": "^1.4",
    "sharp": "^0.32",
    "exceljs": "^4.3",
    "qrcode": "^1.5",
    "winston": "^3.8",
    "dotenv": "^16.0"
  }
}
```

Si manquants:
```bash
cd backend
npm install [package-name]
```

---

## 🔗 Intégration des Fichiers

### Structure de Dossiers Attendue

```
fvs-cartes-final/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── uploads/
│   ├── logs/
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx ✅ (existant)
    │   │   ├── Dashboard.jsx ✅ (existant)
    │   │   ├── ClassesManagement.jsx ✅ (existant)
    │   │   ├── CollegeForm.jsx ⭐ (NEW)
    │   │   ├── StudentsManagement.jsx ⭐ (NEW)
    │   │   ├── BrouillonExport.jsx ⭐ (NEW)
    │   │   └── FinalCards.jsx ⭐ (NEW)
    │   ├── utils/
    │   │   ├── api.js ✅ (existant)
    │   │   └── pdfUtils.js ⭐ (NEW)
    │   ├── App.jsx (À REMPLACER par App_updated.jsx)
    │   ├── main.jsx
    │   └── index.css
    ├── .env
    └── package.json
```

### Étape 1: Copier les 4 Pages React

**Destination:** `frontend/src/pages/`

Copiez ces fichiers dans le dossier `pages`:
```
CollegeForm.jsx
StudentsManagement.jsx
BrouillonExport.jsx
FinalCards.jsx
```

### Étape 2: Copier le fichier utilitaire PDF

**Destination:** `frontend/src/utils/`

Copiez:
```
pdfUtils.js
```

### Étape 3: Remplacer App.jsx

**Destination:** `frontend/src/App.jsx`

1. **Sauvegardez votre App.jsx actuel** en tant que `App.jsx.backup`
2. Remplacez le contenu par `App_updated.jsx`
3. Renommez en `App.jsx`

**Vérifiez:** Les 7 imports de pages:
```javascript
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClassesManagement from './pages/ClassesManagement';
import CollegeForm from './pages/CollegeForm'; // NEW
import StudentsManagement from './pages/StudentsManagement'; // NEW
import BrouillonExport from './pages/BrouillonExport'; // NEW
import FinalCards from './pages/FinalCards'; // NEW
```

---

## ⚙️ Configuration

### Frontend .env

**Fichier:** `frontend/.env`

```env
VITE_API_URL=http://localhost:3001/api
```

Pour production:
```env
VITE_API_URL=https://api.fvs-cartes.com/api
```

### Backend .env

**Fichier:** `backend/.env`

Doit contenir:
```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=7d

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 Démarrage

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

**Expected Output:**
```
🟢 Server running on http://localhost:3001
📊 Database connected
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v4.x.x ready in 500 ms

➜  Local:   http://localhost:3000/
➜  press h to show help
```

### Terminal 3: Browser

```
http://localhost:3000
```

**Connexion Test:**
```
Email: admin@fvs.com
Password: password123
```

---

## ✅ Tests

### Test 1: Login

1. Allez sur `http://localhost:3000`
2. Login avec `admin@fvs.com` / `password123`
3. ✅ Redirect vers Dashboard

### Test 2: Créer un Collège

1. Dashboard → Bouton "➕ Nouveau Collège"
2. Remplir form:
   - Nom: "Test Collège"
   - Département: "Littoral"
   - Commune: "Cotonou"
   - Directeur: "Test Director"
3. ✅ Page créée, voir dans liste

### Test 3: Créer une Classe

1. Dashboard → Collège → Bouton "📚 Gérer Classes"
2. Créer classe "6ème"
3. ✅ 7 groupes A-G créés automatiquement

### Test 4: Importer Élèves

1. Classes → Classe → Bouton "👥 Gérer Élèves"
2. Tab "📥 Importer Excel"
3. Télécharger template
4. Remplir 5 élèves (colonnes obligatoires)
5. Valider et importer
6. ✅ Élèves créés en BD

### Test 5: Upload Photos

1. StudentsManagement → Tab "📷 Upload Photos"
2. Renommer photos: `MAT001.jpg`, `MAT002.jpg`
3. Drag-drop ou sélectionner
4. ✅ Photos uploadées et matchées

### Test 6: Brouillon Export

1. Classes → Classe → Bouton "📄 Brouillon"
2. Voir 6 cartes/page
3. Cliquer "✏️ Éditer Infos" sur une carte
4. Modifier un champ, sauver
5. Cliquer "📥 Exporter PDF A4"
6. ✅ PDF téléchargé (6 cartes paysage)

### Test 7: Cartes Finales

1. Classes → Classe → Bouton "🎫 Cartes Finales"
2. Voir preview recto/verso
3. Sélectionner format: PDF ou JPG
4. Cliquer "🖨️ Générer Cartes"
5. ✅ Fichiers téléchargés (1012×638px)

---

## 🔧 Troubleshooting

### ❌ "VITE_API_URL is not defined"

**Cause:** .env.local manquant

**Solution:**
```bash
cd frontend
echo "VITE_API_URL=http://localhost:3001/api" > .env.local
npm run dev
```

### ❌ "Cannot find module 'pdf-lib'"

**Cause:** npm packages manquants

**Solution:**
```bash
cd frontend
npm install pdf-lib pdfkit
npm run dev
```

### ❌ "Backend not responding (CORS error)"

**Cause:** Backend offline

**Solution:**
```bash
# Terminal séparé
cd backend
npm run dev

# Vérifiez http://localhost:3001/api/auth/verify
```

### ❌ "Photos not uploading"

**Cause:** Dossier `uploads/photos` manquant

**Solution:**
```bash
cd backend
mkdir -p uploads/photos
mkdir -p uploads/brouillons
mkdir -p uploads/signatures
mkdir -p uploads/cartes
npm run dev
```

### ❌ "PDF generation fails"

**Cause:** pdfUtils.js mal importé

**Solution:**

1. Vérifiez chemin import dans BrouillonExport.jsx:
```javascript
import { generateBrouillonPDF } from '../utils/pdfUtils';
```

2. Vérifiez fichier existe:
```bash
ls frontend/src/utils/pdfUtils.js
```

3. Vérifiez exports en fin de pdfUtils.js:
```javascript
export { generateBrouillonPDF, generateFinalCardsPDF, generateFinalCardsImages };
```

### ❌ "Students not showing in BrouillonExport"

**Cause:** Students pas dans la classe

**Solution:**
1. Allez StudentsManagement
2. Import Excel ou créer élèves manuellement
3. Recharger page BrouillonExport

---

## 📦 Checklist Déploiement Production

- [ ] Backend déployé sur Render
- [ ] Frontend déployé sur Vercel
- [ ] Variables d'env configurées (Supabase)
- [ ] CORS configuré vers domaine production
- [ ] JWT_SECRET changé (min 32 chars)
- [ ] SSL activé (HTTPS)
- [ ] Backups database configurés
- [ ] Logs centralisés (Winston)
- [ ] Tests end-to-end (Cypress) réussis

---

## 📞 Support

**Problèmes communs:**

1. **Import Excel échoue**
   - Vérifiez 9 colonnes exactes
   - Dates format JJ/MM/YYYY
   - Pas de colonnes vides

2. **PDF vide**
   - Vérifiez photos uploadées
   - Vérifiez élèves avec données complètes
   - Vérifiez pdfUtils.js importe correctement

3. **Signature pas affichée**
   - Vérifiez fichier PNG/JPEG uploadé
   - Vérifiez taille 200×80px
   - Vérifiez chemin signature_path en BD

---

## 🎯 Prochaines Étapes

1. ✅ Installer tous les fichiers
2. ✅ Tester les 7 workflows
3. ✅ Générer PDF brouillon
4. ✅ Générer cartes finales
5. ➡️ Deploy production (Render/Vercel)
6. ➡️ Tests e2e (Cypress)
7. ➡️ Go Live! 🚀

---

**Version:** 2.0 - Complète et Production-Ready  
**Dernière mise à jour:** Août 2026  
**Statut:** ✅ PRÊT

Bon courage! 🚀
