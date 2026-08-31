export const up = (pgm) => {
  pgm.addColumn('colleges', {
    adresse_postale: { type: 'varchar(255)' },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('colleges', 'adresse_postale');
};