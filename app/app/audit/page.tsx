'use client'

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import { useSupabaseSession } from '../../../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../../../lib/nextPageProps'
import AppPageShell from '../../../components/layout/AppPageShell'
import PageIntroCard from '../../../components/layout/PageIntroCard'
import ProfileModal from '../../../components/profile/ProfileModal'
import AuditForm from '../../../components/AuditForm'
import AuditReport from '../../../components/AuditReport'
import AuditHistory from '../../../components/AuditHistory'
import UsageLimitBanner from '../../../components/UsageLimitBanner'
import { Card, CardContent } from '../../../components/ui/card'
import ExampleOpportunityCard from '../../../components/audit/ExampleOpportunityCard'
import OpportunityFoundPanel from '../../../components/audit/OpportunityFoundPanel'
import OpportunityScoreCard from '../../../components/audit/OpportunityScoreCard'
import OpportunityScoreFactors from '../../../components/audit/OpportunityScoreFactors'
import TechnologyAdvisor from '../../../components/audit/TechnologyAdvisor'
import WhyThisMatters from '../../../components/audit/WhyThisMatters'
import WorkflowJourney from '../../../components/audit/WorkflowJourney'
import { computeOpportunityScore, normalizeScores } from '../../../lib/opportunityScore'
import {
  getStoredProfile,
  saveStoredProfile,
  DEFAULT_PROFILE,
} from '../../../lib/profileStorage'
import type { UserProfile } from '../../../lib/profileStorage'
import type { TechStack } from '../../../lib/techStack'
import { getScoreStyles } from '../../../lib/scoreColors'

interface AuditScores {
  mobile: {
    performance: number
    seo: number
    accessibility: number
    bestPractices: number
  }
  desktop: {
    performance: number
    seo: number
    accessibility: number
    bestPractices: number
  }
  details: Record<string, unknown>
  overallScore: number
}

interface AuditRecord {
  id: string
  url: string
  date: string
  scores: AuditScores
  techStack?: TechStack
  aiReport: {
    executiveSummary: string
    keyIssues: string[]
    businessImpact: string[]
    recommendations: string[]
  }
}

interface HistoryEntry {
  id: string
  url: string
  savedAt: string
  overallScore: number
  performance: number
  seo: number
  accessibility: number
  bestPractices: number
  mobilePerformance: number
  desktopPerformance: number
  scores?: AuditScores | null
  techStack?: TechStack | null
  report: {
    executiveSummary?: string
    keyIssues?: string[]
    businessImpact?: string[]
    recommendations?: string[]
  } | null
  status?: string
  notes?: string
}

interface PlanInfo {
  plan: string
  auditCount: number
  auditLimit: number | null
  searchCount: number
  searchLimit: number | null
}

