'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useSupabaseSession } from '../../../lib/useSupabaseSession'
import {
  NextPageProps,
  useUnwrapNextPageProps,
} from '../../../lib/nextPageProps'

import ProfileModal from '../../../components/profile/ProfileModal'
import OnboardingModal from '../../../components/OnboardingModal'
import UsageLimitBanner from '../../../components/UsageLimitBanner'
import LeadFinderWorkspace from '../../../components/LeadFinderWorkspace'
import AppPageShell from '../../../components/layout/AppPageShell'
import { Card, CardContent } from '../../../components/ui/card'

import {
  DEFAULT_PROFILE,
  getStoredProfile,
  saveStoredProfile,
  UserProfile,
} from '../../../lib/profileStorage'

import {
  AUTH_REQUIRED,
} from '../../../lib/authGuestMode'

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

  if (!raw) {
    return ''
  }

  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://')
  ) {
    return raw
  }

  return `https://${raw}`
}

export default function LeadsPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)

  const router = useRouter()

  const {
    email: sessionEmail,
    userId: sessionUserId,
    loading: authChecked,
  } = useSupabaseSession()

const [profile, setProfile] =
  useState<UserProfile>(() => getStoredProfile())

const [showProfileModal, setShowProfileModal] =
  useState(false)

  const [showOnboarding, setShowOnboarding] =
    useState(false)

  const [usageBannerKey] =
    useState(0)

  // =====================================================
  // PROFILE
  // =====================================================

  useEffect(() => {
  const stored = getStoredProfile()
  setProfile(stored)
}, [])

  // =====================================================
  // AUTH
  // =====================================================

  useEffect(() => {
    if (!authChecked) {
      return
    }

    if (AUTH_REQUIRED && !sessionUserId) {
      router.replace('/signin')
    }
  }, [
    authChecked,
    router,
    sessionUserId,
  ])

  // =====================================================
  // ONBOARDING
  // Show once only
  // =====================================================

  useEffect(() => {
    if (!authChecked || !sessionUserId) {
      return
    }

    const alreadyDone =
      localStorage.getItem(ONBOARDING_KEY) === 'true'

    if (alreadyDone) {
      return
    }

    const timer = setTimeout(() => {
      setShowOnboarding(true)
    }, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [
    authChecked,
    sessionUserId,
  ])

  // =====================================================
  // PROFILE HANDLERS
  // =====================================================
const handleSaveProfile = (
  nextProfile: UserProfile
) => {
  setProfile(nextProfile)
  saveStoredProfile(nextProfile)
}

  const handleOnboardingComplete = () => {
  setShowOnboarding(false)

  window.setTimeout(() => {
    setProfile(getStoredProfile())
  }, 100)
}

  // =====================================================
  // AUDIT
  // Review opportunity
  // =====================================================

  const handleRunFullAudit = (
    lead: WorkspaceLead
  ) => {
    const normalisedUrl =
      normaliseLeadUrl(lead)

    if (!normalisedUrl) {
      return
    }

    sessionStorage.setItem(
      'pendingAuditLead',
      JSON.stringify(lead)
    )

    const params = new URLSearchParams({
      url: normalisedUrl,
      title: lead.title || '',
      domain: lead.domain || '',
    })

    router.push(
      `/app/audit?${params.toString()}`
    )
  }

  // =====================================================
  // AUDITED OUTREACH
  // Audit first, then continue to outreach
  // =====================================================

  const handleStartAuditedOutreach = (
    lead: WorkspaceLead
  ) => {
    const normalisedUrl =
      normaliseLeadUrl(lead)

    if (!normalisedUrl) {
      return
    }

    sessionStorage.setItem(
      'pendingAuditLead',
      JSON.stringify(lead)
    )

    const params = new URLSearchParams({
      url: normalisedUrl,
      title: lead.title || '',
      domain: lead.domain || '',
      next: 'outreach',
    })

    router.push(
      `/app/audit?${params.toString()}`
    )
  }

  // =====================================================
  // MANUAL OUTREACH
  // Skip audit and go straight to outreach
  // =====================================================

  const handleOpenManualOutreach = (
    lead: WorkspaceLead
  ) => {
    const normalisedUrl =
      normaliseLeadUrl(lead)

    sessionStorage.setItem(
      'pendingOutreachLead',
      JSON.stringify(lead)
    )

    const params = new URLSearchParams({
      mode: 'manual',
      url: normalisedUrl,
      title: lead.title || '',
      domain: lead.domain || '',
    })

    router.push(
      `/app/outreach?${params.toString()}`
    )
  }

  // =====================================================
  // LOADING / AUTH CHECK
  // =====================================================

  if (AUTH_REQUIRED && !authChecked) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    </div>
  )
}

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <AppPageShell
      title="Opportunities"
      description="Find businesses with website and digital issues worth investigating."
    >
      <UsageLimitBanner
  userId={sessionUserId || 'demo-user'}
  refreshKey={usageBannerKey}
  compact
/>

      <LeadFinderWorkspace
        userId={sessionUserId || 'demo-user'}
        onRunFullAudit={handleRunFullAudit}
        onStartAuditedOutreach={
          handleStartAuditedOutreach
        }
        onOpenManualOutreach={
          handleOpenManualOutreach
        }
      />

      <ProfileModal
        open={showProfileModal}
        initialProfile={profile}
        sessionEmail={sessionEmail}
        onClose={() =>
          setShowProfileModal(false)
        }
        onSave={handleSaveProfile}
      />

      {showOnboarding && (
        <OnboardingModal
          onComplete={
            handleOnboardingComplete
          }
        />
      )}
    </AppPageShell>
  )
}