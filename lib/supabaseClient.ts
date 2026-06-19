import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { LockFunc } from '@supabase/auth-js'

const devAuthLock: LockFunc = async (_name, _acquireTimeout, fn) => fn()

export function getSupabaseConfigError(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

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

let supabaseInstance: SupabaseClient | null = null

function initSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    getSupabaseConfigError()
  ) {
    console.warn(`[supabase] ${getSupabaseConfigError()}`)
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      lock: process.env.NODE_ENV === 'development' ? devAuthLock : undefined,
    },
  })
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = initSupabaseClient()
  }
  return supabaseInstance
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})
