import { pool } from './src/config/database.js';
import logger from './src/config/logger.js';

const resetDatabase = async () => {
  try {
    logger.info('🔄 Suppression de toutes les tables...');

    // Supprimer les tables dans l'ordre inverse des dépendances
    const tablesToDrop = [
      'brouillons_cartes',
      'eleves',
      'groupes',
      'classes',
      'colleges',
      'users'
    ];

    for (const table of tablesToDrop) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      logger.info(`✓ Table ${table} supprimée`);
    }

    logger.info('✅ Base de données réinitialisée avec succès');
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Erreur lors de la réinitialisation: ${error.message}`);
    process.exit(1);
  }
};

resetDatabase();
