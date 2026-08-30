export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn('colleges', {
    slogan: { type: 'varchar(150)' },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('colleges', 'slogan');
};