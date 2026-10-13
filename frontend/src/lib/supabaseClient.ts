import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const SIGNED_IN_TAB_KEY = 'taskflow_signed_in_tab';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const fallbackClient = {
  auth: {
    signInWithOAuth: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  },
} as any;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : fallbackClient;
