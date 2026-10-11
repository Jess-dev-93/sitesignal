'use client'

import '../globals.css'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, ChartNoAxesCombined, FileSearch, GitBranch, Radar, ScanSearch, Sparkles } from 'lucide-react'
import { NextPageProps, useUnwrapNextPageProps } from '../../lib/nextPageProps'
import { getDisplayName } from '../../lib/displayName'
import { getStoredProfile } from '../../lib/profileStorage'
import { useSupabaseSession } from '../../lib/useSupabaseSession'
import AppPageShell from '../../components/layout/AppPageShell'
import DashboardActivity from '../../components/dashboard/DashboardActivity'
import { AUTH_REQUIRED } from '../../lib/authGuestMode'

const actions = [
  { title: 'Find opportunities', description: 'Search a market and surface businesses worth your time.', href: '/app/leads', icon: Radar, tone: 'violet', number: '01' },
  { title: 'Audit a website', description: 'Turn a URL into evidence, impact and a clear opportunity score.', href: '/app/audit', icon: ScanSearch, tone: 'mint', number: '02' },
  { title: 'Work the pipeline', description: 'Move the strongest prospects from found to won.', href: '/app/pipeline', icon: GitBranch, tone: 'blue', number: '03' },
] as const

type DashboardStats = { plan: string; auditCount: number; searchCount: number; pipelineValueLabel: string }

export default function DashboardPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const { email: sessionEmail, userId: sessionUserId } = useSupabaseSession()
  const [profileName, setProfileName] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => setProfileName(getStoredProfile().yourName), [])
  useEffect(() => {
    if (!sessionUserId && AUTH_REQUIRED) return
    const headers: Record<string, string> = {}
    if (sessionUserId) headers['x-user-id'] = sessionUserId
    fetch('/api/dashboard-stats', { headers }).then((res) => res.json()).then((data) => {
      setStats({ plan: data.plan || 'starter', auditCount: data.auditCount ?? 0, searchCount: data.searchCount ?? 0, pipelineValueLabel: data.pipelineValueLabel ?? '$0' })
    }).catch(() => setStats({ plan: 'starter', auditCount: 0, searchCount: 0, pipelineValueLabel: '$0' }))
  }, [sessionUserId])

  const displayName = getDisplayName(profileName, sessionEmail)
  const planLabel = stats?.plan === 'agency' ? 'Agency' : stats?.plan === 'pro' ? 'Pro' : 'Starter'
  const metrics = [
    { label: 'Markets searched', value: stats?.searchCount ?? '—', icon: Radar },
    { label: 'Sites decoded', value: stats?.auditCount ?? '—', icon: FileSearch },
    { label: 'Pipeline value', value: stats?.pipelineValueLabel ?? '—', icon: ChartNoAxesCombined },
  ]

  return (
    <AppPageShell title="Dashboard" description="Find opportunities, prove the value, win better work." hideHeader mainClassName="ss-command-main">
      <div className="ss-dashboard-atmosphere" aria-hidden="true"><span className="ss-orb ss-orb-one" /><span className="ss-orb ss-orb-two" /><span className="ss-grid-haze" /></div>
     <section className="ss-command-hero">
  <div className="ss-command-topline">
    <div className="ss-live-pill">
      <span />
      Signal engine online
    </div>

    <div className="ss-plan-pill">
      {planLabel} workspace
    </div>
  </div>

  <div className="ss-command-hero-grid">
    <div className="ss-command-content">
      <p className="ss-command-kicker">
        Opportunity command centre
      </p>

      <h1 className="ss-command-title">
        Hey {displayName}<br></br>
        <span>Let&apos;s find the money</span>
      </h1>

      <p className="ss-command-copy">
        Find businesses with website gaps and turn the strongest opportunities into client-ready reports.
      </p>

      <div className="ss-command-cta-row">
        <Link href="/app/leads" className="ss-liquid-button">
          <Sparkles className="h-4 w-4" />
          Find an opportunity
          <ArrowUpRight className="h-4 w-4" />
        </Link>

        <Link href="/app/audit" className="ss-ghost-button">
          Audit a URL
        </Link>
      </div>
    </div>

    <div
      className="ss-signal-sphere"
      aria-label="Site Signal opportunity radar"
    >
      <div className="ss-sphere-ring ss-sphere-ring-a" />
      <div className="ss-sphere-ring ss-sphere-ring-b" />

      <div className="ss-sphere-core">
        <Radar className="h-7 w-7" />
        <strong>LIVE</strong>
        <span>market signal</span>
      </div>

      <span className="ss-signal-dot ss-signal-dot-a" />
      <span className="ss-signal-dot ss-signal-dot-b" />
      <span className="ss-signal-dot ss-signal-dot-c" />
    </div>
  </div>

  <div className="ss-metric-rail">
    {metrics.map((metric) => (
      <div className="ss-metric" key={metric.label}>
        <metric.icon className="h-4 w-4" />

        <div>
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </div>
      </div>
    ))}

    <div className="ss-metric ss-metric-status">
      <span className="ss-status-light" />

      <div>
        <strong>Ready</strong>
        <span>Next scan</span>
      </div>
    </div>
  </div>
</section>
      <DashboardActivity />
    
    </AppPageShell>
  )
}
