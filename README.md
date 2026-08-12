# FVS - Plateforme Cartes d'Identité Scolaires

Plateforme complète pour la création et gestion des cartes d'identité scolaires au format PVC.

## 📋 Vue d'ensemble

Cette plateforme permet de:
- Gérer les collèges, classes et groupes
- Importer les données des élèves via Excel
- Gérer les photos des élèves (upload/reconnaissance matricule)
- Exporter des brouillons de cartes pour vérification
- Générer les cartes d'identité final (recto/verso) au format PVC

## 🏗️ Architecture

```
fvs-cartes-platform/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Configurations (DB, logger, etc)
│   │   ├── controllers/  # Logique métier
│   │   ├── models/       # Modèles de données
│   │   ├── middleware/   # Auth, erreurs, etc
│   │   ├── routes/       # Définition des routes
│   │   ├── utils/        # Utilitaires (setup DB, etc)
│   │   └── index.js      # Point d'entrée
│   ├── uploads/          # Stockage fichiers (local)
│   ├── logs/             # Fichiers de log
│   └── package.json
│
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── pages/        # Pages principales
│   │   ├── components/   # Composants réutilisables
│   │   ├── services/     # Client API
│   │   ├── utils/        # Utilitaires
│   │   ├── App.jsx       # Composant root
│   │   └── main.jsx      # Point d'entrée
│   ├── public/           # Assets statiques
│   └── package.json
│
└── README.md
```

## 🚀 Installation & Setup

### Prérequis
- Node.js >= 18.0.0
- PostgreSQL (via Supabase)
- Git

### 1️⃣ Backend Setup

```bash
# Aller au dossier backend
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Éditer .env avec vos credentials Supabase
nano .env
```

**Variables .env essentielles:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://user:password@localhost:5432/fvs_cartes
JWT_SECRET=your-super-secret-key-change-in-production
```

### 2️⃣ Configurer la Base de Données

```bash
# Depuis le dossier backend, lancer le setup de DB
npm run setup-db

# Cela va:
# - Créer les tables (colleges, classes, groupes, eleves, etc)
# - Créer les indexes
# - Initialiser la structure
```

### 3️⃣ Lancer le Backend

```bash
# En développement (avec hot-reload)
npm run dev

# Le serveur démarre sur: http://localhost:3001
```

### 4️⃣ Frontend Setup

```bash
# Aller au dossier frontend
cd frontend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# .env est déjà bon par défaut si backend = localhost:3001
```

### 5️⃣ Lancer le Frontend

```bash
# En développement
npm run dev

