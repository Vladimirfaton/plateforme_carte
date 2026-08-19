import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateUsernameSuggestion } from '../utils/username.js';

export class User {
  static async create(email, password, role = 'admin') {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (id, email, password_hash, role, status, created_at)
       VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP)
       RETURNING id, email, role, created_at`,
      [id, email, hashedPassword, role]
    );

    return result.rows[0];
  }

  // Compte directeur/secrétaire créé par l'admin — pas de mot de passe/username
  // tant que l'activation (clé d'accès) n'a pas été faite.
  static async createManagementAccount({ collegeId, role, nom, prenom, telephone, email, username = null }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, role, college_id, nom, prenom, telephone, username, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_activation', CURRENT_TIMESTAMP)
       RETURNING id, email, role, college_id, nom, prenom, username, status`,
      [id, email, role, collegeId, nom, prenom, telephone, username]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `SELECT id, email, role, college_id, username, nom, prenom, telephone, status, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Directeur + secrétaire d'un collège donné
  static async findByCollege(collegeId) {
    const result = await query(
      `SELECT id, email, role, username, nom, prenom, telephone, status
       FROM users WHERE college_id = $1 AND role IN ('directeur', 'secretaire')`,
      [collegeId]
    );
    return result.rows;
  }

  static async usernameExists(username) {
    const result = await query('SELECT 1 FROM users WHERE username = $1', [username]);
    return result.rowCount > 0;
  }

  // Propose un nom d'utilisateur unique en ajoutant un suffixe numérique
  // si nécessaire. Ex: jeandupont, jeandupont1, jeandupont2...
  static async suggestUniqueUsername(prenom, nom) {
    const base = generateUsernameSuggestion(prenom || '', nom || '');
    let username = base;
    let counter = 1;
    while (await this.usernameExists(username)) {
      username = `${base}${counter}`;
      counter += 1;
      if (counter > 10000) break; // safety
    }
    return username;
  }

  // Première activation : définit username + mot de passe, passe le compte à 'active'
  static async activateAccount(userId, username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      `UPDATE users
       SET username = $1, password_hash = $2, status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, role, college_id, username, status`,
      [username, hashedPassword, userId]
    );
    return result.rows[0];
  }

  // Réactivation après expiration : le mot de passe existant est conservé,
  // seul le statut repasse à 'active' (appelé après vérification clé + mdp).
  static async reactivate(userId) {
    const result = await query(
      `UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, role, college_id, username, status`,
      [userId]
    );
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email',
      [hashedPassword, userId]
    );
    return result.rows[0];
  }
    // Réactive d'un coup directeur + secrétaire d'un collège (clé partagée = un seul paiement)
  static async reactivateByCollege(collegeId) {
    const result = await query(
      `UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE college_id = $1 AND role IN ('directeur', 'secretaire')
       RETURNING id, email, role, college_id, username, nom, prenom, status`,
      [collegeId]
    );
    return result.rows;
  }
}