'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from './supabaseClient'

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadInitialSession() {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession()

        if (cancelled) return

        if (error) {
          console.error(
            'Failed to load Supabase session:',
            error
          )

          setSession(null)
          setLoading(false)

          return
        }

        setSession(data.session ?? null)
        setLoading(false)
      } catch (error) {
        if (cancelled) return

        console.error(
          'Unexpected Supabase session error:',
          error
        )

        setSession(null)
        setLoading(false)
      }
    }

    void loadInitialSession()

    const {
      data: {
        subscription,
      },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (cancelled) return

        setSession(nextSession)
        setLoading(false)
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return {
    session,

    user:
      session?.user ?? null,

    userId:
      session?.user?.id ?? null,

    email:
      session?.user?.email ?? null,

    loading,
  }
}