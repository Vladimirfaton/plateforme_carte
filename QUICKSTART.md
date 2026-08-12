# ⚡ DÉMARRAGE RAPIDE - 5 minutes

**Prerequis:** Node.js v18+, npm v8+

---

## 1️⃣ Télécharger les Fichiers (2 min)

Créez ce fichier dans votre projet:

```
Les 4 fichiers React à mettre dans frontend/src/pages/:
- CollegeForm.jsx
- StudentsManagement.jsx
- BrouillonExport.jsx
- FinalCards.jsx

Les fichiers utilitaires à mettre dans frontend/src/utils/:
- pdfUtils.js

Remplacer App.jsx avec App_updated.jsx
```

---

## 2️⃣ Installer Packages (1 min)

```bash
cd frontend

# Installer les PDF/QR libraries
npm install pdf-lib pdfkit qrcode html2canvas

# Vérifier que tout est installé
npm list pdf-lib
```

---

## 3️⃣ Configuration (1 min)

Créer/mettre à jour `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

---

## 4️⃣ Démarrer (1 min)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Browser:**
```
http://localhost:3000
Login: admin@fvs.com / password123
```

---

## 5️⃣ Test Rapide (5 min)

### Test Import Excel:
1. Dashboard → Nouveau Collège → Créer collège
2. Gérer Classes → Créer classe "6ème"
3. Gérer Élèves → Télécharger template Excel
4. Remplir 3 élèves, importer
5. ✅ Élèves créés

### Test Brouillon:
1. Brouillon → Voir 6 cartes
2. Éditer un élève
3. Exporter PDF A4
4. ✅ PDF téléchargé (6 cartes paysage)

### Test Cartes Finales:
1. Cartes Finales → Générer
2. ✅ Fichiers téléchargés (1012×638px)

---

## ✅ Fait!

Vous avez une plateforme complète:
- ✅ Import Excel
- ✅ Gestion photos
- ✅ Édition brouillon
- ✅ Export PDF
- ✅ Cartes finales

**Documentation complète:** Voir `INSTALLATION_GUIDE.md`

🚀 **Prêt pour production!**
