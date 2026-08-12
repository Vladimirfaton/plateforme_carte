# 🚀 Guide d'Intégration Rapide - Pages Manquantes

## ✅ Qui est FAIT:

- ✅ **Backend:** API complète (colleges, classes, students, cartes, locations)
- ✅ **Dashboard:** Bleu ciel + stats (collèges, élèves, cartes)
- ✅ **Communes:** Tous les 12 départements du Bénin
- ✅ **Champs Élèves:** Photo, Matricule, Nom, Prenom(s), Sexe, Date Naiss, Lieu Naiss, Nationalité, Adresse
- ✅ **Cartes API:** Endpoints brouillon + finales (1012x638px, 300 DPI, CMYK)
- ✅ **QR Code:** Infos établissement

## 🔧 À Implémenter (Pages React):

### 1. **Page Créer/Éditer Collège**
Fichier: `frontend/src/pages/CollegeForm.jsx`

Template:
```jsx
import { useState } from 'react';
import { collegeAPI } from '../services/api';

export default function CollegeForm() {
  const [data, setData] = useState({
    nom: '',
    commune: '',
    departement: '',
    directeur_nom: '',
    directeur_contact: '',
    email: '',
    telephone: '',
  });
  const [signature, setSignature] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Créer collège
      const collegeResp = await collegeAPI.create(data);
      
      // Upload signature
      if (signature) {
        await collegeAPI.uploadSignature(collegeResp.data.id, signature);
      }
      
      alert('✅ Collège créé!');
      // Redirect dashboard
    } catch (error) {
      alert('❌ Erreur: ' + error.response?.data?.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
      <h1 className="text-3xl font-bold text-sky-700 mb-6">Nouveau Collège</h1>
      
      <input
        type="text"
        placeholder="Nom du collège"
        value={data.nom}
        onChange={(e) => setData({...data, nom: e.target.value})}
        className="w-full px-4 py-2 border-2 border-sky-300 rounded-lg mb-4"
        required
      />
      
      <select
        value={data.departement}
        onChange={(e) => setData({...data, departement: e.target.value})}
        className="w-full px-4 py-2 border-2 border-sky-300 rounded-lg mb-4"
        required
      >
        <option>Sélectionner département</option>
        {/* Remplir avec les départements */}
      </select>
      
      <select
        value={data.commune}
        onChange={(e) => setData({...data, commune: e.target.value})}
        className="w-full px-4 py-2 border-2 border-sky-300 rounded-lg mb-4"
        required
      >
        <option>Sélectionner commune</option>
        {/* Remplir avec les communes */}
      </select>
      
      <input
        type="text"
        placeholder="Directeur"
        value={data.directeur_nom}
        onChange={(e) => setData({...data, directeur_nom: e.target.value})}
        className="w-full px-4 py-2 border-2 border-sky-300 rounded-lg mb-4"
      />
      
      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => setSignature(e.target.files[0])}
        className="w-full mb-4"
      />
      <p className="text-sm text-gray-600 mb-4">Signature directeur (PNG/JPEG, 200x80px)</p>
      
      <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-semibold">
        ✅ Créer Collège
      </button>
    </form>
  );
}
```

---

### 2. **Page Gestion Élèves + Import Excel**
Fichier: `frontend/src/pages/StudentsManagement.jsx`

Features:
- Liste élèves par classe
- Import Excel (9 colonnes: Photo, Matricule, Nom, Prenom(s), Sexe, Date Naiss, Lieu Naiss, Nationalité, Adresse)
- Upload photos en masse
- Éditer élève
- Supprimer élève

```jsx
// Appel API pour import:
const handleImportExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const validateResp = await importAPI.validateExcel(formData);
  
  if (validateResp.data.valid) {
    const importResp = await importAPI.importStudents(classId, validateResp.data.data);
    alert(`✅ ${importResp.data.imported} élèves importés!`);
  } else {
    alert(`❌ Erreurs:\n${validateResp.data.errors.join('\n')}`);
  }
};
```

---

### 3. **Page Brouillon (6 cartes/page, modifiables)**
Fichier: `frontend/src/pages/BrouillonExport.jsx`

Features:
- Afficher 6 cartes par page A4 paysage
- Éditer données élève inline
- Changer photo
- Générer PDF pour impression

