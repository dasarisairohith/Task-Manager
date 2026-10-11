import { createClient } from '@supabase/supabase-js'

export const SIGNED_IN_TAB_KEY = 'taskflow_signed_in_tab'

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

// Keep the UI loadable before credentials are supplied, but never silently use
// demo credentials. Authentication/actions must remain disabled until configured.
export const isSupabaseConfigured = Boolean(rawSupabaseUrl && supabaseAnonKey)

const supabaseUrl = rawSupabaseUrl
  ? rawSupabaseUrl.replace(/\/+$/, '').replace(/\/(rest\/v1|auth\/v1)\/?$/, '')
  : 'https://your-project.supabase.co'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'missing-supabase-anon-key'
)
