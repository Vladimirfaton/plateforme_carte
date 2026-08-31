import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class College {
  static async create(data) {
    const {
      nom, commune, departement, directeur_nom,
      directeur_prenom, directeur_sexe,
      directeur_contact, email, telephone, slogan, adresse_postale,
      secretaire_nom, secretaire_prenom, secretaire_telephone, secretaire_email,
    } = data;

    const id = uuidv4();
    const createdAt = new Date();

    const result = await query(
      `INSERT INTO colleges (
        id, nom, commune, departement, directeur_nom, directeur_contact,
        directeur_prenom, directeur_sexe, email, telephone, slogan, adresse_postale, secretaire_nom, secretaire_prenom, secretaire_telephone,
        secretaire_email, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        id, nom, commune, departement, directeur_nom, directeur_contact, directeur_prenom || null,
        directeur_sexe || null, email, telephone, slogan || null, adresse_postale || null,
        secretaire_nom || null, secretaire_prenom || null, secretaire_telephone || null,
        secretaire_email || null, createdAt,
      ]
    );

    return result.rows[0];
  }

  static async findAll() {
    const result = await query(
      `SELECT co.*,
              COALESCE(COUNT(DISTINCT e.id), 0)::int AS students_count,
              COALESCE(COUNT(DISTINCT e.id), 0)::int AS cards_generated
       FROM colleges co
       LEFT JOIN classes cl ON cl.college_id = co.id
       LEFT JOIN eleves e ON e.classe_id = cl.id
       GROUP BY co.id
       ORDER BY co.created_at ASC`,
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM colleges WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByCommune(commune, departement) {
    const result = await query(
      `SELECT co.*,
              COALESCE(COUNT(DISTINCT e.id), 0)::int AS students_count,
              COALESCE(COUNT(DISTINCT e.id), 0)::int AS cards_generated
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

  // COALESCE : permet des mises à jour partielles (ex: uniquement les champs
  // secrétaire depuis createManagementAccounts) sans écraser le reste.
  static async update(id, data) {
    const {
      nom, directeur_nom, directeur_contact, email, telephone,
      directeur_prenom, directeur_sexe, slogan, adresse_postale,
      secretaire_nom, secretaire_prenom, secretaire_telephone, secretaire_email,
    } = data;

    const result = await query(
      `UPDATE colleges
       SET nom = COALESCE($1, nom),
           directeur_nom = COALESCE($2, directeur_nom),
           directeur_prenom = COALESCE($3, directeur_prenom),
           directeur_sexe = COALESCE($4, directeur_sexe),
           directeur_contact = COALESCE($5, directeur_contact),
           email = COALESCE($6, email),
           telephone = COALESCE($7, telephone),
           slogan = COALESCE($8, slogan),
           adresse_postale = COALESCE($9, adresse_postale),
           secretaire_nom = COALESCE($10, secretaire_nom),
           secretaire_prenom = COALESCE($11, secretaire_prenom),
           secretaire_telephone = COALESCE($12, secretaire_telephone),
           secretaire_email = COALESCE($13, secretaire_email),
           updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        nom, directeur_nom, directeur_prenom, directeur_sexe, directeur_contact, email, telephone, slogan, adresse_postale,
        secretaire_nom, secretaire_prenom, secretaire_telephone, secretaire_email, id,
      ]
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