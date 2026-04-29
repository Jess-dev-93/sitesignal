'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import MainNavbar from '../../../components/layout/MainNavbar'
import ProfileModal from '../../../components/profile/ProfileModal'
import OnboardingModal from '../../../components/OnboardingModal'
import UsageLimitBanner from '../../../components/UsageLimitBanner'
import LeadFinderWorkspace from '../../../components/LeadFinderWorkspace'
import {
  DEFAULT_PROFILE,
  getStoredProfile,
  saveStoredProfile,
  UserProfile,
} from '../../../lib/profileStorage'

const ONBOARDING_KEY = 'siteSignalOnboardingComplete'

type WorkspaceLead = {
  title?: string
  url?: string
  domain?: string
  leadTemp?: string
  opportunityScore?: number
  estimatedValue?: string
  problems?: string[]
  scores?: {
    overall?: number
    mobile?: {
      performance?: number
      seo?: number
      accessibility?: number
      bestPractices?: number
    }
    desktop?: {
      performance?: number
    }
  }
}

function normaliseLeadUrl(lead: WorkspaceLead) {
  const raw = lead.url || lead.domain || ''
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return `https://${raw}`
}

export default function LeadsPage() {
  const router = useRouter()

  const [sessionEmail, setSessionEmail]   = useState<string | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked]     = useState(false)

  const [profile, setProfile]               = useState<UserProfile>(DEFAULT_PROFILE)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileComplete, setProfileComplete]   = useState(true)

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [usageBannerKey, setUsageBannerKey] = useState(0)

  // ── Load profile from localStorage ────────────────────────────────────────
  useEffect(() => {
    const stored = getStoredProfile()
    setProfile(stored)
    setProfileComplete(!!stored.yourName?.trim())
  }, [])

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      const email  = data.session?.user?.email || null
      const userId = data.session?.user?.id    || null
      setSessionEmail(email)
      setSessionUserId(userId)
      setAuthChecked(true)
      if (!userId) router.replace('/signin')
    }

    syncSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const email  = session?.user?.email || null
        const userId = session?.user?.id    || null
        setSessionEmail(email)
        setSessionUserId(userId)
        setAuthChecked(true)
        if (!userId) router.replace('/signin')
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // ── Onboarding — show once only ────────────────────────────────────────────
  useEffect(() => {
    if (!authChecked || !sessionUserId) return
    const alreadyDone = localStorage.getItem(ONBOARDING_KEY) === 'true'
    if (alreadyDone) return
    const t = setTimeout(() => setShowOnboarding(true), 500)
    return () => clearTimeout(t)
  }, [authChecked, sessionUserId])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/signin')
  }

  const handleSaveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile)
    saveStoredProfile(nextProfile)
    setProfileComplete(!!nextProfile.yourName?.trim())
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setTimeout(() => {
      const updated = getStoredProfile()
      setProfile(updated)
      setProfileComplete(!!updated.yourName?.trim())
    }, 100)
  }

  // Audit Website — goes to /app/audit with URL + title prefilled
  const handleRunFullAudit = (lead: WorkspaceLead) => {
    const normalisedUrl = normaliseLeadUrl(lead)
    if (!normalisedUrl) return

    sessionStorage.setItem('pendingAuditLead', JSON.stringify(lead))

    const params = new URLSearchParams({
      url:    normalisedUrl,
      title:  lead.title  || '',
      domain: lead.domain || '',
    })

    router.push(`/app/audit?${params.toString()}`)
  }

  // Start Audited Outreach — goes to /app/audit with next=outreach
  // After audit completes the audit page will show "Continue to Outreach →"
  const handleStartAuditedOutreach = (lead: WorkspaceLead) => {
    const normalisedUrl = normaliseLeadUrl(lead)
    if (!normalisedUrl) return

    sessionStorage.setItem('pendingAuditLead', JSON.stringify(lead))

    const params = new URLSearchParams({
      url:    normalisedUrl,
      title:  lead.title  || '',
      domain: lead.domain || '',
      next:   'outreach',           // ← audit page reads this to show CTA
    })

    router.push(`/app/audit?${params.toString()}`)
  }

  // Manual Outreach — goes straight to /app/outreach?mode=manual
  // ✅ FIXED — was incorrectly routing to /app/audit
  const handleOpenManualOutreach = (lead: WorkspaceLead) => {
    const normalisedUrl = normaliseLeadUrl(lead)

    sessionStorage.setItem('pendingOutreachLead', JSON.stringify(lead))

    const params = new URLSearchParams({
      mode:   'manual',
      url:    normalisedUrl,
      title:  lead.title  || '',
      domain: lead.domain || '',
    })

    router.push(`/app/outreach?${params.toString()}`)
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (!authChecked || !sessionUserId) {
    return (
      <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.13),transparent_55%),linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-6 py-5 text-sm text-slate-300 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            Loading...
          </div>
        </div>
      </main>
    )
  }

  // ── Page ───────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.13),transparent_55%),linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
      <MainNavbar
        sessionEmail={sessionEmail}
        isLoggedIn={!!sessionUserId}
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onSignOut={handleSignOut}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-10">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>🎯</span>
              Lead Finder
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Find weak websites in your market
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Search by industry and location — surface the best opportunities, then audit and pitch.
            </p>
          </div>

          <div className="self-start sm:self-center">
            <UsageLimitBanner
              userId={sessionUserId}
              refreshKey={usageBannerKey}
              compact
            />
          </div>
        </div>
        
        {/* ── Lead finder workspace ── */}
        <LeadFinderWorkspace
          userId={sessionUserId}
          onRunFullAudit={handleRunFullAudit}
          onStartAuditedOutreach={handleStartAuditedOutreach}
          onOpenManualOutreach={handleOpenManualOutreach}
        />

      </div>

      <ProfileModal
        open={showProfileModal}
        initialProfile={profile}
        sessionEmail={sessionEmail}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
      />

      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
    </main>
  )
}