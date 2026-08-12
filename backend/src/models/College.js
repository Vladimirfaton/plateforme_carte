import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class College {
  static async create(data) {
    const {
      nom, commune, departement, directeur_nom,
      directeur_contact, email, telephone,
    } = data;

    const id = uuidv4();
    const createdAt = new Date();

    const result = await query(
      `INSERT INTO colleges (
        id, nom, commune, departement, directeur_nom, directeur_contact,
        email, telephone, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, nom, commune, departement, directeur_nom, directeur_contact, email, telephone, createdAt]
    );

    return result.rows[0];
  }

  static async findAll() {
    const result = await query(`SELECT * FROM colleges ORDER BY nom ASC`);
    return result.rows;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM colleges WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByCommune(commune, departement) {
    const result = await query(
      `SELECT co.*,
              COUNT(DISTINCT e.id)::int AS students_count,
              0 AS cards_generated
       FROM colleges co
       LEFT JOIN classes cl ON cl.college_id = co.id
       LEFT JOIN eleves e ON e.classe_id = cl.id
       WHERE co.commune = $1 AND co.departement = $2
       GROUP BY co.id
       ORDER BY co.nom ASC`,
      [commune, departement]
    );
    return result.rows;
  }

  static async update(id, data) {
    const { nom, directeur_nom, directeur_contact, email, telephone } = data;

    const result = await query(
      `UPDATE colleges
       SET nom = $1, directeur_nom = $2, directeur_contact = $3,
           email = $4, telephone = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [nom, directeur_nom, directeur_contact, email, telephone, id]
    );

    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM colleges WHERE id = $1', [id]);
  }

  static async uploadSignature(collegeId, signaturePath) {
    const result = await query(
      `UPDATE colleges SET signature_path = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [signaturePath, collegeId]
    );
    return result.rows[0];
  }
}