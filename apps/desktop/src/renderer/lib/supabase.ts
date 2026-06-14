import { createClient } from '@supabase/supabase-js';
import Store from 'electron-store';

// We'll create the store outside so it can be used for session persistence
const store = new Store({ name: 'print-sathi-session' });

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => store.get(key) as string | null,
      setItem: (key, value) => store.set(key, value),
      removeItem: (key) => store.delete(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desktop app doesn't use magic links in the same way
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
