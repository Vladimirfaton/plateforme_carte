import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Observation {
  static async create({ classe_id, auteur_id, auteur_role, contenu }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO observations (id, classe_id, auteur_id, auteur_role, contenu, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [id, classe_id, auteur_id, auteur_role, contenu]
    );
    return result.rows[0];
  }

  static async findByClass(classeId) {
    const result = await query(
      `SELECT o.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom
       FROM observations o
       LEFT JOIN users u ON u.id = o.auteur_id
       WHERE o.classe_id = $1
       ORDER BY o.created_at DESC`,
      [classeId]
    );
    return result.rows;
  }
}

export default Observation;
