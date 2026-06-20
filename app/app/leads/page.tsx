'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import { useSupabaseSession } from '../../../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../../../lib/nextPageProps'
import ProfileModal from '../../../components/profile/ProfileModal'
import OnboardingModal from '../../../components/OnboardingModal'
import UsageLimitBanner from '../../../components/UsageLimitBanner'
import LeadFinderWorkspace from '../../../components/LeadFinderWorkspace'
import AppPageShell from '../../../components/layout/AppPageShell'
import PageIntroCard from '../../../components/layout/PageIntroCard'
import { Card, CardContent } from '../../../components/ui/card'
import {
  DEFAULT_PROFILE,
  getStoredProfile,
  saveStoredProfile,
  UserProfile,
} from '../../../lib/profileStorage'

const ONBOARDING_KEY = 'clientFinderOnboardingComplete'

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

export default function LeadsPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const router = useRouter()
  const { email: sessionEmail, userId: sessionUserId, loading: authChecked } =
    useSupabaseSession()

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
    if (!authChecked) return
    if (!sessionUserId) router.replace('/signin')
  }, [authChecked, router, sessionUserId])

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
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md border-border bg-card">
          <CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
      </div>
    )
  }

  // ── Page ───────────────────────────────────────────────────────────────────

  return (
    <AppPageShell title="Leads" description="Find weak websites in your market">
      <PageIntroCard
        title="Lead Finder"
        description="Search by industry and location — surface the best opportunities, then audit and pitch."
      >
        <div className="mt-4">
          <UsageLimitBanner userId={sessionUserId} refreshKey={usageBannerKey} compact />
        </div>
      </PageIntroCard>

      <Card className="border-border bg-card">
          <CardContent className="p-4 sm:p-6">
            <LeadFinderWorkspace
              userId={sessionUserId}
              onRunFullAudit={handleRunFullAudit}
              onStartAuditedOutreach={handleStartAuditedOutreach}
              onOpenManualOutreach={handleOpenManualOutreach}
            />
        </CardContent>
      </Card>

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
    </AppPageShell>
  )
}