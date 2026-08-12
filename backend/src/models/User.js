import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class User {
  static async create(email, password, role = 'admin') {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date();

    const result = await query(
      `INSERT INTO users (id, email, password_hash, role, created_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, role, created_at`,
      [id, email, hashedPassword, role, createdAt]
    );

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [id]
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
}
