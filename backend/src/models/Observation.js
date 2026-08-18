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

  static async countUnread() {
    const result = await query(
      `SELECT COUNT(*) AS count FROM observations WHERE lu_par_admin = false`
    );
    return parseInt(result.rows[0].count, 10);
  }

  static async findUnread(limit = 20) {
    const result = await query(
      `SELECT
         o.id, o.contenu, o.created_at, o.auteur_role, o.lu_par_admin,
         u.nom    AS auteur_nom,
         u.prenom AS auteur_prenom,
         c.id     AS classe_id,
         c.code   AS classe_code,
         col.id   AS college_id,
         col.nom  AS college_nom
       FROM observations o
       LEFT JOIN users   u   ON u.id   = o.auteur_id
       LEFT JOIN classes c   ON c.id   = o.classe_id
       LEFT JOIN colleges col ON col.id = c.college_id
       WHERE o.lu_par_admin = false
       ORDER BY o.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  static async markAllAsRead() {
    const result = await query(
      `UPDATE observations SET lu_par_admin = true WHERE lu_par_admin = false`
    );
    return result.rowCount;
  }

  static async findById(id) {
    const result = await query(
      `SELECT o.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom
       FROM observations o
       LEFT JOIN users u ON u.id = o.auteur_id
       WHERE o.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async deleteById(id) {
    await query(`DELETE FROM observations WHERE id = $1`, [id]);
  }
}

export default Observation;