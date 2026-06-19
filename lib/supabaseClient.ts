import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { LockFunc } from '@supabase/auth-js'

const devAuthLock: LockFunc = async (_name, _acquireTimeout, fn) => fn()

export function getSupabaseConfigError(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy your site.'
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
  const configError = getSupabaseConfigError()
  if (configError) {
    throw new Error(configError)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
