import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Student {
  static async create(groupeId, data) {
    const {
      matricule,
      nom,
      prenom,
      date_naissance,
      sexe,
      lieu_naissance,
      nationalite,
      adresse,
      telephone,
      photo_path,
    } = data;

    const id = uuidv4();
    const createdAt = new Date();

    const result = await query(
      `INSERT INTO eleves (
        id, groupe_id, matricule, nom, prenom, date_naissance, sexe, 
        lieu_naissance, nationalite, adresse, telephone, photo_path, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        id,
        groupeId,
        matricule,
        nom,
        prenom,
        date_naissance,
        sexe,
        lieu_naissance,
        nationalite,
        adresse,
        telephone,
        photo_path,
        createdAt,
      ]
    );

    return result.rows[0];
  }

  static async findByGroup(groupeId) {
    const result = await query(
      `SELECT * FROM eleves WHERE groupe_id = $1 ORDER BY nom ASC, prenom ASC`,
      [groupeId]
    );
    return result.rows;
  }

  static async findByClass(classId) {
    const result = await query(
      `SELECT e.* FROM eleves e
       JOIN groupes g ON e.groupe_id = g.id
       WHERE g.classe_id = $1
       ORDER BY e.nom ASC, e.prenom ASC`,
      [classId]
    );
    return result.rows;
  }

  static async findByCollegeAndClass(collegeId, classId) {
    const result = await query(
      `SELECT e.* FROM eleves e
       JOIN groupes g ON e.groupe_id = g.id
       JOIN classes c ON g.classe_id = c.id
       WHERE c.college_id = $1 AND c.id = $2
       ORDER BY e.nom ASC, e.prenom ASC`,
      [collegeId, classId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM eleves WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByMatricule(matricule) {
    const result = await query(
      'SELECT * FROM eleves WHERE matricule = $1',
      [matricule]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const {
      nom,
      prenom,
      date_naissance,
      sexe,
      nationalite,
      adresse,
      telephone,
    } = data;

    const result = await query(
      `UPDATE eleves 
       SET nom = $1, prenom = $2, date_naissance = $3, sexe = $4, 
           nationalite = $5, adresse = $6, telephone = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [nom, prenom, date_naissance, sexe, nationalite, adresse, telephone, id]
    );

    return result.rows[0];
  }

  static async updatePhoto(id, photoPath) {
    const result = await query(
      `UPDATE eleves SET photo_path = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [photoPath, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM eleves WHERE id = $1', [id]);
  }

  static async deleteByMatricule(matricule) {
    await query('DELETE FROM eleves WHERE matricule = $1', [matricule]);
  }

  static async bulkCreate(groupeId, studentsData) {
    const results = [];
    for (const data of studentsData) {
      const student = await this.create(groupeId, data);
      results.push(student);
    }
    return results;
  }

  static async findAllByCollege(collegeId) {
    const result = await query(
      `SELECT e.* FROM eleves e
       JOIN groupes g ON e.groupe_id = g.id
       JOIN classes c ON g.classe_id = c.id
       WHERE c.college_id = $1
       ORDER BY c.code ASC, g.lettre ASC, e.nom ASC`,
      [collegeId]
    );
    return result.rows;
  }
}
