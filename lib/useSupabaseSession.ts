'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { subscribeToAuthSession } from './supabaseSession'

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return subscribeToAuthSession((nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
  }, [])

  return {
    session,
    user: session?.user ?? null,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    loading,
  }
}
