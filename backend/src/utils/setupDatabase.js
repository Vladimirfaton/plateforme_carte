import { pool } from '../config/database.js';
import logger from '../config/logger.js';

const createTables = async () => {
  try {
    logger.info('Creating database tables...');

    // Table users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Table users créée');

    // Table colleges
    await pool.query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id UUID PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        commune VARCHAR(255) NOT NULL,
        departement VARCHAR(255) NOT NULL,
        directeur_nom VARCHAR(255),
        directeur_contact VARCHAR(255),
        email VARCHAR(255),
        telephone VARCHAR(20),
        signature_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Table colleges créée');

    // Table classes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY,
        college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL,
        niveau VARCHAR(50),
        effectif_previsionnel INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Table classes créée');

    // Table groupes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groupes (
        id UUID PRIMARY KEY,
        classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        lettre VARCHAR(1) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Table groupes créée');

    // Table eleves
    await pool.query(`
      CREATE TABLE IF NOT EXISTS eleves (
        id UUID PRIMARY KEY,
        groupe_id UUID NOT NULL REFERENCES groupes(id) ON DELETE CASCADE,
        matricule VARCHAR(50) UNIQUE NOT NULL,
        nom VARCHAR(255) NOT NULL,
        prenom VARCHAR(255) NOT NULL,
        date_naissance DATE,
        sexe VARCHAR(1),
        nationalite VARCHAR(255),
        adresse TEXT,
        telephone VARCHAR(20),
        photo_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Table eleves créée');

    // Table brouillons_cartes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brouillons_cartes (
        id UUID PRIMARY KEY,
        college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        nom_brouillon VARCHAR(255) NOT NULL,
        export_path TEXT,
        total_cartes INTEGER,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Table brouillons_cartes créée');

    // Créer indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_colleges_commune ON colleges(commune, departement)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_classes_college ON classes(college_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_groupes_classe ON groupes(classe_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_eleves_groupe ON eleves(groupe_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_eleves_matricule ON eleves(matricule)');
    logger.info('✓ Indexes créés');

    logger.info('✅ Database setup completed successfully');
  } catch (error) {
    logger.error(`Database setup error: ${error.message}`);
    process.exit(1);
  }
};

createTables().then(() => {
  pool.end();
  process.exit(0);
});
