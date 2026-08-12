import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Class {
  static buildCode(niveau, serie) {
    return `${niveau.trim()}-${serie.trim().toUpperCase()}`;
  }

  static async create(collegeId, { niveau, serie }) {
    const id = uuidv4();
    const code = this.buildCode(niveau, serie);

    const result = await query(
      `INSERT INTO classes (id, college_id, niveau, serie, code, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, collegeId, niveau.trim(), serie.trim().toUpperCase(), code]
    );

    return result.rows[0];
  }

  static async findByCollege(collegeId) {
    const result = await query(
      `SELECT c.*, COUNT(e.id)::int AS effectif
       FROM classes c
       LEFT JOIN eleves e ON e.classe_id = c.id
       WHERE c.college_id = $1
       GROUP BY c.id
       ORDER BY c.niveau ASC, c.serie ASC`,
      [collegeId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT c.*, COUNT(e.id)::int AS effectif
       FROM classes c
       LEFT JOIN eleves e ON e.classe_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    return result.rows[0];
  }

  static async findDuplicate(collegeId, niveau, serie, excludeId = null) {
    const params = [collegeId, niveau.trim(), serie.trim().toUpperCase()];
    let sql = `SELECT id FROM classes WHERE college_id = $1 AND niveau = $2 AND serie = $3`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id <> $4`;
    }
    const result = await query(sql, params);
    return result.rows[0];
  }

  static async update(id, { niveau, serie }) {
    const code = this.buildCode(niveau, serie);
    const result = await query(
      `UPDATE classes
       SET niveau = $1, serie = $2, code = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [niveau.trim(), serie.trim().toUpperCase(), code, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM classes WHERE id = $1', [id]);
  }
}