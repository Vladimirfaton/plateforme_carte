export const shorthands = undefined;

const TABLES = [
  'access_keys',
  'brouillons_cartes',
  'classes',
  'colleges',
  'eleves',
  'observations',
  'otps',
  'users',
];

export const up = (pgm) => {
  TABLES.forEach((table) => {
    pgm.sql(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
  });
};

export const down = (pgm) => {
  TABLES.forEach((table) => {
    pgm.sql(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
  });
};