// Données complètes du Bénin - Départements et Communes

export const beninLocations = {
    "Alibori": [
    "Banikoara",
    "Gogonou",
    "Kandi",
    "Karimama",
    "Malanville",
    "Segbana",
  ],
    "Atakora": [
    "Boukoumbé",
    "Cobly",
    "Kerou",
    "Kouande",
    "Materi",
    "Natitingou",
    "Ouassa-Pehunco",
    "Tanguieta",
    "Toukountouna",
  ],
    "Atlantique": [
    "Abomey-calavi",
    "Allada",
    "Kpomasse",
    "Ouidah",
    "Sô-ava",
    "Toffo",
    "Tori-Bossito",
    "Zè",
  ],
  "Borgou": [
    "Bembèrèkè",
    "Kalale",
    "N'Dali",
    "Nikki",
    "Parakou",
    "Perere",
    "Sinende",
    "Tchaourou",
  ],
    "Collines": [
    "Banta",
    "Dassa-Zoume",
    "Glazoue",
    "Ouesse",
    "Savalou",
    "Save",
  ],
    "Couffo": [
    "Aplahoué",
    "Djakotomey",
    "Dogbo",
    "Klouekanmey",
    "Lalo",
  ],
    "Donga": [
    "Bassila",
    "Copargo",
    "Djougou",
    "Ouaké",
  ],
  "Littoral": [
    "Cotonou",
  ],
    "Mono": [
    "Athiémé",
    "Bopa",
    "Comé",
    "Grand-Popo",
    "Houéyogbé",
    "Lokossa",
  ],
  "Ouémé": [
    "Ajarra",
    "Adjohoun",
    "Aguegues",
    "Akpro-Misserete",
    "Avrankou",
    "Bonou",
    "Dangbo",
    "Porto-Novo",
    "Seme-Podji",
  ],
  "Plateau": [
    "Adja-Ouere",
    "Ifangni",
    "Ketou",
    "Pobe",
    "Sakete",
  ],
  "Zou": [
    "Abomey",
    "Agbangnizoun",
    "Bohicon",
    "Cove",
    "Djidja",
    "Ouinhi",
    "Zagnanado",
    "Za-kpota",
    "Zogbodomey",
  ],
};

export const getDepartements = () => Object.keys(beninLocations);

export const getCommunes = (departement) => {
  return beninLocations[departement] || [];
};
