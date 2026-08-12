import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Class {
  static async create(collegeId, data) {
    const { code, niveau, effectif_previsionnel } = data;
    const id = uuidv4();
    const createdAt = new Date();

    const result = await query(
      `INSERT INTO classes (id, college_id, code, niveau, effectif_previsionnel, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, collegeId, code, niveau, effectif_previsionnel, createdAt]
    );

    return result.rows[0];
  }

  static async findByCollege(collegeId) {
    const result = await query(
      `SELECT * FROM classes WHERE college_id = $1 ORDER BY code ASC`,
      [collegeId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM classes WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { code, niveau, effectif_previsionnel } = data;

    const result = await query(
      `UPDATE classes 
       SET code = $1, niveau = $2, effectif_previsionnel = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [code, niveau, effectif_previsionnel, id]
    );

    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM classes WHERE id = $1', [id]);
  }
}
