import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TRIAL_DURATION_DAYS = 330;
const RENEWAL_UNIT_YEARS = Number(process.env.ACCESS_KEY_UNIT_YEARS || 3);

function generatePlainKey(length = 12) {
  const bytes = crypto.randomBytes(length);
  let key = '';
  for (let i = 0; i < length; i++) key += CHARSET[bytes[i] % CHARSET.length];
  return key;
}

export class AccessKey {
  // `type` = 'essai' | 'renouvellement' — purement informatif/historique,
  // ne conditionne plus aucune fonctionnalité ni durée.
  static async createPending(collegeId, type = 'essai') {
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

  static async verifyPendingKey(collegeId, plainKey) {
    const pending = await this.findPendingByCollege(collegeId);
    if (!pending) return null;
    const match = await bcrypt.compare(plainKey, pending.key_hash);
    return match ? pending : null;
  }

  // Active la clé avec une durée explicite en jours.
  static async activate(keyId, durationDays) {
    const result = await query(
      `UPDATE access_keys
       SET status = 'active', activated_at = CURRENT_TIMESTAMP,
           expires_at = CURRENT_TIMESTAMP + ($2 || ' days')::INTERVAL
       WHERE id = $1
       RETURNING *`,
      [keyId, durationDays]
    );
    return result.rows[0];
  }

  // ==========================================================================
  // FONCTION UNIFIÉE — point d'entrée UNIQUE pour créer + activer une clé.
  // Utilisée par : activation initiale, paiement KKiaPay confirmé, et
  // renouvellement manuel admin (cash). Garantit que les 3 chemins produisent
  // exactement la même chose, sans duplication de logique.
  // ==========================================================================
  static async createAndActivate(collegeId, { type, durationDays }) {
    const { id, plainKey } = await this.createPending(collegeId, type);
    const activated = await this.activate(id, durationDays);
    return { ...activated, plainKey };
  }

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

  // Calcule le nombre de jours pour un renouvellement de `multiplier` unités.
  static renewalDurationDays(multiplier = 1) {
    return RENEWAL_UNIT_YEARS * multiplier * 365;
  }
}

export { TRIAL_DURATION_DAYS, RENEWAL_UNIT_YEARS };