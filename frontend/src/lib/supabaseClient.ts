import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'

// Normalize accidental REST/Auth endpoint values entered in hosting settings.
// Supabase createClient expects the project root URL, not /rest/v1 or /auth/v1.
const supabaseUrl = rawSupabaseUrl
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/(rest\/v1|auth\/v1)\/?$/, '')

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
