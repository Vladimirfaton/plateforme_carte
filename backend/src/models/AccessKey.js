import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Alphabet sans caractères ambigus (pas de 0/O, 1/I/L)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FREE_DURATION_DAYS = 155;
const PAID_DURATION_DAYS = 365;

function generatePlainKey(length = 12) {
  const bytes = crypto.randomBytes(length);
  let key = '';
  for (let i = 0; i < length; i++) key += CHARSET[bytes[i] % CHARSET.length];
  return key;
}

export class AccessKey {
  // Crée une clé en attente (envoyée par mail) pour un collège.
  // type = 'free' (155j, première activation) ou 'paid' (365j, renouvellement)
  static async createPending(collegeId, type = 'free') {
    const plainKey = generatePlainKey();
    const keyHash = await bcrypt.hash(plainKey, 10);
    const id = uuidv4();

    await query(
      `INSERT INTO access_keys (id, college_id, key_hash, type, status, issued_at)
       VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)`,
      [id, collegeId, keyHash, type]
    );

    return { id, plainKey, type };
  }

  static async findPendingByCollege(collegeId) {
    const result = await query(
      `SELECT * FROM access_keys
       WHERE college_id = $1 AND status = 'pending'
       ORDER BY issued_at DESC LIMIT 1`,
      [collegeId]
    );
    return result.rows[0];
  }

  static async findActiveByCollege(collegeId) {
    const result = await query(
      `SELECT * FROM access_keys
       WHERE college_id = $1 AND status = 'active'
       ORDER BY activated_at DESC LIMIT 1`,
      [collegeId]
    );
    return result.rows[0];
  }

  // Vérifie la clé saisie par l'utilisateur contre la clé pending du collège
  static async verifyPendingKey(collegeId, plainKey) {
    const pending = await this.findPendingByCollege(collegeId);
    if (!pending) return null;
    const match = await bcrypt.compare(plainKey, pending.key_hash);
    return match ? pending : null;
  }

  // Active la clé (première activation ou renouvellement) et fixe l'expiration
  static async activate(keyId, type) {
    const days = type === 'paid' ? PAID_DURATION_DAYS : FREE_DURATION_DAYS;
    const result = await query(
      `UPDATE access_keys
       SET status = 'active', activated_at = CURRENT_TIMESTAMP,
           expires_at = CURRENT_TIMESTAMP + ($2 || ' days')::INTERVAL
       WHERE id = $1
       RETURNING *`,
      [keyId, days]
    );
    return result.rows[0];
  }

    // ⚠️ Changement de contrat : retourne désormais un tableau de college_id
  // (au lieu d'un nombre) pour permettre l'envoi ciblé des emails d'expiration.
  static async expireOutdatedKeys() {
    const expired = await query(
      `UPDATE access_keys SET status = 'expired'
       WHERE status = 'active' AND expires_at < (NOW() AT TIME ZONE 'UTC')
       RETURNING college_id`
    );

    let collegeIds = [];
    if (expired.rows.length > 0) {
      collegeIds = [...new Set(expired.rows.map((r) => r.college_id))];
      await query(
        `UPDATE users SET status = 'expired', updated_at = CURRENT_TIMESTAMP
         WHERE college_id = ANY($1::uuid[]) AND role IN ('directeur', 'secretaire')`,
        [collegeIds]
      );
    }

    return collegeIds;
  }
}

export { FREE_DURATION_DAYS, PAID_DURATION_DAYS };