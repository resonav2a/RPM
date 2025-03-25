import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Log for debugging - remove in production
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Key is set' : 'Key is missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL ERROR: Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
  alert('Configuration error: Please set up Supabase credentials in .env file');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);