import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Group {
  static async create(classId, lettre) {
    const id = uuidv4();
    const createdAt = new Date();

    const result = await query(
      `INSERT INTO groupes (id, classe_id, lettre, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, classId, lettre, createdAt]
    );

    return result.rows[0];
  }

  static async findByClass(classId) {
    const result = await query(
      `SELECT * FROM groupes WHERE classe_id = $1 ORDER BY lettre ASC`,
      [classId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM groupes WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM groupes WHERE id = $1', [id]);
  }

  // Créer tous les groupes A-G pour une classe
  static async createDefaultGroups(classId) {
    const lettres = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const groups = [];

    for (const lettre of lettres) {
      const group = await this.create(classId, lettre);
      groups.push(group);
    }

    return groups;
  }
}
