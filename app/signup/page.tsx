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

export default function SignUpPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)

  useEffect(() => {
    setProfile(getStoredProfile())

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const email = data.session?.user?.email || null
      const userId = data.session?.user?.id || null
      setSessionEmail(email)
      setSessionUserId(userId)

      if (userId) {
        router.replace('/app')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email || null
      const userId = session?.user?.id || null
      setSessionEmail(email)
      setSessionUserId(userId)

      if (userId) {
        router.replace('/app')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
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
            Get started
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create your sitesignal account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Save lead searches, audits, outreach, and call list activity in one place.
          </p>
        </div>

        <AuthForm initialMode="sign-up" redirectTo="/app" />
      </div>
    </main>
  )
}