'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, FileSearch, GitBranch, Send, Users } from 'lucide-react'
import { NextPageProps, useUnwrapNextPageProps } from '../../lib/nextPageProps'
import { getDisplayName } from '../../lib/displayName'
import { getStoredProfile } from '../../lib/profileStorage'
import { useSupabaseSession } from '../../lib/useSupabaseSession'
import AppPageShell from '../../components/layout/AppPageShell'
import PageIntroCard from '../../components/layout/PageIntroCard'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

const quickActions = [
  { title: 'Find Leads', description: 'Search for weak websites in your market', href: '/app/leads', icon: Users },
  { title: 'Run Audit', description: 'Analyze a website for opportunities', href: '/app/audit', icon: FileSearch },
  { title: 'Create Outreach', description: 'Generate professional pitch scripts', href: '/app/outreach', icon: Send },
  { title: 'View Pipeline', description: 'Track your deals and prospects', href: '/app/pipeline', icon: GitBranch },
]

type DashboardStats = {
  plan: string
  auditCount: number
  searchCount: number
  outreachCount: number
  pipelineValueLabel: string
}

export default function DashboardPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const { email: sessionEmail, userId: sessionUserId } = useSupabaseSession()
  const [profileName, setProfileName] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    setProfileName(getStoredProfile().yourName)
  }, [])

  useEffect(() => {
    if (!sessionUserId) return

    fetch('/api/dashboard-stats', {
      headers: { 'x-user-id': sessionUserId },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats({
          plan: data.plan || 'starter',
          auditCount: data.auditCount ?? 0,
          searchCount: data.searchCount ?? 0,
          outreachCount: data.outreachCount ?? 0,
          pipelineValueLabel: data.pipelineValueLabel ?? '$0',
        })
      })
      .catch(() => {
        setStats({
          plan: 'starter',
          auditCount: 0,
          searchCount: 0,
          outreachCount: 0,
          pipelineValueLabel: '$0',
        })
      })
  }, [sessionUserId])

  const displayName = getDisplayName(profileName, sessionEmail)
  const planLabel =
    stats?.plan === 'agency' ? 'Agency' : stats?.plan === 'pro' ? 'Pro' : 'Starter'

  return (
    <AppPageShell title="Dashboard" description="Your leads, audits, and outreach in one place">
      <PageIntroCard
        title={`Welcome back, ${displayName}`}
        description={
          stats
            ? `You're on the ${planLabel} plan. Pick up where you left off or find new leads.`
            : 'Pick up where you left off or find new leads in your market.'
        }
      >
        <Button asChild size="sm" className="mt-4 gap-2">
          <Link href="/app/leads">
            Find leads
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </PageIntroCard>

      <div>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="group h-full cursor-pointer border-border bg-card transition-all hover:border-muted-foreground/30 hover:bg-secondary/20">
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-secondary/80 sm:h-10 sm:w-10">
                    <action.icon className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                  </div>
                  <h4 className="mb-1 text-sm font-semibold text-foreground">{action.title}</h4>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
          <CardTitle className="text-base font-semibold text-foreground">This month</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            <div>
              <p className="tabular-nums text-2xl font-bold text-foreground sm:text-3xl">
                {stats?.searchCount ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">Lead searches</p>
            </div>
            <div>
              <p className="tabular-nums text-2xl font-bold text-foreground sm:text-3xl">
                {stats?.auditCount ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">Audits run</p>
            </div>
            <div>
              <p className="tabular-nums text-2xl font-bold text-foreground sm:text-3xl">
                {stats?.outreachCount ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">Outreach scripts</p>
            </div>
            <div>
              <p className="tabular-nums text-2xl font-bold text-foreground sm:text-3xl">
                {stats?.pipelineValueLabel ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">Pipeline value</p>
            </div>
          </div>
          {!stats && sessionUserId ? (
            <p className="mt-4 text-xs text-muted-foreground">Loading stats…</p>
          ) : null}
        </CardContent>
      </Card>
    </AppPageShell>
  )
}