interface WorkspaceLead {
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

type AuditMode = 'mobile' | 'desktop'
type ScanMode = 'quick' | 'full'

const FALLBACK_TECH_STACK: TechStack = {
  cms: 'Unknown CMS',
  pageBuilder: null,
  hosting: 'Unknown hosting',
  confidence: 'low',
}

function normaliseUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

function mapAuditRecordToHistoryEntry(record: AuditRecord): HistoryEntry {
  return {
    id: record.id,
    url: record.url,
    savedAt: record.date,
    scores: record.scores ?? null,
    overallScore: record.scores?.overallScore ?? 0,
    performance: record.scores?.mobile?.performance ?? 0,
    seo: record.scores?.mobile?.seo ?? 0,
    accessibility: record.scores?.mobile?.accessibility ?? 0,
    bestPractices: record.scores?.mobile?.bestPractices ?? 0,
    mobilePerformance: record.scores?.mobile?.performance ?? 0,
    desktopPerformance: record.scores?.desktop?.performance ?? 0,
    techStack: record.techStack ?? null,
    report: record.aiReport ?? null,
    status: 'Saved',
    notes: '',
  }
}

function mapHistoryEntryToAuditRecord(entry: HistoryEntry): AuditRecord {
  return {
    id: entry.id,
    url: entry.url,
    date: entry.savedAt,
    scores: entry.scores ?? {
      mobile: {
        performance: entry.performance ?? entry.mobilePerformance ?? 0,
        seo: entry.seo ?? 0,
        accessibility: entry.accessibility ?? 0,
        bestPractices: entry.bestPractices ?? 0,
      },
      desktop: {
        performance: entry.desktopPerformance ?? 0,
        seo: 0,
        accessibility: 0,
        bestPractices: 0,
      },
      details: {},
      overallScore: entry.overallScore ?? 0,
    },
    techStack: entry.techStack ?? undefined,
    aiReport: entry.report
      ? {
          executiveSummary: entry.report.executiveSummary ?? '',
          keyIssues: entry.report.keyIssues ?? [],
          businessImpact: entry.report.businessImpact ?? [],
          recommendations: entry.report.recommendations ?? [],
        }
      : {
          executiveSummary: '',
          keyIssues: [],
          businessImpact: [],
          recommendations: [],
        },
  }
}

function mapStoredHistoryToAuditRecord(entry: any): AuditRecord {
  if (entry?.scores && entry?.aiReport) {
    return {
      id: entry.id,
      url: entry.url,
      date: entry.date || entry.savedAt || new Date().toISOString(),
      scores: {
        mobile: {
          performance: entry.scores?.mobile?.performance ?? 0,
          seo: entry.scores?.mobile?.seo ?? 0,
          accessibility: entry.scores?.mobile?.accessibility ?? 0,
          bestPractices: entry.scores?.mobile?.bestPractices ?? 0,
        },
        desktop: {
          performance: entry.scores?.desktop?.performance ?? 0,
          seo: entry.scores?.desktop?.seo ?? 0,
          accessibility: entry.scores?.desktop?.accessibility ?? 0,
          bestPractices: entry.scores?.desktop?.bestPractices ?? 0,
        },
        details: entry.scores?.details ?? {},
        overallScore: entry.scores?.overallScore ?? 0,
      },
      techStack: entry.techStack ?? undefined,
      aiReport: {
        executiveSummary: entry.aiReport?.executiveSummary ?? '',
        keyIssues: entry.aiReport?.keyIssues ?? [],
        businessImpact: entry.aiReport?.businessImpact ?? [],
        recommendations: entry.aiReport?.recommendations ?? [],
      },
    }
  }

  return mapHistoryEntryToAuditRecord({
    id: entry?.id || `audit_${Date.now()}`,
    url: entry?.url || '',
    savedAt: entry?.savedAt || entry?.date || new Date().toISOString(),
    overallScore: entry?.overallScore ?? 0,
    performance: entry?.performance ?? entry?.mobilePerformance ?? 0,
    seo: entry?.seo ?? 0,
    accessibility: entry?.accessibility ?? 0,
    bestPractices: entry?.bestPractices ?? 0,
    mobilePerformance: entry?.mobilePerformance ?? entry?.performance ?? 0,
    desktopPerformance: entry?.desktopPerformance ?? 0,
    scores: entry?.scores ?? null,
    report: entry?.report ?? null,
    status: entry?.status ?? 'Saved',
    notes: entry?.notes ?? '',
  })
}

function mapStoredHistoryToHistoryEntry(entry: any): HistoryEntry {
  if (entry?.scores && entry?.aiReport) {
    return {
      id: entry.id,
      url: entry.url,
      savedAt: entry.date || entry.savedAt || new Date().toISOString(),
      scores: entry.scores ?? null,
      overallScore: entry.scores?.overallScore ?? 0,
      performance: entry.scores?.mobile?.performance ?? 0,
      seo: entry.scores?.mobile?.seo ?? 0,
      accessibility: entry.scores?.mobile?.accessibility ?? 0,
      bestPractices: entry.scores?.mobile?.bestPractices ?? 0,
      mobilePerformance: entry.scores?.mobile?.performance ?? 0,
      desktopPerformance: entry.scores?.desktop?.performance ?? 0,
      techStack: entry.techStack ?? null,
      report: entry.aiReport ?? null,
      status: entry?.status ?? 'Saved',
      notes: entry?.notes ?? '',
    }
  }

  return {
    id: entry?.id || `audit_${Date.now()}`,
    url: entry?.url || '',
    savedAt: entry?.savedAt || entry?.date || new Date().toISOString(),
    scores: entry?.scores ?? null,
    overallScore: entry?.overallScore ?? 0,
    performance: entry?.performance ?? entry?.mobilePerformance ?? 0,
    seo: entry?.seo ?? 0,
    accessibility: entry?.accessibility ?? 0,
    bestPractices: entry?.bestPractices ?? 0,
    mobilePerformance: entry?.mobilePerformance ?? entry?.performance ?? 0,
    desktopPerformance: entry?.desktopPerformance ?? 0,
    techStack: entry?.techStack ?? null,
    report: entry?.report ?? null,
    status: entry?.status ?? 'Saved',
    notes: entry?.notes ?? '',
  }
}

export default function AuditPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <Card className="max-w-md border-border bg-card">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading audit…</CardContent>
          </Card>
        </div>
      }
    >
      <AuditPageInner />
    </Suspense>
  )
}

function AuditPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { email: sessionEmail, userId: sessionUserId, loading: authLoading } =
    useSupabaseSession()
  const authReady = !authLoading

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

  const [auditResult, setAuditResult] = useState<AuditRecord | null>(null)
  const [auditHistory, setAuditHistory] = useState<HistoryEntry[]>([])
  const [activeView, setActiveView] = useState<'tool' | 'history'>('tool')
  const [auditMode, setAuditMode] = useState<AuditMode>('mobile')
  const [scanMode, setScanMode] = useState<ScanMode>('full')
  const [isRunning, setIsRunning] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [prefilledUrl, setPrefilledUrl] = useState('')
  const [selectedLead, setSelectedLead] = useState<WorkspaceLead | null>(null)
  const [continueToOutreachReady, setContinueToOutreachReady] = useState(false)

  const queryUrl = searchParams.get('url') || ''
  const queryTitle = searchParams.get('title') || ''
  const queryDomain = searchParams.get('domain') || ''
  const queryNext = searchParams.get('next') || ''

  useEffect(() => {
    if (!authReady) return
    if (!sessionUserId) router.push('/signin')
  }, [authReady, router, sessionUserId])

  useEffect(() => {
    if (!authReady) return
    const stored = getStoredProfile()
    if (stored) setProfile(stored)
  }, [authReady])

  const handleSaveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile)
    saveStoredProfile(nextProfile)
  }

  useEffect(() => {
    const nextUrl = normaliseUrl(queryUrl || '')
    if (nextUrl) setPrefilledUrl(nextUrl)

    const pendingAuditLeadRaw = sessionStorage.getItem('pendingAuditLead')
    const pendingOutreachLeadRaw = sessionStorage.getItem('pendingOutreachLead')

    let nextLead: WorkspaceLead | null = null

    if (pendingAuditLeadRaw) {
      try {
        nextLead = JSON.parse(pendingAuditLeadRaw)
      } catch {}
    }

    if (!nextLead && pendingOutreachLeadRaw) {
      try {
        nextLead = JSON.parse(pendingOutreachLeadRaw)
      } catch {}
    }

    if (!nextLead && (queryTitle || queryDomain || nextUrl)) {
      nextLead = {
        title: queryTitle || '',
        domain: queryDomain || '',
        url: nextUrl || '',
      }
    }

    if (nextLead) {
      setSelectedLead(nextLead)
      if (!nextUrl && nextLead.url) setPrefilledUrl(normaliseUrl(nextLead.url))
    }
  }, [queryUrl, queryTitle, queryDomain])

  const fetchPlan = useCallback(async () => {
    if (!sessionUserId) return
    try {
      const res = await fetch('/api/user-plan', {
        headers: { 'x-user-id': sessionUserId },
      })
      const json = await res.json()
      if (json.success) setPlanInfo(json.data)
    } catch {}
  }, [sessionUserId])

  useEffect(() => {
    if (authReady && sessionUserId) fetchPlan()
  }, [authReady, sessionUserId, fetchPlan])

  useEffect(() => {
    if (!authReady) return
    try {
      const raw = localStorage.getItem('siteSignalAuditHistory')
      const parsed = raw ? JSON.parse(raw) : []
      const normalised = Array.isArray(parsed)
        ? parsed.map((entry) => mapStoredHistoryToHistoryEntry(entry))
        : []
      setAuditHistory(normalised)
      localStorage.setItem('siteSignalAuditHistory', JSON.stringify(normalised))
    } catch {}
  }, [authReady])

  const saveToHistory = useCallback((record: AuditRecord) => {
    try {
      const raw = localStorage.getItem('siteSignalAuditHistory')
      const parsed = raw ? JSON.parse(raw) : []
      const existing: HistoryEntry[] = Array.isArray(parsed)
        ? parsed.map((entry) => mapStoredHistoryToHistoryEntry(entry))
        : []

      const nextEntry = mapAuditRecordToHistoryEntry(record)
      const today = new Date().toDateString()

      const filtered = existing.filter(
        (r) => !(r.url === nextEntry.url && new Date(r.savedAt).toDateString() === today)
      )

      const updated = [nextEntry, ...filtered].slice(0, 50)
      localStorage.setItem('siteSignalAuditHistory', JSON.stringify(updated))
      setAuditHistory(updated)
    } catch {}
  }, [])

  const handleRunAudit = useCallback(
    async (url: string, mode: ScanMode = scanMode) => {
      if (!sessionUserId || isRunning) return

      const normalisedInputUrl = normaliseUrl(url)
      if (!normalisedInputUrl) return

      setIsRunning(true)
      setAuditResult(null)
      setErrorMsg(null)
      setContinueToOutreachReady(false)
      setActiveView('tool')

      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': sessionUserId,
          },
          body: JSON.stringify({ url: normalisedInputUrl, scanMode: mode }),
        })

        const json = await res.json()

        if (json.limitReached) {
          await fetchPlan()
          setErrorMsg(json.error ?? 'Monthly audit limit reached.')
          return
        }

        if (!json.success) {
          setErrorMsg(json.error ?? 'Audit failed. Please try again.')
          return
        }

        const record: AuditRecord = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url: json.url,
          date: json.scannedAt ?? new Date().toISOString(),
          scores: json.scores,
          techStack: json.techStack,
          aiReport: json.aiReport,
        }

        const nextLead: WorkspaceLead = {
          ...(selectedLead || {}),
          url: json.url,
          domain:
            selectedLead?.domain ||
            (() => {
              try {
                return new URL(json.url).hostname.replace(/^www\./, '')
              } catch {
                return json.url
                  .replace(/^https?:\/\//, '')
                  .replace(/^www\./, '')
                  .split('/')[0]
              }
            })(),
        }

        setSelectedLead(nextLead)

        sessionStorage.setItem('pendingAuditLead', JSON.stringify(nextLead))
        sessionStorage.setItem(
          'pendingAuditResult',
          JSON.stringify({
            url: json.url,
            scores: json.scores,
            techStack: json.techStack,
            aiReport: json.aiReport,
          })
        )

        setAuditResult(record)
        setPrefilledUrl(json.url)
        saveToHistory(record)
        fetchPlan()
        setContinueToOutreachReady(true)
      } catch {
        setErrorMsg('Something went wrong. Please check your connection and try again.')
      } finally {
        setIsRunning(false)
      }
    },
    [sessionUserId, isRunning, fetchPlan, saveToHistory, selectedLead, scanMode]
  )

  const handleOpenFromHistory = useCallback((entry: HistoryEntry) => {
    const record = mapHistoryEntryToAuditRecord(entry)

    setAuditResult(record)
    setPrefilledUrl(entry.url)
    setActiveView('tool')
    setContinueToOutreachReady(true)

    sessionStorage.setItem(
      'pendingAuditResult',
      JSON.stringify({
        url: record.url,
        scores: record.scores,
        techStack: record.techStack,
        aiReport: record.aiReport,
      })
    )

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleContinueToOutreach = () => {
    const lead: WorkspaceLead = selectedLead || {
      title: queryTitle || '',
      url: auditResult?.url || prefilledUrl,
      domain: queryDomain || '',
    }

    if (!lead.url && auditResult?.url) lead.url = auditResult.url

    sessionStorage.setItem('pendingOutreachLead', JSON.stringify(lead))

    if (auditResult) {
      sessionStorage.setItem(
        'pendingAuditResult',
        JSON.stringify({
          url: auditResult.url,
          scores: auditResult.scores,
          techStack: auditResult.techStack,
          aiReport: auditResult.aiReport,
        })
      )
    }

    const params = new URLSearchParams({
      url: lead.url || '',
      title: lead.title || '',
      domain: lead.domain || '',
      mode: 'audited',
    })

    router.push(`/app/outreach?${params.toString()}`)
  }

  const handleOpenManualOutreach = () => {
    const lead: WorkspaceLead = selectedLead || {
      title: queryTitle || '',
      url: auditResult?.url || prefilledUrl,
      domain: queryDomain || '',
    }

    sessionStorage.setItem('pendingOutreachLead', JSON.stringify(lead))

    const params = new URLSearchParams({
      url: lead.url || '',
      title: lead.title || '',
      domain: lead.domain || '',
      mode: 'manual',
    })

    router.push(`/app/outreach?${params.toString()}`)
  }

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/')
  }, [router])

  const auditLimitReached =
    planInfo?.auditLimit !== null &&
    planInfo?.auditLimit !== undefined &&
    (planInfo?.auditCount ?? 0) >= planInfo.auditLimit

  const activeScores = useMemo(() => {
    if (!auditResult?.scores) return null
    return auditMode === 'mobile'
      ? auditResult.scores.mobile
      : auditResult.scores.desktop
  }, [auditResult, auditMode])

  const opportunityResult = useMemo(() => {
    if (!auditResult?.scores) return null
    return computeOpportunityScore(
      auditResult.scores,
      auditResult.aiReport?.keyIssues ?? []
    )
  }, [auditResult])

  const arrivedForOutreach = queryNext === 'outreach'

  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md border-border bg-card">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            Loading audit tool…
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AppPageShell
      title="Find the reason to start the conversation."
      description="Scan any website, get an opportunity score, and generate outreach from real evidence."
    >
        <PageIntroCard
          title="Most freelancers guess."
          description="SiteSignal finds real website issues you can use to start better conversations."
        />

        <WorkflowJourney />

        {arrivedForOutreach && !auditResult && !isRunning && (
          <Card className="border-violet-500/30 bg-violet-500/[0.06]">
            <CardContent className="flex items-start gap-3 p-4 sm:p-6">
              <span className="mt-0.5 flex-shrink-0 text-lg text-violet-300">✉️</span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Audit first, then continue to outreach
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Run the scan below — once it completes, click{' '}
                  <span className="font-medium text-violet-300">Generate Outreach →</span> to
                  prepare your pitch using the real findings.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <UsageLimitBanner userId={sessionUserId} />

        <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => setActiveView('tool')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeView === 'tool'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            Audit Website
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeView === 'history'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            Recent Audits
            {auditHistory.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  activeView === 'history'
                    ? 'bg-foreground/15 text-foreground'
                    : 'bg-foreground/10 text-muted-foreground'
                }`}
              >
                {auditHistory.length}
              </span>
            )}
          </button>
        </div>

        {activeView === 'tool' && (
          <div className="space-y-8">
            {auditLimitReached ? (
              <div className="rounded-[28px] border border-amber-500/30 bg-amber-500/[0.06] p-8 text-center backdrop-blur-sm">
                <div className="mb-4 text-4xl">🔒</div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">
                  Monthly audit limit reached
                </h2>
                <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
                  You&apos;ve used all{' '}
                  <span className="font-semibold text-amber-400">
                    {planInfo?.auditLimit} audit{planInfo?.auditLimit === 1 ? '' : 's'}
                  </span>{' '}
                  for this month. Upgrade to run unlimited audits.
                </p>
                <a
                  href="/app/pricing"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  View plans →
                </a>
              </div>
            ) : (
              <>
                <div className="overflow-hidden border-2 border-violet-500/20 ss-panel-elevated shadow-lg shadow-violet-500/10">
                  <div className="border-b border-border bg-gradient-to-r from-card to-violet-500/5 p-6 sm:p-8">
                    <div className="mb-1 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-lg">
                        🔍
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                          Paste a website URL
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Quick or full scan — results in under 30 seconds.
                        </p>
                      </div>
                    </div>

                    {selectedLead?.title && (
                      <div className="mt-4 inline-flex items-center rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground">
                        From lead finder:
                        <span className="ml-1 font-semibold text-foreground">
                          {selectedLead.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 sm:p-8">
                    <AuditForm
                      onSubmit={handleRunAudit}
                      isLoading={isRunning}
                      initialUrl={prefilledUrl}
                      scanMode={scanMode}
                      onScanModeChange={setScanMode}
                    />
                  </div>
                </div>

                {!auditResult && !isRunning && <ExampleOpportunityCard />}

                {!auditResult && !isRunning && <WhyThisMatters />}

                {auditHistory.length > 0 && !auditResult && !isRunning && (
                  <div className="overflow-hidden rounded-[28px] border border-border bg-card backdrop-blur-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Recent audits</h3>
                        <p className="text-xs text-muted-foreground">
                          Reopen a previous scan to continue to outreach
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveView('history')}
                        className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="divide-y divide-white/[0.06]">
                      {auditHistory.slice(0, 3).map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => handleOpenFromHistory(entry)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-secondary/30 sm:px-6"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {entry.url.replace(/^https?:\/\//, '')}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {new Date(entry.savedAt).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-success-border bg-success-muted px-2.5 py-1 text-xs font-semibold text-success">
                            {computeOpportunityScore(
                              normalizeScores(entry),
                              entry.report?.keyIssues ?? []
                            ).score}{' '}
                            opp.
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {errorMsg && !isRunning && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] px-5 py-4">
                <span className="flex-shrink-0 text-lg text-rose-400">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-rose-300">{errorMsg}</p>
                  {errorMsg.includes('limit') && (
                    <a
                      href="/app/pricing"
                      className="mt-1 inline-block text-xs text-secondary-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      View upgrade options →
                    </a>
                  )}
                </div>
              </div>
            )}

            {isRunning && (
              <div className="rounded-[28px] border border-blue-500/20 bg-blue-500/[0.04] p-8 text-center backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-14 w-14">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400" />
                    <div className="absolute inset-2 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-400 [animation-direction:reverse] [animation-duration:1.5s]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {scanMode === 'quick' ? 'Running quick scan…' : 'Running full audit…'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {scanMode === 'quick'
                        ? 'Checking mobile performance and surfacing top issues. Usually 10–20 seconds.'
                        : 'Fetching PageSpeed data + generating AI report. This takes 15–30 seconds.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {auditResult && !isRunning && opportunityResult && (
              <>
                <OpportunityScoreCard result={opportunityResult} />
                <OpportunityScoreFactors
                  scores={auditResult.scores}
                  techStack={auditResult.techStack}
                />

                <OpportunityFoundPanel
                  result={opportunityResult}
                  onGenerateOutreach={handleContinueToOutreach}
                  onManualOutreach={handleOpenManualOutreach}
                  outreachReady={continueToOutreachReady}
                  arrivedForOutreach={arrivedForOutreach}
                />

                <TechnologyAdvisor
                  performance={auditResult.scores.mobile.performance}
                  stack={auditResult.techStack ?? FALLBACK_TECH_STACK}
                />

                <div className="overflow-hidden ss-panel-elevated">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-6 sm:p-8">
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Full scan details
                      </p>
                      <h2 className="max-w-[400px] truncate text-lg font-semibold text-foreground">
                        {auditResult.url.replace(/^https?:\/\//, '')}
                      </h2>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Technical breakdown — share with clients or use in your pitch deck.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          setAuditResult(null)
                          setErrorMsg(null)
                          setContinueToOutreachReady(false)
                        }}
                        className="rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary hover:text-foreground"
                      >
                        New scan
                      </button>
                      <button
                        onClick={() => setActiveView('history')}
                        className="rounded-xl border border-blue-500/30 bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-300 transition-all hover:bg-blue-600/30 hover:text-blue-200"
                      >
                        View history
                      </button>
                    </div>
                  </div>

                  {activeScores && (
                    <div className="border-b border-border px-6 py-5 sm:px-8">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Score view
                          </p>
                          <p className="mt-1 text-sm text-secondary-foreground">
                            Both mobile and desktop are included in every audit. Switch
                            views below.
                          </p>
                        </div>

                        <div className="inline-flex rounded-xl border border-border bg-secondary/30 p-1">
                          <button
                            type="button"
                            onClick={() => setAuditMode('mobile')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              auditMode === 'mobile'
                                ? 'bg-blue-600 text-white'
                                : 'text-muted-foreground hover:text-slate-200'
                            }`}
                          >
                            Mobile
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuditMode('desktop')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              auditMode === 'desktop'
                                ? 'bg-blue-600 text-white'
                                : 'text-muted-foreground hover:text-slate-200'
                            }`}
                          >
                            Desktop
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          { label: 'Performance', value: activeScores.performance },
                          { label: 'SEO', value: activeScores.seo },
                          { label: 'Accessibility', value: activeScores.accessibility },
                          { label: 'Best Practices', value: activeScores.bestPractices },
                        ].map((item) => {
                          const styles = getScoreStyles(item.value || 0)
                          return (
                            <div
                              key={item.label}
                              className={`rounded-2xl border p-4 ${styles.panel}`}
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                {item.label}
                              </p>
                              <p className={`mt-2 text-3xl font-bold ${styles.text}`}>
                                {item.value ?? 0}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-6 sm:p-8">
                    <AuditReport
                      url={auditResult.url}
                      scores={auditResult.scores}
                      report={auditResult.aiReport}
                      profile={profile}
                      auditMode={auditMode}
                    />
                  </div>
                </div>

                <WorkflowJourney />
              </>
            )}

            {!auditResult && !isRunning && !auditLimitReached && !errorMsg && (
              <p className="text-center text-xs text-muted-foreground">
                Tip: paste any business URL above to see their opportunity score in seconds.
              </p>
            )}
          </div>
        )}

        {activeView === 'history' && (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent audits</h2>
                <p className="text-sm text-muted-foreground">
                  {auditHistory.length} saved opportunit{auditHistory.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>
              <button
                onClick={() => setActiveView('tool')}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-colors hover:bg-blue-500"
              >
                + New audit
              </button>
            </div>

            <AuditHistory onReopen={handleOpenFromHistory} />

            {auditHistory.length === 0 && (
              <div className="rounded-[28px] border border-border bg-card p-16 text-center backdrop-blur-sm">
                <div className="mb-4 text-5xl opacity-40">📂</div>
                <h3 className="mb-2 font-semibold text-foreground">No audits saved yet</h3>
                <p className="mx-auto mb-6 max-w-xs text-sm text-muted-foreground">
                  Run your first audit and it will appear here automatically.
                </p>
                <button
                  onClick={() => setActiveView('tool')}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  Run your first audit →
                </button>
              </div>
            )}
          </div>
        )}
      <ProfileModal
        open={showProfileModal}
        initialProfile={profile}
        sessionEmail={sessionEmail}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
      />
      </AppPageShell>
  )
}