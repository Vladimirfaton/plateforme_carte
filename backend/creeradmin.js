import bcrypt from 'bcryptjs';
import { query } from './src/config/database.js';
import { v4 as uuidv4 } from 'uuid';

async function createAdmin() {
  try {
    const email = 'vladimirfaton@gmail.com';
    const password = 'Vladimir456';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO users (id, email, password_hash, role, created_at) 
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, email, role`,
      [id, email, hashedPassword, 'admin']
    );
    
    console.log('✅ Admin créé:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createAdmin();