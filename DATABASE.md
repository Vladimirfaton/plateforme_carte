# 📊 Schéma Base de Données - FVS Cartes

## Vue d'ensemble

La base de données est en **PostgreSQL** via **Supabase**. Voici la structure complète.

## 🗂️ Tables

### 1. `users`
Utilisateurs authentifiés

```sql
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── role (VARCHAR) -- admin
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Exemple:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@fvs.com",
  "role": "admin"
}
```

---

### 2. `colleges`
Les établissements scolaires

```sql
colleges
├── id (UUID, PK)
├── nom (VARCHAR)
├── commune (VARCHAR)
├── departement (VARCHAR)
├── directeur_nom (VARCHAR)
├── directeur_contact (VARCHAR)
├── email (VARCHAR)
├── telephone (VARCHAR)
├── signature_path (TEXT) -- Path vers fichier signature
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Exemple:**
```json
{
  "id": "college-001",
  "nom": "Collège Catholique Ste Cécile",
  "commune": "Cotonou",
  "departement": "Littoral",
  "directeur_nom": "Victor O. LAMODI",
  "signature_path": "/uploads/signatures/college-001.png"
}
```

---

### 3. `classes`
Les classes d'un collège

```sql
classes
├── id (UUID, PK)
├── college_id (UUID, FK → colleges)
├── code (VARCHAR) -- Ex: "6ème", "5ème", etc
├── niveau (VARCHAR)
├── effectif_previsionnel (INTEGER)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Exemple:**
```json
{
  "id": "class-001",
  "college_id": "college-001",
  "code": "6ème",
  "effectif_previsionnel": 180
}
```

**Index:**
```sql
CREATE INDEX idx_classes_college ON classes(college_id)
```

---

### 4. `groupes`
Les groupes/séries au sein d'une classe (A-G)

```sql
groupes
├── id (UUID, PK)
├── classe_id (UUID, FK → classes)
├── lettre (VARCHAR) -- "A", "B", "C", "D", "E", "F", "G"
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Exemple:**
```json
{
  "id": "group-001",
  "classe_id": "class-001",
  "lettre": "A"
}
```

**Relation:** 7 groupes par classe (A-G créés auto)

**Index:**
```sql
CREATE INDEX idx_groupes_classe ON groupes(classe_id)
```

---

### 5. `eleves`
Les élèves (cœur du système)

```sql
eleves
├── id (UUID, PK)
├── groupe_id (UUID, FK → groupes)
├── matricule (VARCHAR, UNIQUE) -- Identifiant élève
├── nom (VARCHAR)
├── prenom (VARCHAR)
├── date_naissance (DATE) -- Format: YYYY-MM-DD
├── sexe (VARCHAR) -- "M" ou "F"
├── nationalite (VARCHAR)
├── adresse (TEXT)
├── telephone (VARCHAR)
├── photo_path (TEXT) -- Path: /uploads/photos/{college_id}/{classe_id}/{matricule}.jpg
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Exemple:**
```json
{
  "id": "student-001",
  "groupe_id": "group-001",
  "matricule": "MAT001",
  "nom": "HOUNDNJE",
  "prenom": "Oswell Séwanu",
  "date_naissance": "2009-02-01",
  "sexe": "M",
  "nationalite": "BENINOISE",
  "adresse": "95961070",
  "telephone": "97268741",
  "photo_path": "/uploads/photos/college-001/class-001/MAT001.jpg"
}
```

**Indexes:**
```sql
CREATE INDEX idx_eleves_groupe ON eleves(groupe_id)
CREATE INDEX idx_eleves_matricule ON eleves(matricule)
```

---

### 6. `brouillons_cartes`
Brouillons d'export pour vérification avant impression

```sql
brouillons_cartes
├── id (UUID, PK)
├── college_id (UUID, FK → colleges)
├── classe_id (UUID, FK → classes)
├── nom_brouillon (VARCHAR) -- Ex: "6ème-A-2024-01-15"
├── export_path (TEXT) -- Path vers fichier JPG/PNG
├── total_cartes (INTEGER) -- Nombre cartes dans le brouillon
├── status (VARCHAR) -- "draft", "verified", "exported"
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Exemple:**
```json
{
  "id": "draft-001",
  "college_id": "college-001",
  "classe_id": "class-001",
  "nom_brouillon": "6ème-2024-01-15",
  "export_path": "/uploads/brouillons/draft-001.pdf",
  "total_cartes": 45,
  "status": "draft"
}
```

---

## 🔗 Hiérarchie & Relations

```
User (Admin)
  └─ College
      ├─ Signature (1 fichier)
      │
      └─ Classes (plusieurs)
          └─ Groups A-G (7 par classe)
              └─ Students (plusieurs)
                  ├─ Photo (1 fichier)
                  └─ Data (matricule, nom, etc)

Brouillon
  ├─ College
  ├─ Classe
  └─ File Export (JPG/PDF)
```

---

## 📊 Requêtes SQL courantes

### Tous les élèves d'une classe
```sql
SELECT e.* FROM eleves e
JOIN groupes g ON e.groupe_id = g.id
WHERE g.classe_id = 'class-001'
ORDER BY e.nom ASC;
```

### Tous les élèves d'un collège
```sql
SELECT e.* FROM eleves e
JOIN groupes g ON e.groupe_id = g.id
JOIN classes c ON g.classe_id = c.id
WHERE c.college_id = 'college-001'
ORDER BY c.code ASC, g.lettre ASC, e.nom ASC;
```

### Élève par matricule
```sql
SELECT * FROM eleves WHERE matricule = 'MAT001';
```

### Classes d'un collège
```sql
SELECT * FROM classes WHERE college_id = 'college-001' ORDER BY code;
```

### Groupes d'une classe
```sql
SELECT * FROM groupes WHERE classe_id = 'class-001' ORDER BY lettre;
```

---

## 🔄 Cascade & Constraints

- **Collège supprimé** → Classes supprimées → Groupes supprimés → Élèves supprimés
- **Classe supprimée** → Groupes supprimés → Élèves supprimés
- **Groupe supprimé** → Élèves supprimés

```sql
FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE
FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE
```

---

## 📈 Volumes estimés

Avec **50 000 cartes/an**:

| Table | Rows | Notes |
|-------|------|-------|
| users | 1-5 | Admin seulement |
| colleges | 10-50 | Établissements |
| classes | 100-500 | ~5-10 classes par collège |
| groupes | 700-3500 | 7 groupes par classe |
| eleves | 50000 | Croissance ~50k/an |
| brouillons_cartes | 500-1000 | Brouillons mensuels |

**Stockage photos estimé:**
- 50 000 élèves × 50 KB moyenne = 2.5 GB/an
- Signature × 50 collèges × 20 KB = 1 MB

---

## 🔒 Sécurité

- **Passwords:** Hashés en `bcrypt` (bcryptjs)
- **Tokens JWT:** Expiration 7 jours
- **Connexion DB:** SSL en production
- **Photos:** Stockage local ou Supabase Storage (privé)
- **Indexes:** Sur FK et recherches fréquentes

---

## 🛠️ Migration futur

Pour ajouter des champs:

```sql
-- Exemple: ajouter parent_contact à eleves
ALTER TABLE eleves ADD COLUMN parent_contact VARCHAR(20);

-- Puis mettre à jour le model
```

---

## 📝 Notes

- Dates stockées en `YYYY-MM-DD` (ISO 8601)
- Timestamps avec timezone `TIMESTAMP`
- UUIDs pour primary keys (portabilité)
- Photos en local d'abord, Supabase Storage en production
