export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('renouvellements_cles', {
    id: { type: 'uuid', primaryKey: true },
    college_id: {
      type: 'uuid',
      notNull: true,
      references: 'colleges(id)',
      onDelete: 'CASCADE',
    },
    access_key_id: {
      type: 'uuid',
      references: 'access_keys(id)',
      onDelete: 'SET NULL',
    },
    methode: { type: 'varchar(20)', notNull: true }, // 'kkiapay' | 'manuel'
    annees: { type: 'integer', notNull: true }, // durée totale en années (unité × multiplicateur)
    valide_par: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'SET NULL',
    }, // NULL si paiement automatique KKiaPay, sinon l'admin qui a validé
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
  });

  pgm.createIndex('renouvellements_cles', 'college_id', { name: 'idx_renouvellements_college' });
};

export const down = (pgm) => {
  pgm.dropTable('renouvellements_cles');
};