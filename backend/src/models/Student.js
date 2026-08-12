import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
const CHAMPS = `
  id, classe_id, matricule, nom, prenom, sexe,
  TO_CHAR(date_naissance, 'YYYY-MM-DD') AS date_naissance,
  lieu_naissance, nationalite, adresse, telephone, photo_path,
  created_at, updated_at
`;

export class Student {
  static async create(classeId, data) {
    const {
      matricule, nom, prenom, sexe, date_naissance,
      lieu_naissance, nationalite, adresse, telephone, photo_path,
    } = data;

    const id = uuidv4();

    const result = await query(
      `INSERT INTO eleves (
        id, classe_id, matricule, nom, prenom, sexe, date_naissance,
        lieu_naissance, nationalite, adresse, telephone, photo_path, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
       RETURNING *`,
      [
        id, classeId, matricule, nom, prenom, sexe, date_naissance || null,
        lieu_naissance || null, nationalite || null, adresse || null,
        telephone || null, photo_path || null,
      ]
    );

    return result.rows[0];
  }

  static async findByClass(classId) {
    const result = await query(
      `SELECT ${CHAMPS} FROM eleves WHERE classe_id = $1 ORDER BY nom ASC, prenom ASC`,
      [classId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(`SELECT ${CHAMPS} FROM eleves WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async findByMatricule(matricule) {
    const result = await query(`SELECT ${CHAMPS} FROM eleves WHERE matricule = $1`, [matricule]);
    return result.rows[0];
  }

static async findAllByCollege(collegeId) {
    const result = await query(
      `SELECT e.id, e.classe_id, e.matricule, e.nom, e.prenom, e.sexe,
              TO_CHAR(e.date_naissance, 'YYYY-MM-DD') AS date_naissance,
              e.lieu_naissance, e.nationalite, e.adresse, e.telephone, e.photo_path,
              c.code AS classe_code
       FROM eleves e
       JOIN classes c ON e.classe_id = c.id
       WHERE c.college_id = $1
       ORDER BY c.niveau ASC, c.serie ASC, e.nom ASC`,
      [collegeId]
    );
    return result.rows;
  }
}