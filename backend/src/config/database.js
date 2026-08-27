import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// ====== SUPABASE CLIENT ======
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ====== POSTGRESQL POOL (directe) ======
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,                      // nombre max de connexions simultanées dans le pool
  idleTimeoutMillis: 30000,     // ferme une connexion inactive après 30s
  connectionTimeoutMillis: 5000, // abandonne si aucune connexion dispo après 5s (évite un blocage silencieux)
});

pool.on('error', (err) => {
  console.error('Pool error:', err);
});

export const query = (text, params) => {
  return pool.query(text, params);
};

export default { supabase, pool, query };
