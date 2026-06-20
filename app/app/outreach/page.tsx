'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import { useSupabaseSession } from '../../../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../../../lib/nextPageProps'
import AppPageShell from '../../../components/layout/AppPageShell'
import PageIntroCard from '../../../components/layout/PageIntroCard'
import ProfileModal from '../../../components/profile/ProfileModal'
import OutreachTabs from '../../../components/OutreachTabs'
import { Card, CardContent } from '../../../components/ui/card'
import {
  getStoredProfile,
  saveStoredProfile,
  DEFAULT_PROFILE,
} from '../../../lib/profileStorage'
import type { UserProfile } from '../../../lib/profileStorage'
import { getScoreStyles } from '../../../lib/scoreColors'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadData {
  title?: string
  business_name?: string
  domain?: string
  url?: string
  website_url?: string
  lead_temperature?: string
  leadTemp?: string
  lead_temp?: string
  opportunity_score?: number
  opportunityScore?: number
  industry?: string
  location?: string
  [key: string]: unknown
}

interface AuditScores {
  performance?: number
  seo?: number
  accessibility?: number
  bestPractices?: number
}

interface AuditReport {
  executiveSummary?: string
  keyIssues?: string[]
  businessImpact?: string | string[]
  [key: string]: unknown
}

interface AuditResult {
  url?: string
  scores?: {
    mobile?: AuditScores
    desktop?: AuditScores
  }
  aiReport?: AuditReport
}

interface OutreachContent {
  call_script?: string
  email_subject?: string
  email_body?: string
  follow_up_body?: string
  dm_body?: string
}

interface ClientContact {
  contactName: string
  contactPhone: string
  notes: string
}

// ─── Score card ───────────────────────────────────────────────────────────────

