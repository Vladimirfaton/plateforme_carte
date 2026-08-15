Usage rapide — ObservationsPanel

- Fichier composant : src/components/ObservationsPanel.jsx
- API : classAPI.listObservations(classId), classAPI.createObservation(classId, contenu)

Inclusion dans `ClassPanel` ou `Dashboard` :

1. Importer le composant :
   import ObservationsPanel from '../components/ObservationsPanel';

2. Ajouter dans le rendu (ex: panneau de classe) :
   <ObservationsPanel classId={activeClassId} />

Notes UI :
- Le composant gère l'affichage et la création d'observations.
- Les permissions sont vérifiées côté backend : seuls admin/directeur/secretaire du collège peuvent accéder.
- Pour une intégration complète, placez le composant à côté du bouton "Brouillon" ou dans un onglet "Observations" du panneau de classe.
