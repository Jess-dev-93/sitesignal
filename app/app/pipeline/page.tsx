'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import { useSupabaseSession } from '../../../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../../../lib/nextPageProps'
import AppPageShell from '../../../components/layout/AppPageShell'
import PageIntroCard from '../../../components/layout/PageIntroCard'
import ProfileModal from '../../../components/profile/ProfileModal'
import CallListPanel from '../../../components/CallListPanel'
import { Card, CardContent } from '../../../components/ui/card'
import {
  getStoredProfile,
  saveStoredProfile,
  DEFAULT_PROFILE,
} from '../../../lib/profileStorage'
import type { UserProfile } from '../../../lib/profileStorage'

// ─── Types ────────────────────────────────────────────────────────────────────

type CallListLead = {
  id: string
  business_name: string
  website_url: string
  display_url?: string
  snippet?: string
  industry?: string
  location?: string
  quick_health_score?: number
  opportunity_score?: number
  lead_temperature?: string
  lead_status?: string
  quick_issues?: string[]
  suburb?: string
  notes?: string
}

type CallListItem = {
  id: string
  status: string
  priority?: number
  note?: string
  follow_up_date?: string
  reminder_note?: string
  leads: CallListLead | null
}

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

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  queued: {
    label: 'Queued',
    icon: '📋',
    color: 'text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  calling_now: {
    label: 'Calling Now',
    icon: '📲',
    color: 'text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  called: {
    label: 'Called',
    icon: '✅',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  voicemail: {
    label: 'Voicemail',
    icon: '📬',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  follow_up: {
    label: 'Follow Up',
    icon: '🔁',
    color: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  count,
  color,
  bg,
  border,
}: {
  icon: string
  label: string
  count: number
  color: string
  bg: string
  border: string
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 ${bg} ${border}`}
    >
      <span className="text-base">{icon}</span>
      <div>
        <p className={`text-xl font-bold ${color}`}>{count}</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const router = useRouter()
  const { email: sessionEmail, userId: sessionUserId, loading: authLoading } =
    useSupabaseSession()
  const authReady = !authLoading

  // ── Profile ───────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // ── Call list ─────────────────────────────────────────────────────────────
  const [callList, setCallList] = useState<CallListItem[]>([])
  const [callListLoading, setCallListLoading] = useState(true)

  // ── Quick add ─────────────────────────────────────────────────────────────
  const [quickAddName, setQuickAddName] = useState('')
  const [quickAddUrl, setQuickAddUrl] = useState('')
  const [quickAddLoading, setQuickAddLoading] = useState(false)
  const [quickAddError, setQuickAddError] = useState('')
  const [quickAddSuccess, setQuickAddSuccess] = useState(false)

  // ── Active status filter ──────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<string>('all')

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

  useEffect(() => {
    if (!authReady) return
    const raw = sessionStorage.getItem('pendingPipelineAdd')
    if (!raw) return

    try {
      const lead = JSON.parse(raw) as WorkspaceLead
      if (lead.title) setQuickAddName(lead.title)
      if (lead.url) setQuickAddUrl(lead.url)
    } catch {
      // ignore invalid payload
    } finally {
      sessionStorage.removeItem('pendingPipelineAdd')
    }
  }, [authReady])

  const handleSaveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile)
    saveStoredProfile(nextProfile)
  }

  // ─── Fetch call list ──────────────────────────────────────────────────────
  const fetchCallList = useCallback(async () => {
    if (!sessionUserId) return
    setCallListLoading(true)
    try {
      const res = await fetch('/api/call-list', {
        headers: { 'x-user-id': sessionUserId },
      })
      const data = await res.json()
      if (data.success) {
        setCallList(data.data || [])
      }
    } catch {
      // silent
    } finally {
      setCallListLoading(false)
    }
  }, [sessionUserId])

  useEffect(() => {
    if (authReady && sessionUserId) fetchCallList()
  }, [authReady, sessionUserId, fetchCallList])

  // ─── Remove from call list ────────────────────────────────────────────────
  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/call-list/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': sessionUserId! },
      })
      setCallList((prev) => prev.filter((item) => item.id !== id))
    } catch {
      // silent
    }
  }

  // ─── Update status ────────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/call-list/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionUserId!,
        },
        body: JSON.stringify({ status }),
      })
      setCallList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      )
    } catch {
      // silent
    }
  }

  // ─── Update reminder ──────────────────────────────────────────────────────
  const handleUpdateReminder = async (
    id: string,
    followUpDate: string,
    reminderNote: string
  ) => {
    try {
      await fetch(`/api/call-list/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionUserId!,
        },
        body: JSON.stringify({
          follow_up_date: followUpDate || null,
          reminder_note: reminderNote || null,
        }),
      })
      setCallList((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, follow_up_date: followUpDate, reminder_note: reminderNote }
            : item
        )
      )
    } catch {
      // silent
    }
  }

  // ─── Generate pitch → go to outreach ─────────────────────────────────────
  const handleGeneratePitch = (lead: CallListLead) => {
    const workspaceLead: WorkspaceLead = {
      title: lead.business_name,
      url: lead.website_url,
      domain: lead.website_url
        ? (() => {
            try {
              return new URL(lead.website_url).hostname.replace(/^www\./, '')
            } catch {
              return lead.website_url
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .split('/')[0]
            }
          })()
        : '',
      leadTemp: lead.lead_temperature?.toUpperCase(),
      opportunityScore: lead.opportunity_score,
      problems: lead.quick_issues || [],
    }

    sessionStorage.setItem('pendingOutreachLead', JSON.stringify(workspaceLead))

    const params = new URLSearchParams({
      mode: 'manual',
      url: lead.website_url || '',
      title: lead.business_name || '',
      domain: workspaceLead.domain || '',
    })

    router.push(`/app/outreach?${params.toString()}`)
  }

  // ─── Run full audit ───────────────────────────────────────────────────────
  const handleRunFullAudit = (lead: WorkspaceLead) => {
    if (!lead.url) return

    sessionStorage.setItem('pendingAuditLead', JSON.stringify(lead))

    const params = new URLSearchParams({
      url: lead.url,
      title: lead.title || '',
      domain: lead.domain || '',
    })

    router.push(`/app/audit?${params.toString()}`)
  }

  // ─── Open manual outreach ─────────────────────────────────────────────────
  const handleOpenManualOutreach = (lead: WorkspaceLead) => {
    sessionStorage.setItem('pendingOutreachLead', JSON.stringify(lead))

    const params = new URLSearchParams({
      mode: 'manual',
      url: lead.url || '',
      title: lead.title || '',
      domain: lead.domain || '',
    })

    router.push(`/app/outreach?${params.toString()}`)
  }

  // ─── Quick add to call list ───────────────────────────────────────────────
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionUserId || !quickAddName.trim()) return

    setQuickAddLoading(true)
    setQuickAddError('')
    setQuickAddSuccess(false)

    try {
      let url = quickAddUrl.trim()
      if (url && !url.startsWith('http')) url = `https://${url}`

      const domain = url
        ? (() => {
            try {
              return new URL(url).hostname.replace(/^www\./, '')
            } catch {
              return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
            }
          })()
        : ''

      const res = await fetch('/api/call-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionUserId,
        },
        body: JSON.stringify({
          businessName: quickAddName.trim(),
          websiteUrl: url,
          domain,
          notes: '',
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not add to call list.')
      }

      setQuickAddName('')
      setQuickAddUrl('')
      setQuickAddSuccess(true)
      setTimeout(() => setQuickAddSuccess(false), 3000)
      fetchCallList()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add.'
      setQuickAddError(msg)
    } finally {
      setQuickAddLoading(false)
    }
  }

  // ─── Sign out ─────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // ─── Derived stats ────────────────────────────────────────────────────────
  const statusCounts = callList.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})

  const followUpDue = callList.filter((item) => {
    if (!item.follow_up_date) return false
    return new Date(item.follow_up_date) <= new Date()
  }).length

  const filteredList =
    activeFilter === 'all'
      ? callList
      : callList.filter((item) => item.status === activeFilter)

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
    <AppPageShell title="Pipeline" description="Manage your call queue and follow-ups">
      <PageIntroCard
        title="Call queue"
        description="Manage your leads, track call outcomes, and schedule follow-ups."
      />

        <div className="space-y-8">

          {/* ── Stats bar ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatPill
              icon="📋"
              label="Queued"
              count={statusCounts['queued'] || 0}
              color="text-blue-300"
              bg="bg-blue-500/10"
              border="border-blue-500/20"
            />
            <StatPill
              icon="📲"
              label="Calling"
              count={statusCounts['calling_now'] || 0}
              color="text-violet-300"
              bg="bg-violet-500/10"
              border="border-violet-500/20"
            />
            <StatPill
              icon="✅"
              label="Called"
              count={statusCounts['called'] || 0}
              color="text-emerald-300"
              bg="bg-emerald-500/10"
              border="border-emerald-500/20"
            />
            <StatPill
              icon="📬"
              label="Voicemail"
              count={statusCounts['voicemail'] || 0}
              color="text-amber-300"
              bg="bg-amber-500/10"
              border="border-amber-500/20"
            />
            <StatPill
              icon="🔁"
              label="Follow Up"
              count={statusCounts['follow_up'] || 0}
              color="text-rose-300"
              bg="bg-rose-500/10"
              border="border-rose-500/20"
            />
            <StatPill
              icon="⏰"
              label="Due Today"
              count={followUpDue}
              color="text-orange-300"
              bg="bg-orange-500/10"
              border="border-orange-500/20"
            />
          </div>

          {/* ── Follow-up due banner ───────────────────────────────────────── */}
          {followUpDue > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-orange-500/25 bg-orange-500/[0.07] px-5 py-4">
              <span className="mt-0.5 flex-shrink-0 text-lg">⏰</span>
              <div>
                <p className="text-sm font-semibold text-orange-200">
                  {followUpDue} follow-up{followUpDue !== 1 ? 's' : ''} due today
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Review the leads below and update their status after you call.
                </p>
              </div>
            </div>
          )}

          {/* ── Filter tabs ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                activeFilter === 'all'
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              All ({callList.length})
            </button>

            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = statusCounts[key] || 0
              if (count === 0) return null
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    activeFilter === key
                      ? `${cfg.border} ${cfg.bg} ${cfg.color}`
                      : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  {cfg.icon} {cfg.label} ({count})
                </button>
              )
            })}
          </div>

          {/* ── Call list ─────────────────────────────────────────────────── */}
          <CallListPanel
            items={filteredList}
            loading={callListLoading}
            onRemove={handleRemove}
            onStatusChange={handleStatusChange}
            onGeneratePitch={handleGeneratePitch}
            onRunFullAudit={handleRunFullAudit}
            onOpenManualOutreach={handleOpenManualOutreach}
            onUpdateReminder={handleUpdateReminder}
          />

          {/* ── Quick add card ────────────────────────────────────────────── */}
          <section
            aria-labelledby="quick-add-heading"
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="relative overflow-hidden border-b border-border bg-secondary/20 px-6 py-5 sm:px-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/[0.08] blur-3xl"
              />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-lg">
                  ➕
                </div>
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Quick Add
                  </p>
                  <h2
                    id="quick-add-heading"
                    className="text-lg font-bold text-foreground"
                  >
                    Add a business manually
                  </h2>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 sm:px-10">
              <form onSubmit={handleQuickAdd} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="quick-add-name"
                      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      Business name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="quick-add-name"
                      type="text"
                      required
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      placeholder="e.g. Smith Plumbing"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quick-add-url"
                      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      Website URL{' '}
                      <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="quick-add-url"
                      type="text"
                      value={quickAddUrl}
                      onChange={(e) => setQuickAddUrl(e.target.value)}
                      placeholder="e.g. smithplumbing.com.au"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>

                {quickAddError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
                    <p className="text-sm text-red-400">{quickAddError}</p>
                  </div>
                )}

                {quickAddSuccess && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
                    <p className="text-sm font-semibold text-emerald-300">
                      ✅ Added to call list!
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={quickAddLoading || !quickAddName.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {quickAddLoading ? (
                    <>
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>➕ Add to Call List</>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* ── Navigation links ──────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/app/leads')}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/30 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary/50 hover:text-foreground"
            >
              🎯 Find More Leads
            </button>

            <button
              type="button"
              onClick={() => router.push('/app/audit')}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/30 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary/50 hover:text-foreground"
            >
              📊 Run an Audit
            </button>

            <button
              type="button"
              onClick={() => router.push('/app/outreach')}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/30 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary/50 hover:text-foreground"
            >
              ✉️ Outreach Workspace
            </button>
          </div>

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