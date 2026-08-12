import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class CardDraft {
  static async create(collegeId, classId, data) {
    const { nom_brouillon, export_path, total_cartes } = data;
    const id = uuidv4();
    const createdAt = new Date();

    const result = await query(
      `INSERT INTO brouillons_cartes (
        id, college_id, classe_id, nom_brouillon, export_path, total_cartes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, collegeId, classId, nom_brouillon, export_path, total_cartes, createdAt]
    );

    return result.rows[0];
  }

  static async findByCollege(collegeId) {
    const result = await query(
      `SELECT * FROM brouillons_cartes WHERE college_id = $1 ORDER BY created_at DESC`,
      [collegeId]
    );
    return result.rows;
  }

  static async findByClass(classId) {
    const result = await query(
      `SELECT * FROM brouillons_cartes WHERE classe_id = $1 ORDER BY created_at DESC`,
      [classId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM brouillons_cartes WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM brouillons_cartes WHERE id = $1', [id]);
  }

  static async updateStatus(id, status) {
    const result = await query(
      `UPDATE brouillons_cartes SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }
}
