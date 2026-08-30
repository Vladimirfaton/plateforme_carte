import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class RenouvellementCle {
  static async enregistrer({ collegeId, accessKeyId, methode, annees, validePar = null }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO renouvellements_cles (id, college_id, access_key_id, methode, annees, valide_par, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, collegeId, accessKeyId, methode, annees, validePar]
    );
    return result.rows[0];
  }

  static async parCollege(collegeId) {
    const result = await query(
      `SELECT r.*, u.nom AS valide_par_nom, u.prenom AS valide_par_prenom
       FROM renouvellements_cles r
       LEFT JOIN users u ON u.id = r.valide_par
       WHERE r.college_id = $1
       ORDER BY r.created_at DESC`,
      [collegeId]
    );
    return result.rows;
  }
}