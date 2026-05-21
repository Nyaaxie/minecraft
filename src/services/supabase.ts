import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Please check your .env file. ' +
    'The application will not be able to interact with the backend.'
  );
}

// We provide empty strings as fallbacks to prevent a crash, 
// though Supabase will still fail on actual requests.
export const supabase = createClient(
  supabaseUrl || 'https://grudlgdrksbucmjbghxi.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydWRsZ2Rya3NidWNtamJnaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTkwNjUsImV4cCI6MjA5NDgzNTA2NX0.JlvHr4HBX-oRZIGPMbQgYXZr3xWS-Rl5h5eW3rsgE8M',
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
