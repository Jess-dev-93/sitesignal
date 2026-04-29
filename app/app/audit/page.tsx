'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import MainNavbar from '../../../components/layout/MainNavbar'
import ProfileModal from '../../../components/profile/ProfileModal'
import AuditForm from '../../../components/AuditForm'
import AuditReport from '../../../components/AuditReport'
import AuditHistory from '../../../components/AuditHistory'
import UsageLimitBanner from '../../../components/UsageLimitBanner'
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

export default function AuditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

  const [auditResult, setAuditResult] = useState<AuditRecord | null>(null)
  const [auditHistory, setAuditHistory] = useState<HistoryEntry[]>([])
  const [activeView, setActiveView] = useState<'tool' | 'history'>('tool')
  const [auditMode, setAuditMode] = useState<AuditMode>('mobile')
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
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/signin')
        return
      }

      setSessionUserId(session.user.id)
      setSessionEmail(session.user.email ?? null)
      setAuthReady(true)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/signin')
    })

    return () => subscription.unsubscribe()
  }, [router])

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
    async (url: string) => {
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
          body: JSON.stringify({ url: normalisedInputUrl }),
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
    [sessionUserId, isRunning, fetchPlan, saveToHistory, selectedLead]
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
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500/40 border-t-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading audit tool…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.13),transparent_55%),linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
      <MainNavbar
        sessionEmail={sessionEmail}
        isLoggedIn={!!sessionUserId}
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onSignOut={handleSignOut}
      />

      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-500/[0.07] blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] blur-3xl" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400">
            Website Audit
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Audit any website
          </h1>
          <p className="mt-2 max-w-xl text-base text-slate-400">
            Run a full PageSpeed + AI analysis. Review mobile or desktop results, then
            move into outreach when you&apos;re ready.
          </p>
        </div>

        {arrivedForOutreach && !auditResult && !isRunning && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/[0.06] px-5 py-4">
            <span className="mt-0.5 flex-shrink-0 text-lg text-violet-300">✉️</span>
            <div>
              <p className="text-sm font-semibold text-violet-200">
                Audit first, then continue to outreach
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Run the audit below — once it completes, click{' '}
                <span className="font-medium text-violet-300">Continue to Outreach →</span> to
                prepare your pitch using the real findings.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <UsageLimitBanner userId={sessionUserId} />
        </div>

        <div className="mb-8 flex w-fit items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
          <button
            onClick={() => setActiveView('tool')}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 ${
              activeView === 'tool'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            Audit Website
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 ${
              activeView === 'history'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            History
            {auditHistory.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  activeView === 'history'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.08] text-slate-300'
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
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  View plans →
                </a>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <div className="border-b border-white/[0.06] p-6 sm:p-8">
                  <div className="mb-1 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-sm text-blue-400">
                      📊
                    </div>
                    <h2 className="text-lg font-semibold text-white">Enter a website URL</h2>
                  </div>
                  <p className="ml-11 text-sm text-slate-400">
                    We&apos;ll run a full Lighthouse scan + AI recommendations
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
                  />
                </div>
              </div>
            )}

            {errorMsg && !isRunning && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] px-5 py-4">
                <span className="flex-shrink-0 text-lg text-rose-400">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-rose-300">{errorMsg}</p>
                  {errorMsg.includes('limit') && (
                    <a
                      href="/pricing"
                      className="mt-1 inline-block text-xs text-blue-400 underline underline-offset-2 hover:text-blue-300"
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
                    <p className="text-sm font-semibold text-white">Running audit…</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Fetching PageSpeed data + generating AI report. This takes 15–30
                      seconds.
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
                        ✓ Audit complete
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
                      : 'border-white/[0.08] bg-white/[0.035]'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                        {arrivedForOutreach
                          ? '✅ Audit complete — ready for outreach'
                          : 'Next step'}
                      </p>
                      <h3 className="text-xl font-semibold text-white">
                        Turn this audit into outreach
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-slate-400">
                        Use these findings to prepare an email, call script, direct message
                        and follow-up sequence — or jump straight into manual outreach if
                        you just want a quick custom script.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleContinueToOutreach}
                        disabled={!continueToOutreachReady}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-50 ${
                          arrivedForOutreach
                            ? 'bg-violet-600 shadow-[0_8px_24px_rgba(139,92,246,0.35)] hover:bg-violet-500'
                            : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                      >
                        Continue to Outreach →
                      </button>

                      <button
                        onClick={handleOpenManualOutreach}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                      >
                        Manual Outreach
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!auditResult && !isRunning && !auditLimitReached && !errorMsg && (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-500">
                  Enter a URL above and click{' '}
                  <span className="font-medium text-slate-400">Audit Website</span> to get
                  started.
                </p>
                {auditHistory.length > 0 && (
                  <button
                    onClick={() => setActiveView('history')}
                    className="mt-3 text-sm font-medium text-blue-400 underline underline-offset-4 transition-colors hover:text-blue-300"
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
                <h2 className="text-lg font-semibold text-white">Audit history</h2>
                <p className="text-sm text-slate-400">
                  {auditHistory.length} saved report{auditHistory.length !== 1 ? 's' : ''}
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