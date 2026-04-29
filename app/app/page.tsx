'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import MainNavbar from '../../components/layout/MainNavbar'
import ProfileModal from '../../components/profile/ProfileModal'
import {
  getStoredProfile,
  saveStoredProfile,
  DEFAULT_PROFILE,
} from '../../lib/profileStorage'
import type { UserProfile } from '../../lib/profileStorage'
import { getScoreStyles } from '../../lib/scoreColors'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditRecord {
  id: string
  url: string
  date: string
  scores: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
}

interface PlanInfo {
  plan: string
  auditCount: number
  auditLimit: number
  searchCount: number
  searchLimit: number
}

interface LeadSearchRecord {
  id: string
  query: string
  date?: string
  searchedAt?: string
  results?: unknown[]
  leads?: unknown[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avgScore(scores?: Record<string, number | null | undefined>) {
  if (!scores) return 0
  const vals = Object.values(scores).filter(
    (value): value is number => typeof value === 'number'
  )
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

function timeAgo(iso?: string): string {
  if (!iso) return 'recently'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return 'recently'
  const diff = Date.now() - parsed.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7)   return `${days}d ago`
  return parsed.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function planLabel(plan: string): string {
  if (plan === 'agency') return 'Agency'
  if (plan === 'pro')    return 'Pro'
  return 'Free'
}

function planColor(plan: string): string {
  if (plan === 'agency') return 'text-violet-300 bg-violet-500/10 border-violet-500/20'
  if (plan === 'pro')    return 'text-blue-300 bg-blue-500/10 border-blue-500/20'
  return 'text-slate-300 bg-white/[0.04] border-white/[0.08]'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  emoji,
  label,
  value,
  sub,
  href,
  accent = 'blue',
  comingSoon = false,
}: {
  emoji: string
  label: string
  value: string | number
  sub?: string
  href: string
  accent?: 'blue' | 'violet' | 'emerald'
  comingSoon?: boolean
}) {
  const ring = {
    blue:    'group-hover:border-blue-500/40 group-hover:shadow-blue-900/20',
    violet:  'group-hover:border-violet-500/40 group-hover:shadow-violet-900/20',
    emerald: 'group-hover:border-emerald-500/40 group-hover:shadow-emerald-900/20',
  }[accent]

  const iconBg = {
    blue:    'bg-blue-500/15 text-blue-400',
    violet:  'bg-violet-500/15 text-violet-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
  }[accent]

  const arrow = {
    blue:    'text-blue-400 group-hover:translate-x-0.5',
    violet:  'text-violet-400 group-hover:translate-x-0.5',
    emerald: 'text-emerald-400 group-hover:translate-x-0.5',
  }[accent]

  const inner = (
    <div
      className={`group flex flex-col gap-4 rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-sm shadow-[0_16px_40px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.22)] ${ring} ${
        comingSoon ? 'opacity-60 cursor-default' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${iconBg}`}>
          {emoji}
        </div>
        {comingSoon ? (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            soon
          </span>
        ) : (
          <span className={`text-xs font-semibold transition-transform duration-200 ${arrow}`}>
            Open →
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-white tabular-nums leading-none mb-1">
          {value}
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )

  // Coming soon cards are not clickable links
  if (comingSoon) return <div>{inner}</div>
  return <Link href={href}>{inner}</Link>
}

function UsageRow({
  label,
  used,
  limit,
  unlimited,
}: {
  label: string
  used: number
  limit: number
  unlimited: boolean
}) {
  const safeLimit  = limit || 1
  const pct        = unlimited ? 0 : Math.min((used / safeLimit) * 100, 100)
  const isWarn     = !unlimited && pct >= 80
  const isMax      = !unlimited && pct >= 100
  const barColor   = isMax ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-blue-500'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className={isMax ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
          {unlimited ? (
            <span className="text-emerald-400 font-semibold">Unlimited</span>
          ) : (
            `${used} / ${limit}`
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Quick action row ─────────────────────────────────────────────────────────

function QuickActionLink({
  href,
  emoji,
  label,
  sub,
  accent = 'blue',
  comingSoon = false,
}: {
  href: string
  emoji: string
  label: string
  sub: string
  accent?: 'blue' | 'violet' | 'emerald'
  comingSoon?: boolean
}) {
  const hoverBg = {
    blue:    'hover:bg-blue-500/[0.07] hover:border-blue-500/30',
    violet:  'hover:bg-violet-500/[0.07] hover:border-violet-500/30',
    emerald: 'hover:bg-emerald-500/[0.07] hover:border-emerald-500/30',
  }[accent]

  const labelHover = {
    blue:    'group-hover:text-blue-200',
    violet:  'group-hover:text-violet-200',
    emerald: 'group-hover:text-emerald-200',
  }[accent]

  const arrowHover = {
    blue:    'group-hover:text-blue-400',
    violet:  'group-hover:text-violet-400',
    emerald: 'group-hover:text-emerald-400',
  }[accent]

  const inner = (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03] transition-all group ${
        comingSoon ? 'opacity-50 cursor-default' : hoverBg
      }`}
    >
      <span className="text-lg">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium text-white transition-colors ${comingSoon ? '' : labelHover}`}>
            {label}
          </p>
          {comingSoon && (
            <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              soon
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      {!comingSoon && (
        <span className={`text-slate-600 text-sm transition-colors ${arrowHover}`}>→</span>
      )}
    </div>
  )

  if (comingSoon) return <div>{inner}</div>
  return <Link href={href}>{inner}</Link>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [sessionEmail, setSessionEmail]   = useState<string | null>(null)
  const [authReady, setAuthReady]         = useState(false)

  // ── Profile ───────────────────────────────────────────────────────────────
  // ✅ FIXED — proper state instead of DOM hack
  const [profile, setProfile]                     = useState<UserProfile>(DEFAULT_PROFILE)
  const [showProfileModal, setShowProfileModal]   = useState(false)
  const [profileComplete, setProfileComplete]     = useState(false)

  // ── Data ──────────────────────────────────────────────────────────────────
  const [planInfo, setPlanInfo]         = useState<PlanInfo | null>(null)
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([])
  const [leadHistory, setLeadHistory]   = useState<LeadSearchRecord[]>([])
  const [callCount, setCallCount]       = useState(0)

  // ─── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }
      setSessionUserId(session.user.id)
      setSessionEmail(session.user.email ?? null)
      setAuthReady(true)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.push('/signin')
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  // ─── Profile ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authReady) return
    const stored = getStoredProfile()
    if (stored) {
      setProfile(stored)
      setProfileComplete(
        !!(stored.yourName && stored.yourCompany && stored.yourSpecialty)
      )
    }
  }, [authReady])

  // ✅ FIXED — proper save handler, no DOM hack
  const handleSaveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile)
    saveStoredProfile(nextProfile)
    setProfileComplete(
      !!(nextProfile.yourName && nextProfile.yourCompany && nextProfile.yourSpecialty)
    )
  }

  // ─── Plan / usage ──────────────────────────────────────────────────────────

  const fetchPlan = useCallback(async () => {
    if (!sessionUserId) return
    try {
      const res  = await fetch('/api/user-plan', {
        headers: { 'x-user-id': sessionUserId },
      })
      const json = await res.json()
      if (json.success) setPlanInfo(json.data)
    } catch {}
  }, [sessionUserId])

  useEffect(() => {
    if (authReady && sessionUserId) fetchPlan()
  }, [authReady, sessionUserId, fetchPlan])

  // ─── Load localStorage data ────────────────────────────────────────────────

  useEffect(() => {
    if (!authReady) return

    // Audit history
    try {
      const raw = localStorage.getItem('siteSignalAuditHistory')
      if (raw) {
        const parsed = JSON.parse(raw)
        const normalised: AuditRecord[] = parsed.map((entry: any) => ({
          id:   entry.id   ?? `${Date.now()}-${Math.random()}`,
          url:  entry.url  ?? '',
          date: entry.date ?? entry.savedAt ?? new Date().toISOString(),
          scores: entry.scores
            ? {
                performance:    entry.scores.mobile?.performance    ?? entry.scores.performance    ?? 0,
                accessibility:  entry.scores.mobile?.accessibility  ?? entry.scores.accessibility  ?? 0,
                bestPractices:  entry.scores.mobile?.bestPractices  ?? entry.scores.bestPractices  ?? 0,
                seo:            entry.scores.mobile?.seo            ?? entry.scores.seo            ?? 0,
              }
            : {
                performance:    entry.performance    ?? 0,
                accessibility:  entry.accessibility  ?? 0,
                bestPractices:  entry.bestPractices  ?? 0,
                seo:            entry.seo            ?? 0,
              },
        }))
        setAuditHistory(normalised)
      }
    } catch {}

    // Lead search history
    try {
      const raw = localStorage.getItem('siteSignalLeadSearchHistory')
      if (raw) setLeadHistory(JSON.parse(raw))
    } catch {}
  }, [authReady])

  // ─── Call list count ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionUserId) return
    const load = async () => {
      try {
        const res  = await fetch('/api/call-list', {
          headers: { 'x-user-id': sessionUserId },
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setCallCount(json.data.length)
        } else if (Array.isArray(json.items)) {
          setCallCount(json.items.length)
        }
      } catch {}
    }
    load()
  }, [sessionUserId])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/')
  }, [router])

