import { pool } from '../config/database.js';
import logger from '../config/logger.js';

const createTables = async () => {
  try {
    logger.info('Creating database tables...');

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    await pool.query('DROP TABLE IF EXISTS brouillons_cartes CASCADE');
    await pool.query('DROP TABLE IF EXISTS eleves CASCADE');
    await pool.query('DROP TABLE IF EXISTS groupes CASCADE');
    await pool.query('DROP TABLE IF EXISTS classes CASCADE');

    await pool.query(`
      CREATE TABLE classes (
        id UUID PRIMARY KEY,
        college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        niveau VARCHAR(50) NOT NULL,
        serie VARCHAR(20) NOT NULL,
        code VARCHAR(80) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uniq_classe_college UNIQUE (college_id, niveau, serie)
      )
    `);

    await pool.query(`
      CREATE TABLE eleves (
        id UUID PRIMARY KEY,
        classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        matricule VARCHAR(50) UNIQUE NOT NULL,
        nom VARCHAR(255) NOT NULL,
        prenom VARCHAR(255) NOT NULL,
        sexe VARCHAR(1),
        date_naissance DATE,
        lieu_naissance VARCHAR(255),
        nationalite VARCHAR(255),
        adresse TEXT,
        telephone VARCHAR(20),
        photo_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE brouillons_cartes (
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

    await pool.query('CREATE INDEX IF NOT EXISTS idx_colleges_commune ON colleges(commune, departement)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_classes_college ON classes(college_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_eleves_classe ON eleves(classe_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_eleves_matricule ON eleves(matricule)');

    logger.info('Database setup completed');
  } catch (error) {
    logger.error(`Database setup error: ${error.message}`);
    process.exit(1);
  }
};

createTables().then(() => {
  pool.end();
  process.exit(0);
});