```jsx
// Récupérer données:
const handleGenerateBrouillon = async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/cards/${classId}/brouillon`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  // Afficher 6 cartes par page
  // Chaque carte éditable
};
```

---

### 4. **Page Cartes Finales (Recto/Verso)**
Fichier: `frontend/src/pages/FinalCards.jsx`

Specs:
- **Dimensions:** 1012x638 px (300 DPI, ISO ID-1)
- **Recto:** Photo + infos élève (matricule, nom, classe)
- **Verso:** Infos collège + signature directeur + QR code + filigrane "Réalisé par FVS"
- **Couleur:** CMYK

```jsx
// Générer cartes:
const handleGenerateFinalCards = async (studentIds) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/cards/${classId}/generate`,
    { students: studentIds },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  // response.data.cards contient:
  // - matricule, nom, prenom, photo_path, qrCode, etc
  
  // Générer images 1012x638 avec canvas/fabric.js
};
```

---

## 📋 Champs Élève (Format Excel)

Colonnes (ordre exact):
1. **Photo** - Nom fichier (ex: MAT001.jpg)
2. **Matricule** - Identifiant unique
3. **Nom** - Nom de famille
4. **Prenom(s)** - Prénoms
5. **Sexe** - M/F
6. **Date Naissance** - JJ/MM/YYYY
7. **Lieu Naissance** - Ville/Région
8. **Nationalité** - Pays
9. **Adresse** - Rue + numéro

**Template:** Téléchargeable via `/api/students/import/template`

---

## 🎯 Routes React à Ajouter

Dans `frontend/src/App.jsx`:

```jsx
<Route path="/colleges/new" element={<CollegeForm />} />
<Route path="/colleges/:collegeId/edit" element={<CollegeForm />} />
<Route path="/colleges/:collegeId/classes" element={<ClassesManagement />} />
<Route path="/classes/:classId/students" element={<StudentsManagement />} />
<Route path="/classes/:classId/brouillon" element={<BrouillonExport />} />
<Route path="/classes/:classId/cartes" element={<FinalCards />} />
```

---

## 🎨 Couleur Dominante: Bleu Ciel

Tailwind: `bg-sky-*` (50, 100, 500, 600, 700)

```
bg-sky-50  = Fond léger
bg-sky-500 = Boutons
bg-sky-600 = Boutons hover
bg-sky-700 = Headers
```

---

## 📊 Brouillon: 6 Cartes/Page

Layout A4 Paysage (297 x 210 mm):
```
┌─────────────┬─────────────┐
│ CARTE 1     │ CARTE 2     │
├─────────────┼─────────────┤
│ CARTE 3     │ CARTE 4     │
├─────────────┼─────────────┤
│ CARTE 5     │ CARTE 6     │
└─────────────┴─────────────┘
```

Chaque carte:
- 180 mm × 100 mm (aprox)
- Photo 60x80mm
- Texte noir, fond blanc

---

## 🎫 Cartes Finales: Recto/Verso

### Recto (face avant):
```
┌───────────────────────┐
│   PHOTO 80x100        │
│   (left side)         │
│                       │
└───────────────────────┘
MATRICULE: MAT001
NOM: HOUNDNJE Oswell Séwanu
CLASSE: 6ème-A
DATE NAISS: 01/02/2009
```

### Verso (face arrière):
```
┌───────────────────────┐
│ COLLÈGE CATHOLIQUE    │
│ STE CÉCILE            │
│ Cotonou, Littoral     │
│                       │
│ [SIGNATURE DIRECTEUR] │
│                       │
│ ┌─────────────────┐   │
│ │                 │   │
│ │  QR CODE        │   │
│ │  (30x30mm)      │   │
│ └─────────────────┘   │
│                       │
│ Réalisé par FVS       │
│ contact@fvs.com       │
└───────────────────────┘
```

---

## 🚀 Déploiement Rapide

1. Backend: `npm run dev` (3001)
2. Frontend: `npm run dev` (3000)
3. Implémenter les 4 pages React ci-dessus
4. Tester end-to-end
5. Générer ZIP pour version finale

---

## 📞 Questions?

Toutes les APIs sont **prêtes** et **documentées** dans le backend.
Les pages React sont des **templates** - copier-coller et adapter!

**Toi: Continue les pages React**
**Moi: Backend est 100% prêt** ✅