  // ─── Loading gate ──────────────────────────────────────────────────────────

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500/40 border-t-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const firstName           = profile?.yourName ? profile.yourName.split(' ')[0] : 'there'
  const recentAudits        = auditHistory.slice(0, 3)
  const unlimited           = planInfo?.plan === 'pro' || planInfo?.plan === 'agency'
  const latestLeadSearchAt  = leadHistory[0]?.date || leadHistory[0]?.searchedAt

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.13),transparent_55%),linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
      <MainNavbar
        sessionEmail={sessionEmail}
        isLoggedIn={!!sessionUserId}
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onSignOut={handleSignOut}
      />

      {/* ── Background glows ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-500/[0.07] blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-emerald-500/[0.04] blur-3xl" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 space-y-10">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400 mb-2">
              Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-2 text-slate-400 text-base">
              Find leads, audit websites, prepare outreach, and keep your next calls organised.
            </p>
          </div>

          {planInfo && (
            <div
              className={`self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${planColor(planInfo.plan)}`}
            >
              <span>
                {planInfo.plan === 'agency' ? '🏢' : planInfo.plan === 'pro' ? '⚡' : '🌱'}
              </span>
              {planLabel(planInfo.plan)} plan
            </div>
          )}
        </div>

        {/* ── Stat cards ── */}
        {/* Pipeline card is comingSoon until /app/pipeline is built */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            emoji="🎯"
            label="Lead searches"
            value={leadHistory.length}
            sub={
              leadHistory.length > 0
                ? `Last: ${timeAgo(latestLeadSearchAt)}`
                : 'Search your first niche'
            }
            href="/app/leads"
            accent="blue"
          />
          <StatCard
            emoji="📊"
            label="Audits run"
            value={auditHistory.length}
            sub={
              auditHistory.length > 0
                ? `Last: ${timeAgo(auditHistory[0]?.date)}`
                : 'Audit your first site'
            }
            href="/app/audit"
            accent="violet"
          />
          <StatCard
            emoji="📞"
            label="Call pipeline"
            value={callCount}
            sub={callCount > 0 ? 'Follow-ups waiting' : 'No calls queued yet'}
            href="/app/pipeline"
            accent="emerald"
            comingSoon={true}
          />
        </div>

        {/* ── Recent audits ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-violet-400">📋</span>
              Recent audits
            </h2>
            <Link
              href="/app/audit"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>

          {recentAudits.length === 0 ? (
            <div className="border border-white/[0.08] bg-white/[0.035] rounded-[24px] p-10 text-center backdrop-blur-sm">
              <div className="text-4xl mb-3 opacity-40">📂</div>
              <h3 className="text-white font-semibold mb-1">No audits yet</h3>
              <p className="text-slate-400 text-sm mb-5 max-w-xs mx-auto">
                Run your first audit to see scores and AI insights here.
              </p>
              <Link
                href="/app/audit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
              >
                Run an audit →
              </Link>
            </div>
          ) : (
            <div className="border border-white/[0.08] bg-white/[0.035] rounded-[24px] backdrop-blur-sm shadow-[0_16px_40px_rgba(0,0,0,0.15)] divide-y divide-white/[0.05] overflow-hidden">
              {recentAudits.map((audit) => {
                const avg    = avgScore(audit.scores ?? undefined)
                const styles = getScoreStyles(avg)

                return (
                  <Link
                    key={audit.id}
                    href={`/app/audit?url=${encodeURIComponent(audit.url)}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.025] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-blue-200 transition-colors">
                        {audit.url.replace(/^https?:\/\//, '')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {timeAgo(audit.date)}
                      </p>
                    </div>

                    {/* Desktop — individual score pills */}
                    {audit.scores && (
                      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        {Object.entries(audit.scores).map(([key, val]) => {
                          const s = getScoreStyles(val)
                          const shortKey: Record<string, string> = {
                            performance:   'Perf',
                            accessibility: 'A11y',
                            bestPractices: 'Best',
                            seo:           'SEO',
                          }
                          return (
                            <div
                              key={key}
                              className={`flex flex-col items-center rounded-lg px-2 py-1 border ${s.panel}`}
                            >
                              <span className={`text-sm font-bold tabular-nums ${s.text}`}>
                                {val}
                              </span>
                              <span className="text-[9px] text-slate-500 leading-none mt-0.5">
                                {shortKey[key] ?? key}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Mobile — single average score */}
                    <div
                      className={`sm:hidden flex-shrink-0 px-3 py-1 rounded-full border text-sm font-bold tabular-nums ${styles.panel} ${styles.text}`}
                    >
                      {avg}
                    </div>

                    <span className="text-slate-600 group-hover:text-slate-400 text-sm transition-colors flex-shrink-0">
                      →
                    </span>
                  </Link>
                )
              })}

              {auditHistory.length > 3 && (
                <div className="px-6 py-3 text-center">
                  <Link
                    href="/app/audit"
                    className="text-xs text-slate-500 hover:text-blue-400 font-medium transition-colors"
                  >
                    + {auditHistory.length - 3} more in history →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Usage + Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Usage this month */}
          <div className="border border-white/[0.08] bg-white/[0.035] rounded-[24px] p-6 backdrop-blur-sm shadow-[0_16px_40px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>📈</span> Usage this month
              </h2>
              {planInfo?.plan === 'free' && (
                <Link
                  href="/pricing"
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/20 rounded-full px-2.5 py-1 hover:border-blue-400/40"
                >
                  Upgrade
                </Link>
              )}
            </div>

            {planInfo ? (
              <div className="space-y-4">
                <UsageRow
                  label="Audits"
                  used={planInfo.auditCount}
                  limit={planInfo.auditLimit}
                  unlimited={!!unlimited}
                />
                <UsageRow
                  label="Lead searches"
                  used={planInfo.searchCount}
                  limit={planInfo.searchLimit}
                  unlimited={!!unlimited}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-4 rounded-full bg-white/[0.05] animate-pulse" />
                <div className="h-4 rounded-full bg-white/[0.05] animate-pulse w-3/4" />
              </div>
            )}

            {planInfo?.plan === 'free' && (
              <p className="text-xs text-slate-500 mt-4">
                Resets on the 1st of each month.
              </p>
            )}
          </div>

          {/* Quick actions */}
          <div className="border border-white/[0.08] bg-white/[0.035] rounded-[24px] p-6 backdrop-blur-sm shadow-[0_16px_40px_rgba(0,0,0,0.15)]">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
              <span>⚡</span> Quick actions
            </h2>

            <div className="space-y-2.5">
              <QuickActionLink
                href="/app/leads"
                emoji="🔍"
                label="Find leads"
                sub="Search by industry + location"
                accent="blue"
              />
              <QuickActionLink
                href="/app/audit"
                emoji="📊"
                label="Audit a website"
                sub="Run PageSpeed + AI report"
                accent="blue"
              />
              {/* ✅ Outreach + Pipeline show as coming soon until pages are built */}
              {/* Remove comingSoon prop from each when the page is live */}
              <QuickActionLink
                href="/app/outreach"
                emoji="✉️"
                label="Prepare outreach"
                sub="Write email, DM, and call scripts"
                accent="violet"
                comingSoon={true}
              />
              <QuickActionLink
                href="/app/pipeline"
                emoji="📞"
                label="Open pipeline"
                sub="Track calls, replies, and reminders"
                accent="emerald"
                comingSoon={true}
              />
              <QuickActionLink
                href="/pricing"
                emoji="🚀"
                label={
                  planInfo?.plan === 'free'
                    ? 'Upgrade to Pro'
                    : planInfo?.plan === 'pro'
                    ? 'View Agency plan'
                    : 'Manage plan'
                }
                sub={
                  planInfo?.plan === 'free'
                    ? 'Unlock unlimited audits + leads'
                    : "See what's included"
                }
                accent="violet"
              />
            </div>
          </div>
        </div>

        {/* ── Profile incomplete banner ── */}
        {/* ✅ FIXED — uses setShowProfileModal instead of DOM hack */}
        {!profileComplete && (
          <div className="border border-amber-500/20 bg-amber-500/[0.05] rounded-[24px] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300 mb-0.5">
                ✏️ Complete your profile
              </p>
              <p className="text-xs text-slate-400">
                Add your name, company and specialty so your audit reports and
                outreach emails auto-fill correctly.
              </p>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-sm font-semibold transition-all"
            >
              Set up profile →
            </button>
          </div>
        )}
      </main>

      {/* ── Profile modal ── */}
      {/* ✅ ADDED — was completely missing, replaced DOM hack */}
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