function MiniScoreCard({ label, value }: { label: string; value: number | undefined }) {
  const styles = getScoreStyles(value ?? 0)
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-4">
      <span className={`text-2xl font-bold ${styles.text}`}>{value ?? '—'}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

// ─── Temp badge ───────────────────────────────────────────────────────────────

function TempBadge({ temp }: { temp: string }) {
  const upper = (temp || 'NEW').toUpperCase()
  const styles: Record<string, string> = {
    HOT: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    WARM: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    NEW: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  }
  const icons: Record<string, string> = { HOT: '🔥', WARM: '☀️', NEW: '✨' }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${styles[upper] || styles.NEW}`}
    >
      {icons[upper] || '✨'} {upper}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutreachPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <Card className="max-w-md border-border bg-card">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Loading outreach…
            </CardContent>
          </Card>
        </div>
      }
    >
      <OutreachPageInner />
    </Suspense>
  )
}

function OutreachPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { email: sessionEmail, userId: sessionUserId, loading: authLoading } =
    useSupabaseSession()
  const authReady = !authLoading

  const [showProfileModal, setShowProfileModal] = useState(false)

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)

  const mode = searchParams.get('mode') || 'manual'
  const urlParam = searchParams.get('url') || ''
  const titleParam = searchParams.get('title') || ''
  const domainParam = searchParams.get('domain') || ''

  const [leadData, setLeadData] = useState<LeadData | null>(null)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [auditMode, setAuditMode] = useState<'mobile' | 'desktop'>('mobile')

  // Client contact details (new)
  const [clientContact, setClientContact] = useState<ClientContact>({
    contactName: '',
    contactPhone: '',
    notes: '',
  })

  const [outreachContent, setOutreachContent] = useState<OutreachContent | null>(null)
  const [outreachLoading, setOutreachLoading] = useState(false)
  const [outreachError, setOutreachError] = useState('')
  const [usedFormats, setUsedFormats] = useState<Record<string, boolean>>({})
  const autoGeneratedRef = useRef(false)

  const [addedToCallList, setAddedToCallList] = useState(false)
  const [markedContacted, setMarkedContacted] = useState(false)
  const [callListLoading, setCallListLoading] = useState(false)
  const [contactedLoading, setContactedLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  // ─── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authReady) return
    if (!sessionUserId) router.replace('/signin')
  }, [authReady, router, sessionUserId])

  // ─── Profile ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authReady) return
    const stored = getStoredProfile()
    if (stored) setProfile(stored)
  }, [authReady])

  const handleSaveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile)
    saveStoredProfile(nextProfile)
  }

  // ─── Read session context ─────────────────────────────────────────────────
  useEffect(() => {
    if (!authReady) return
    try {
      const rawLead = sessionStorage.getItem('pendingOutreachLead')
      const rawAudit = sessionStorage.getItem('pendingAuditResult')
      if (rawLead) setLeadData(JSON.parse(rawLead))
      else if (urlParam || titleParam || domainParam) {
        setLeadData({ title: titleParam || domainParam || urlParam, url: urlParam, domain: domainParam })
      }
      if (rawAudit) setAuditResult(JSON.parse(rawAudit))
    } catch {
      if (urlParam || titleParam) {
        setLeadData({ title: titleParam, url: urlParam, domain: domainParam })
      }
    }
  }, [authReady, urlParam, titleParam, domainParam])

  // ─── Auto-generate in audited mode ───────────────────────────────────────
  useEffect(() => {
    if (
      mode !== 'audited' ||
      !authReady ||
      !sessionUserId ||
      !leadData ||
      outreachContent ||
      autoGeneratedRef.current
    ) return
    autoGeneratedRef.current = true
    handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, authReady, sessionUserId, leadData, auditResult])

  // ─── Derived values ───────────────────────────────────────────────────────
  const businessName = useMemo(() => (
    leadData?.business_name || leadData?.title || leadData?.domain || domainParam || titleParam || 'Unknown Business'
  ), [leadData, domainParam, titleParam])

  const websiteUrl = useMemo(() => (
    leadData?.url || leadData?.website_url || urlParam || ''
  ), [leadData, urlParam])

  const domain = useMemo(() => (
    leadData?.domain || domainParam || ''
  ), [leadData, domainParam])

  const leadTemp = useMemo(() => (
    leadData?.lead_temperature || leadData?.leadTemp || leadData?.lead_temp || ''
  ), [leadData])

  const opportunityScore = useMemo(() => (
    leadData?.opportunity_score ?? leadData?.opportunityScore ?? null
  ), [leadData])

  const activeScores = useMemo<AuditScores | undefined>(() => {
    if (!auditResult?.scores) return undefined
    return auditMode === 'mobile' ? auditResult.scores.mobile : auditResult.scores.desktop
  }, [auditResult, auditMode])

  const aiReport = useMemo<AuditReport | undefined>(() => auditResult?.aiReport, [auditResult])

  const hasAuditData = !!(auditResult && activeScores)

  // ─── Build audit context for API ──────────────────────────────────────────
  const buildAuditContext = () => {
    if (!auditResult || !activeScores) return null
    return {
      performance: activeScores.performance,
      seo: activeScores.seo,
      accessibility: activeScores.accessibility,
      bestPractices: activeScores.bestPractices,
      executiveSummary: aiReport?.executiveSummary,
      keyIssues: aiReport?.keyIssues,
      businessImpact: aiReport?.businessImpact,
    }
  }

  // ─── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!sessionUserId || !leadData) return
    setOutreachLoading(true)
    setOutreachError('')

    try {
      const auditContext = buildAuditContext()

      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionUserId,
        },
        body: JSON.stringify({
          lead: leadData,
          auditContext,
          profile: {
            yourName: profile.yourName,
            yourCompany: profile.yourCompany,
            yourTitle: profile.yourTitle,
            yourLocation: profile.yourLocation,
            yourSpecialty: profile.yourSpecialty,
          },
          clientContact,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not generate outreach.')
      setOutreachContent(data.content || data.outreach)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setOutreachError(msg)
    } finally {
      setOutreachLoading(false)
    }
  }

  // ─── Pipeline actions ─────────────────────────────────────────────────────
  const handleAddToCallList = async () => {
    if (!sessionUserId || !leadData || addedToCallList) return
    setCallListLoading(true)
    setActionError('')
    try {
      const res = await fetch('/api/call-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': sessionUserId },
        body: JSON.stringify({ businessName, websiteUrl, domain, notes: clientContact.notes || '' }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not add to call list.')
      setAddedToCallList(true)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to add to call list.')
    } finally {
      setCallListLoading(false)
    }
  }

  const handleMarkContacted = async () => {
    if (!sessionUserId || !leadData || markedContacted) return
    setContactedLoading(true)
    setActionError('')
    try {
      const res = await fetch('/api/update-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': sessionUserId },
        body: JSON.stringify({ domain, lead_status: 'Contacted' }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not update lead status.')
      setMarkedContacted(true)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark as contacted.')
    } finally {
      setContactedLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // ─── Auth guard ───────────────────────────────────────────────────────────
  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md border-border bg-card">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            Loading…
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AppPageShell
      title="Outreach"
      description={mode === 'audited' ? 'Audit-backed outreach scripts' : 'Manual outreach workspace'}
    >
      <PageIntroCard
        title={mode === 'audited' ? 'Audit-backed outreach' : 'Manual outreach'}
        description={
          mode === 'audited'
            ? 'Your call script and emails are generated from real audit findings — specific, credible, and ready to use.'
            : 'Generate a client-ready call script and emails using the lead details below.'
        }
      />

        <div className="space-y-8">

          {/* ── Section 1: Target Summary ─────────────────────────────── */}
          <section
            aria-labelledby="target-heading"
            className="overflow-hidden ss-panel-elevated"
          >
            <div className="relative overflow-hidden border-b border-border bg-secondary/30 px-6 py-5 sm:px-10">
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/[0.10] blur-3xl" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-lg">
                  🎯
                </div>
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Target</p>
                  <h2 id="target-heading" className="text-lg font-bold text-foreground sm:text-xl">
                    {businessName}
                  </h2>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 sm:px-10">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                  <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Website</dt>
                  <dd className="text-sm font-medium text-slate-200">
                    {websiteUrl ? (
                      <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="truncate text-slate-200 underline-offset-2 hover:underline">
                        {websiteUrl}
                      </a>
                    ) : <span className="text-muted-foreground">—</span>}
                  </dd>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                  <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Domain</dt>
                  <dd className="text-sm font-medium text-slate-200">{domain || <span className="text-muted-foreground">—</span>}</dd>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                  <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Temperature</dt>
                  <dd>{leadTemp ? <TempBadge temp={leadTemp} /> : <span className="text-sm text-muted-foreground">—</span>}</dd>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                  <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Opportunity</dt>
                  <dd className="text-sm font-medium text-slate-200">
                    {opportunityScore != null ? (
                      <span className="font-bold text-emerald-400">
                        {opportunityScore}<span className="ml-0.5 text-xs font-normal text-muted-foreground">/100</span>
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ── Section 2: Client Contact Details (NEW) ───────────────── */}
          <section
            aria-labelledby="client-details-heading"
            className="overflow-hidden ss-panel-elevated"
          >
            <div className="relative overflow-hidden border-b border-border bg-secondary/30 px-6 py-5 sm:px-10">
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/[0.08] blur-3xl" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-lg">
                  👤
                </div>
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Optional</p>
                  <h2 id="client-details-heading" className="text-lg font-bold text-foreground">
                    Client contact details
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    If you know who you're calling or emailing, add their details here — the script will use their name.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 sm:px-10">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Contact name
                  </label>
                  <input
                    type="text"
                    value={clientContact.contactName}
                    onChange={(e) => setClientContact((prev) => ({ ...prev, contactName: e.target.value }))}
                    placeholder="e.g. Sarah"
                    className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Phone number
                  </label>
                  <input
                    type="text"
                    value={clientContact.contactPhone}
                    onChange={(e) => setClientContact((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="e.g. 0412 345 678"
                    className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={clientContact.notes}
                    onChange={(e) => setClientContact((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. spoke before, runs a cafe"
                    className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {clientContact.contactName && (
                <p className="mt-3 text-xs text-emerald-400">
                  ✓ Scripts will open with &quot;Hi {clientContact.contactName}&quot; — regenerate to apply.
                </p>
              )}
            </div>
          </section>

          {/* ── Section 3: Audit Summary (audited mode) ───────────────── */}
          {mode === 'audited' && (
            <section
              aria-labelledby="audit-summary-heading"
              className="overflow-hidden ss-panel-elevated"
            >
              <div className="relative overflow-hidden border-b border-border bg-secondary/30 px-6 py-5 sm:px-10">
                <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/[0.10] blur-3xl" />
                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-lg">
                      📊
                    </div>
                    <div>
                      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Audit Results</p>
                      <h2 id="audit-summary-heading" className="text-lg font-bold text-foreground">
                        Website performance summary
                      </h2>
                    </div>
                  </div>

                  {hasAuditData && (
                    <div className="flex self-start gap-1 rounded-2xl border border-border bg-secondary/30 p-1 sm:self-center">
                      {(['mobile', 'desktop'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAuditMode(m)}
                          className={`rounded-xl px-4 py-1.5 text-xs font-semibold capitalize transition ${
                            auditMode === m ? 'bg-blue-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {m === 'mobile' ? '📱' : '🖥️'} {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-5 sm:px-10">
                {!hasAuditData ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] text-xl">⚠️</div>
                    <p className="font-semibold text-amber-300">No audit data available</p>
                    <p className="mt-1 text-sm text-muted-foreground">Run an audit first to get outreach that references real findings.</p>
                    <button                       type="button"
                      onClick={() =>
                        router.push(
                          `/app/audit${websiteUrl
                            ? `?url=${encodeURIComponent(websiteUrl)}&title=${encodeURIComponent(businessName)}&domain=${encodeURIComponent(domain)}&next=outreach`
                            : ''
                          }`
                        )
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/20 px-5 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/30"
                    >
                      Audit Website first →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <MiniScoreCard label="Performance" value={activeScores?.performance} />
                      <MiniScoreCard label="SEO" value={activeScores?.seo} />
                      <MiniScoreCard label="Accessibility" value={activeScores?.accessibility} />
                      <MiniScoreCard label="Best Practices" value={activeScores?.bestPractices} />
                    </div>

                    {aiReport?.executiveSummary && (
                      <div className="rounded-2xl border border-border bg-secondary/30 px-5 py-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Executive Summary
                        </p>
                        <p className="text-sm leading-relaxed text-secondary-foreground">
                          {aiReport.executiveSummary}
                        </p>
                      </div>
                    )}

                    {aiReport?.keyIssues && aiReport.keyIssues.length > 0 && (
                      <div className="rounded-2xl border border-border bg-secondary/30 px-5 py-4">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Top Issues Found
                        </p>
                        <ul className="space-y-2">
                          {aiReport.keyIssues.slice(0, 5).map((issue, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-secondary-foreground">
                              <span className="mt-0.5 flex-shrink-0 text-rose-400">✕</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiReport?.businessImpact && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] px-5 py-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
                          Why This Matters Commercially
                        </p>
                        <p className="text-sm leading-relaxed text-secondary-foreground">
                          {Array.isArray(aiReport.businessImpact)
                            ? aiReport.businessImpact.join(' ')
                            : aiReport.businessImpact}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Section 4: Generate / Regenerate button ───────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[28px] border border-border bg-card px-6 py-5 sm:px-10 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {outreachContent ? '🔄 Regenerate outreach' : '✉️ Generate your outreach kit'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {outreachContent
                  ? 'Updated your client details or want a fresh version? Regenerate below.'
                  : 'Creates your call script, cold email, follow-up and DM in one go.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={outreachLoading || !leadData}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {outreachLoading ? (
                <>
                  <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Generating…
                </>
              ) : outreachContent ? (
                <>🔄 Regenerate</>
              ) : (
                <>✉️ Generate Outreach Kit</>
              )}
            </button>
          </div>

          {/* ── Section 5: Outreach Tabs ──────────────────────────────── */}
          <OutreachTabs
            outreach={outreachContent}
            isLoading={outreachLoading}
            error={outreachError}
            usedFormats={usedFormats}
            onMarkUsed={(format: string) =>
              setUsedFormats((prev) => ({ ...prev, [format]: true }))
            }
          />

          {/* ── Section 6: Pipeline Actions ───────────────────────────── */}
          {(outreachContent || mode === 'manual') && (
            <section
              aria-labelledby="pipeline-heading"
              className="overflow-hidden ss-panel-elevated"
            >
              <div className="relative overflow-hidden border-b border-border bg-secondary/30 px-6 py-5 sm:px-10">
                <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/[0.08] blur-3xl" />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-lg">
                    🚀
                  </div>
                  <div>
                    <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Next Steps
                    </p>
                    <h2 id="pipeline-heading" className="text-lg font-bold text-foreground">
                      Pipeline actions
                    </h2>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 sm:px-10">
                {actionError && (
                  <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3">
                    <p className="text-sm text-rose-400">{actionError}</p>
                  </div>
                )}

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Add to call list */}
                  <button
                    type="button"
                    onClick={handleAddToCallList}
                    disabled={callListLoading || addedToCallList}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                      addedToCallList
                        ? 'cursor-default border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-border bg-secondary/50 text-slate-200 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50'
                    }`}
                  >
                    {callListLoading ? (
                      <>
                        <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Adding…
                      </>
                    ) : addedToCallList ? (
                      <>✅ Added to Call List</>
                    ) : (
                      <>📞 Add to Call List</>
                    )}
                  </button>

                  {/* Mark as contacted */}
                  <button
                    type="button"
                    onClick={handleMarkContacted}
                    disabled={contactedLoading || markedContacted}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                      markedContacted
                        ? 'cursor-default border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-border bg-secondary/50 text-slate-200 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50'
                    }`}
                  >
                    {contactedLoading ? (
                      <>
                        <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Updating…
                      </>
                    ) : markedContacted ? (
                      <>✅ Marked as Contacted</>
                    ) : (
                      <>📤 Mark as Contacted</>
                    )}
                  </button>
                </div>

                {/* Phone number quick reference */}
                {clientContact.contactPhone && (
                  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3">
                    <span className="text-secondary-foreground">📞</span>
                    <div>
                      <p className="text-xs font-semibold text-blue-300">Ready to call</p>
                      <p className="text-sm font-bold text-foreground">{clientContact.contactPhone}</p>
                      {clientContact.contactName && (
                        <p className="text-xs text-muted-foreground">Ask for {clientContact.contactName}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation links */}
                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={() => router.push('/app/leads')}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/30 px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary hover:text-foreground"
                  >
                    ← Back to Leads
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/app/pipeline')}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    📋 View Pipeline →
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/app/audit')}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/30 px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary hover:text-foreground"
                  >
                    🔍 Run Another Audit
                  </button>

                  {mode !== 'audited' && websiteUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams({
                          url: websiteUrl,
                          title: businessName,
                          domain,
                          next: 'outreach',
                        })
                        router.push(`/app/audit?${params.toString()}`)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20"
                    >
                      📊 Upgrade to Audited Outreach
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

        </div>

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