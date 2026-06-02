import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn('⚠️  Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
}

// Usamos la service_role key porque el backend es de confianza
// (NUNCA exponer esta key en el frontend)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);
