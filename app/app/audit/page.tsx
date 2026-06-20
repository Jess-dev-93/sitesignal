'use client'

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import { useSupabaseSession } from '../../../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../../../lib/nextPageProps'
import ProfileModal from '../../../components/profile/ProfileModal'
import AuditForm from '../../../components/AuditForm'
import AuditReport from '../../../components/AuditReport'
import AuditHistory from '../../../components/AuditHistory'
import UsageLimitBanner from '../../../components/UsageLimitBanner'
import { AppHeader } from '../../../components/app-header'
import { Card, CardContent } from '../../../components/ui/card'
import {
  getStoredProfile,
  saveStoredProfile,
  DEFAULT_PROFILE,
} from '../../../lib/profileStorage'
import type { UserProfile } from '../../../lib/profileStorage'
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
    <div className="flex min-h-screen flex-col">
      <AppHeader
        variant="app"
        eyebrow="Workspace"
        title="Opportunity Discovery"
        description="Find issues you can turn into client conversations"
      />

      <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 sm:p-6">
        <Card className="border-border bg-gradient-to-br from-card via-card to-success-muted/30">
          <CardContent className="p-4 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold text-foreground sm:text-xl">
              Find opportunities on any website
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Discover real issues you can pitch on — then move straight into outreach and
              pipeline. This isn&apos;t just an audit tool. It&apos;s your reason to start a
              conversation.
            </p>
          </CardContent>
        </Card>

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
                <h2 className="mb-2 text-xl font-semibold text-white">
                  Monthly audit limit reached
                </h2>
                <p className="mx-auto mb-6 max-w-sm text-sm text-slate-400">
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
                <Card className="overflow-hidden border-success-border/40 bg-success-muted/20">
                  <CardContent className="p-5 sm:p-6">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-success">
                      Example opportunity
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { label: 'Website', value: 'joesplumbing.com.au' },
                        { label: 'Performance', value: '42', highlight: true },
                        { label: 'Issue', value: 'Slow mobile experience' },
                        { label: 'Opportunity', value: 'High', accent: true },
                        { label: 'Recommended action', value: 'Optimise or rebuild' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {item.label}
                          </p>
                          <p
                            className={`mt-1 text-sm font-semibold ${
                              item.accent
                                ? 'text-success'
                                : item.highlight
                                  ? 'text-rose-300'
                                  : 'text-white'
                            }`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-slate-400">
                      Every scan surfaces issues like this — concrete reasons to reach out.
                    </p>
                  </CardContent>
                </Card>

                <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                  <div className="border-b border-white/[0.06] p-6 sm:p-8">
                    <div className="mb-1 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-sm text-slate-200">
                        🔍
                      </div>
                      <h2 className="text-lg font-semibold text-white">
                        Discover issues you can pitch on
                      </h2>
                    </div>
                    <p className="ml-11 text-sm text-slate-400">
                      Enter a website URL and choose how deep you want to scan.
                    </p>

                    {selectedLead?.title && (
                      <div className="mt-4 ml-11 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                        From lead finder:
                        <span className="ml-1 font-semibold text-white">
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

                {auditHistory.length > 0 && !auditResult && !isRunning && (
                  <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] backdrop-blur-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Recent audits</h3>
                        <p className="text-xs text-slate-400">
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
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.03] sm:px-6"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {entry.url.replace(/^https?:\/\//, '')}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {new Date(entry.savedAt).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-success-border bg-success-muted px-2.5 py-1 text-xs font-semibold text-success">
                            Score {entry.overallScore}
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
                      className="mt-1 inline-block text-xs text-slate-300 underline underline-offset-2 hover:text-white"
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
                    <p className="text-sm font-semibold text-white">
                      {scanMode === 'quick' ? 'Running quick scan…' : 'Running full audit…'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {scanMode === 'quick'
                        ? 'Checking mobile performance and surfacing top issues. Usually 10–20 seconds.'
                        : 'Fetching PageSpeed data + generating AI report. This takes 15–30 seconds.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {auditResult && !isRunning && (
              <>
                <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] p-6 sm:p-8">
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                        ✓ Opportunity found
                      </p>
                      <h2 className="max-w-[400px] truncate text-lg font-semibold text-white">
                        {auditResult.url.replace(/^https?:\/\//, '')}
                      </h2>
                      <p className="mt-2 text-xs text-slate-500">
                        Viewing {auditMode} results — Lighthouse scores can vary slightly
                        between runs and environments.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          setAuditResult(null)
                          setErrorMsg(null)
                          setContinueToOutreachReady(false)
                        }}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.07] hover:text-white"
                      >
                        New audit
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
                    <div className="border-b border-white/[0.06] px-6 py-5 sm:px-8">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Score view
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            Both mobile and desktop are included in every audit. Switch
                            views below.
                          </p>
                        </div>

                        <div className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                          <button
                            type="button"
                            onClick={() => setAuditMode('mobile')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              auditMode === 'mobile'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
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
                                : 'text-slate-400 hover:text-slate-200'
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
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
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

                <div
                  className={`rounded-[28px] border p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-8 ${
                    arrivedForOutreach
                      ? 'border-violet-500/30 bg-violet-500/[0.06]'
                      : 'border-success-border/30 bg-success-muted/20'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-success">
                        {arrivedForOutreach
                          ? '✅ Audit complete — ready for outreach'
                          : 'What do you want to do next?'}
                      </p>
                      <h3 className="text-xl font-semibold text-white sm:text-2xl">
                        Turn this into a client conversation
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                        You&apos;ve found real issues. Now generate outreach tied to what you
                        discovered — email, call script, and follow-up in one flow.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <button
                        onClick={handleContinueToOutreach}
                        disabled={!continueToOutreachReady}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition disabled:opacity-50 sm:w-auto ${
                          arrivedForOutreach
                            ? 'bg-violet-600 shadow-[0_8px_24px_rgba(139,92,246,0.35)] hover:bg-violet-500'
                            : 'bg-success shadow-[0_8px_24px_rgba(16,185,129,0.25)] hover:opacity-90'
                        }`}
                      >
                        Generate Outreach →
                      </button>

                      <button
                        onClick={handleOpenManualOutreach}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] sm:w-auto"
                      >
                        Write custom outreach instead
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <span className="text-success">Audit</span>
                    <span aria-hidden="true">→</span>
                    <span className="text-white">Outreach</span>
                    <span aria-hidden="true">→</span>
                    <span>Pipeline</span>
                  </div>
                </div>
              </>
            )}

            {!auditResult && !isRunning && !auditLimitReached && !errorMsg && (
              <div className="py-8 text-center">
                <p className="text-base font-medium text-slate-300">
                  Find a real issue. Generate a real conversation.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Start by entering a website URL above.
                </p>
                {auditHistory.length > 0 && (
                  <button
                    onClick={() => setActiveView('history')}
                    className="mt-4 text-sm font-medium text-slate-200 underline underline-offset-4 transition-colors hover:text-white"
                  >
                    Or reopen a previous audit →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === 'history' && (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Recent audits</h2>
                <p className="text-sm text-slate-400">
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
              <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-16 text-center backdrop-blur-sm">
                <div className="mb-4 text-5xl opacity-40">📂</div>
                <h3 className="mb-2 font-semibold text-white">No audits saved yet</h3>
                <p className="mx-auto mb-6 max-w-xs text-sm text-slate-400">
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
      </main>

      <ProfileModal
        open={showProfileModal}
        initialProfile={profile}
        sessionEmail={sessionEmail}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
      />
    </div>
  )
}