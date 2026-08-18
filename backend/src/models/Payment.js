import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Payment {
  static async findByTransactionId(transactionId) {
    const result = await query('SELECT * FROM payments_kkiapay WHERE transaction_id = $1', [transactionId]);
    return result.rows[0];
  }

  static async create({ collegeId, userId, transactionId, amount, status }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO payments_kkiapay (id, college_id, user_id, transaction_id, amount, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (transaction_id) DO NOTHING
       RETURNING *`,
      [id, collegeId, userId, transactionId, amount, status]
    );
    return result.rows[0];
  }
}