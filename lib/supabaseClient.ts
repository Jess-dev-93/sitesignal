import { createClient } from '@supabase/supabase-js'
import type { LockFunc } from '@supabase/auth-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function getSupabaseConfigError(): string | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  }

  const normalised = supabaseUrl.replace(/\/$/, '')
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(normalised)) {
    return 'NEXT_PUBLIC_SUPABASE_URL must look like https://YOUR_PROJECT_REF.supabase.co'
  }

  return null
}

export const supabaseConfigError = getSupabaseConfigError()

const devAuthLock: LockFunc = async (_name, _acquireTimeout, fn) => fn()

if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'development' &&
  supabaseConfigError
) {
  console.warn(`[supabase] ${supabaseConfigError}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    lock: process.env.NODE_ENV === 'development' ? devAuthLock : undefined,
  },
})
