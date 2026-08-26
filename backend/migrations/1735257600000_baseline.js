export const shorthands = undefined;

export const up = (pgm) => {
  // Cette migration documente le schéma existant en prod (créé via l'ancien
  // setupDatabase.js + modifications manuelles Supabase). Elle ne doit RIEN
  // exécuter en prod — elle sera marquée "déjà appliquée" manuellement.
  // Le contenu ci-dessous sert de référence/documentation ET permettra de
  // recréer le schéma à l'identique sur un environnement neuf (ex: staging).

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)' },
    role: { type: 'varchar(50)', default: 'admin' },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    college_id: { type: 'uuid' }, // FK ajoutée après création de colleges
    username: { type: 'varchar(100)', unique: true },
    nom: { type: 'varchar(255)' },
    prenom: { type: 'varchar(255)' },
    telephone: { type: 'varchar(30)' },
    status: { type: 'varchar(30)', default: 'active' },
  });

  pgm.createTable('colleges', {
    id: { type: 'uuid', primaryKey: true },
    nom: { type: 'varchar(255)', notNull: true },
    commune: { type: 'varchar(255)', notNull: true },
    departement: { type: 'varchar(255)', notNull: true },
    directeur_nom: { type: 'varchar(255)' },
    directeur_contact: { type: 'varchar(255)' },
    email: { type: 'varchar(255)' },
    telephone: { type: 'varchar(30)' },
    signature_path: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    secretaire_nom: { type: 'varchar(255)' },
    secretaire_prenom: { type: 'varchar(255)' },
    secretaire_telephone: { type: 'varchar(30)' },
    secretaire_email: { type: 'varchar(255)' },
    directeur_prenom: { type: 'varchar(255)' },
    directeur_sexe: { type: 'varchar(255)' }, // écart détecté vs setupDatabase.js
  });

  pgm.addConstraint('users', 'users_college_id_fkey', {
    foreignKeys: {
      columns: 'college_id',
      references: 'colleges(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createTable('otps', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true },
    code: { type: 'varchar(6)', notNull: true },
    expires_at: { type: 'timestamp', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
  });

  pgm.createTable('classes', {
    id: { type: 'uuid', primaryKey: true },
    college_id: {
      type: 'uuid',
      notNull: true,
      references: 'colleges(id)',
      onDelete: 'CASCADE',
    },
    niveau: { type: 'varchar(50)', notNull: true },
    serie: { type: 'varchar(20)', notNull: true },
    code: { type: 'varchar(80)', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
  });
  pgm.addConstraint('classes', 'uniq_classe_college', {
    unique: ['college_id', 'niveau', 'serie'],
  });

  pgm.createTable('eleves', {
    id: { type: 'uuid', primaryKey: true },
    classe_id: {
      type: 'uuid',
      notNull: true,
      references: 'classes(id)',
      onDelete: 'CASCADE',
    },
    matricule: { type: 'varchar(50)', notNull: true, unique: true },
    nom: { type: 'varchar(255)', notNull: true },
    prenom: { type: 'varchar(255)', notNull: true },
    sexe: { type: 'varchar(1)' },
    date_naissance: { type: 'date' },
    lieu_naissance: { type: 'varchar(255)' },
    nationalite: { type: 'varchar(255)' },
    adresse: { type: 'text' },
    telephone: { type: 'varchar(30)' },
    photo_path: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
  });

  pgm.createTable('brouillons_cartes', {
    id: { type: 'uuid', primaryKey: true },
    college_id: {
      type: 'uuid',
      notNull: true,
      references: 'colleges(id)',
      onDelete: 'CASCADE',
    },
    classe_id: {
      type: 'uuid',
      notNull: true,
      references: 'classes(id)',
      onDelete: 'CASCADE',
    },
    nom_brouillon: { type: 'varchar(255)', notNull: true },
    export_path: { type: 'text' },
    total_cartes: { type: 'integer' },
    status: { type: 'varchar(50)', default: 'draft' },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
  });

  pgm.createTable('access_keys', {
    id: { type: 'uuid', primaryKey: true },
    college_id: {
      type: 'uuid',
      notNull: true,
      references: 'colleges(id)',
      onDelete: 'CASCADE',
    },
    key_hash: { type: 'varchar(255)', notNull: true },
    type: { type: 'varchar(20)', notNull: true, default: 'free' },
    status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    issued_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    activated_at: { type: 'timestamp' },
    expires_at: { type: 'timestamp' },
  });

  pgm.createTable('observations', {
    id: { type: 'uuid', primaryKey: true },
    classe_id: {
      type: 'uuid',
      notNull: true,
      references: 'classes(id)',
      onDelete: 'CASCADE',
    },
    auteur_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    auteur_role: { type: 'varchar(50)', notNull: true },
    contenu: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    eleve_id: {
      type: 'uuid',
      references: 'eleves(id)',
      onDelete: 'SET NULL',
    },
    lu_par_admin: { type: 'boolean', default: false },
  });

  pgm.createTable('notifications_brouillon', {
    id: { type: 'uuid', primaryKey: true },
    college_id: {
      type: 'uuid',
      notNull: true,
      references: 'colleges(id)',
      onDelete: 'CASCADE',
    },
    classe_id: {
      type: 'uuid',
      references: 'classes(id)',
      onDelete: 'SET NULL',
    },
    sent_by: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'SET NULL',
    },
    sent_at: { type: 'timestamp', default: pgm.func('NOW()') },
    emails_sent: { type: 'integer', default: 0 },
  });

  pgm.createTable('notifications_cartes', {
    id: { type: 'uuid', primaryKey: true },
    college_id: {
      type: 'uuid',
      notNull: true,
      references: 'colleges(id)',
      onDelete: 'CASCADE',
    },
    classe_id: {
      type: 'uuid',
      references: 'classes(id)',
      onDelete: 'SET NULL',
    },
    sent_by: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'SET NULL',
    },
    sent_at: { type: 'timestamp', default: pgm.func('NOW()') },
    emails_sent: { type: 'integer', default: 0 },
    date_passage: { type: 'timestamp' },
  });

  // Table créée manuellement en Phase 5, absente de l'ancien setupDatabase.js.
  // ON DELETE SET NULL supposé par cohérence (colonnes nullable) — à confirmer.
  pgm.createTable('payments_kkiapay', {
    id: { type: 'uuid', primaryKey: true },
    college_id: {
      type: 'uuid',
      references: 'colleges(id)',
      onDelete: 'SET NULL',
    },
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'SET NULL',
    },
    transaction_id: { type: 'varchar(255)', notNull: true, unique: true },
    amount: { type: 'numeric', notNull: true },
    status: { type: 'varchar(50)', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
  });

  // Index
  pgm.createIndex('colleges', ['commune', 'departement'], { name: 'idx_colleges_commune' });
  pgm.createIndex('classes', 'college_id', { name: 'idx_classes_college' });
  pgm.createIndex('eleves', 'classe_id', { name: 'idx_eleves_classe' });
  pgm.createIndex('eleves', 'matricule', { name: 'idx_eleves_matricule' });
  pgm.createIndex('users', 'college_id', { name: 'idx_users_college' });
  pgm.createIndex('access_keys', 'college_id', { name: 'idx_access_keys_college' });
  pgm.createIndex('observations', 'classe_id', { name: 'idx_observations_classe' });
  pgm.createIndex('observations', 'lu_par_admin', {
    name: 'idx_observations_non_lues',
    where: 'lu_par_admin = false',
  });
  pgm.createIndex('notifications_brouillon', 'college_id', { name: 'idx_notif_brouillon_college' });
  pgm.createIndex('notifications_cartes', 'college_id', { name: 'idx_notif_cartes_college' });
};

export const down = () => {
  throw new Error('Rollback de la baseline non supporté — ne jamais exécuter down sur cette migration en prod.');
};