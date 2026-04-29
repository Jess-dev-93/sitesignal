'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthForm from '../../components/AuthForm'
import MainNavbar from '../../components/layout/MainNavbar'
import { supabase } from '../../lib/supabaseClient'
import {
  DEFAULT_PROFILE,
  getStoredProfile,
  UserProfile,
} from '../../lib/profileStorage'

export default function SignInPage() {
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let mounted = true

    setProfile(getStoredProfile())

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      const email = session?.user?.email || null
      const userId = session?.user?.id || null

      setSessionEmail(email)
      setSessionUserId(userId)
      setCheckingSession(false)

      if (userId) {
        window.location.href = '/app'
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      const email = session?.user?.email || null
      const userId = session?.user?.id || null

      setSessionEmail(email)
      setSessionUserId(userId)
      setCheckingSession(false)

      if (userId) {
        window.location.href = '/app'
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSessionEmail(null)
    setSessionUserId(null)
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.13),transparent_55%),linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
        <MainNavbar
          sessionEmail={sessionEmail}
          isLoggedIn={!!sessionUserId}
          profile={profile}
          onSignOut={handleSignOut}
          appHref="/app"
        />

        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-6 py-5 text-sm text-slate-300 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            Checking session...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.13),transparent_55%),linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
      <MainNavbar
        sessionEmail={sessionEmail}
        isLoggedIn={!!sessionUserId}
        profile={profile}
        onSignOut={handleSignOut}
        appHref="/app"
      />

      <div className="mx-auto max-w-xl px-4 py-10 md:px-6 md:py-16">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            Welcome back
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Sign in to sitesignal
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Access your leads, audits, outreach history, and call list.
          </p>
        </div>

        <AuthForm
          initialMode="sign-in"
          redirectTo="/app"
          onSignedIn={() => {
            window.location.href = '/app'
          }}
        />
      </div>
    </main>
  )
}