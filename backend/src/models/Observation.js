import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Observation {
  static async create({ classe_id, auteur_id, auteur_role, contenu, eleve_id = null }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO observations (id, classe_id, auteur_id, auteur_role, contenu, eleve_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [id, classe_id, auteur_id, auteur_role, contenu, eleve_id]
    );
    return result.rows[0];
  }

  static async findByClass(classeId) {
    const result = await query(
      `SELECT o.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom,
              e.nom AS eleve_nom, e.prenom AS eleve_prenom, e.matricule AS eleve_matricule
       FROM observations o
       LEFT JOIN users u ON u.id = o.auteur_id
       LEFT JOIN eleves e ON e.id = o.eleve_id
       WHERE o.classe_id = $1
       ORDER BY o.created_at DESC`,
      [classeId]
    );
    return result.rows;
  }
}

export default Observation;