# Accédez à: http://localhost:3000
```

## 🔐 Authentification

### Créer un compte admin (première utilisation)

1. Allez sur http://localhost:3000/login
2. Cliquez sur "S'enregistrer"
3. Entrez email et mot de passe
4. Le compte est créé avec rôle `admin`

Vous pouvez aussi modifier `.env` du backend et ajouter des credentials de départ:
```
ADMIN_EMAIL=admin@fvs.com
ADMIN_PASSWORD=ChangeMe123!
```

## 📊 Workflow principal

### 1. Créer un collège
- Dashboard → "Nouveau collège"
- Remplir infos: nom, commune, directeur, etc
- Upload signature du directeur (PNG/JPEG)

### 2. Créer classes et groupes
- Collège → "Gérer"
- Créer classe (ex: "6ème")
- Groupes A-G se créent automatiquement

### 3. Importer les élèves
- Classe → "Importer élèves"
- Télécharger template Excel
- Remplir avec données élèves (format: `photo | matricule | nom | prenom | né(e) le | sexe | nationalité | adresse | classe`)
- Valider → Import

### 4. Upload photos en masse
- Renommer les photos avec le matricule (ex: `MAT001.jpg`)
- Glisser-déposer le dossier entier
- Reconnaissance automatique par matricule

### 5. Exporter brouillon
- Classe → "Exporter brouillon"
- Vérifier les données
- Corriger si nécessaire (photo, infos, etc)

### 6. Générer les cartes
- Classe → "Générer cartes"
- Sélectionner format (recto/verso)
- Exporter en JPG (300 DPI)
- Envoyer à l'imprimerie PVC

## 📁 Format Import Excel

**Colonnes obligatoires:**
1. Photo (nom fichier)
2. Matricule (unique)
3. Nom
4. Prénom
5. Né(e) le (JJ/MM/YYYY)
6. Sexe (M/F)
7. Nationalité
8. Adresse + Téléphone
9. Classe (format: 6ème-A)

**Template disponible:** http://localhost:3001/api/students/import/template

## 🔧 API Endpoints

### Auth
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Enregistrement
- `GET /api/auth/verify` - Vérifier token

### Colleges
- `GET /api/colleges` - Tous les collèges
- `GET /api/colleges/commune` - Par commune/département
- `POST /api/colleges` - Créer collège
- `PUT /api/colleges/:id` - Éditer collège
- `POST /api/colleges/:id/signature` - Upload signature

### Classes
- `GET /api/classes/:collegeId/classes` - Classes d'un collège
- `POST /api/classes/:collegeId/classes` - Créer classe
- `PUT /api/classes/class/:classId` - Éditer classe

### Élèves
- `GET /api/students/class/:classId` - Élèves d'une classe
- `POST /api/students/:groupId/students` - Créer élève
- `POST /api/students/import/validate` - Valider Excel
- `POST /api/students/:classId/import` - Importer élèves
- `GET /api/students/import/template` - Télécharger template

## 📦 Structure Stockage

```
uploads/
├── photos/          # Photos des élèves
│   ├── {college_id}/
│   │   └── {classe_id}/
│   │       └── MAT001.jpg
├── signatures/      # Signatures des directeurs
├── brouillons/      # Exports brouillons (JPG)
└── cartes/          # Cartes finales générées
```

## 📝 Logging

Les logs sont stockés dans `backend/logs/`:
- `app.log` - Tous les logs
- `error.log` - Erreurs uniquement

Format: `YYYY-MM-DD HH:mm:ss [LEVEL]: message`

Vous pouvez changer le niveau via `.env`:
```
LOG_LEVEL=debug  # debug, info, warn, error
```

## 🚢 Déploiement (Render)

### Préparer le backend

1. **Commit tout en git**
```bash
git add .
git commit -m "Initial commit"
git push
```

2. **Créer un Procfile** (à la racine backend/)
```
web: npm start
```

3. **Sur render.com:**
   - New Web Service
   - Connecter repo GitHub
   - Build command: `cd backend && npm install`
   - Start command: `cd backend && npm start`
   - Ajouter variables d'env (SUPABASE_URL, JWT_SECRET, etc)

### Préparer le frontend

1. **Sur render.com (ou Vercel/Netlify):**
   - New Static Site
   - Connecter repo
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Ajouter env: `VITE_API_URL=https://your-backend-url/api`

## 🐛 Troubleshooting

### Backend refuse de démarrer
```bash
# Vérifier les logs
tail -f logs/error.log

# Vérifier variables .env
cat .env

# Vérifier DB connection
psql $DATABASE_URL -c "SELECT 1"
```

### Import Excel échoue
- Vérifier format dates (JJ/MM/YYYY)
- Vérifier format classe (ex: 6ème-A)
- Vérifier pas de doublons matricule
- Vérifier encodage fichier (UTF-8)

### Photos non trouvées
- Vérifier les noms fichiers = matricule
- Vérifier format image (JPG/PNG)
- Vérifier droits d'accès dossier `uploads/photos`

## 📞 Contact & Support

**FVS**
- Email: contact@fvs.com
- Phone: +229 97 268 741
- Website: fvs.com

## 📄 License

MIT

## 🎯 Roadmap

- [ ] Génération cartes recto/verso avec QR code
- [ ] Batch processing plusieurs classes
- [ ] Export PDF pour impression
- [ ] Webhooks pour intégration imprimerie
- [ ] Dashboard statistiques
- [ ] Backup automatique BD
- [ ] API mobile
