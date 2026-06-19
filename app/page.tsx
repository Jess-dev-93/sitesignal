'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileSearch, GitBranch, Send, Users } from 'lucide-react'
import { useSupabaseSession } from '../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../lib/nextPageProps'
import { BRAND_NAME } from '../lib/brand'
import { AppHeader } from '../components/app-header'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import SiteFooter from '../components/site-footer'

const BENEFITS = [
  {
    title: 'Find weak websites',
    description: 'Discover underperforming businesses in your local market',
    icon: Users,
  },
  {
    title: 'Run client-ready audits',
    description: 'Lighthouse scores and AI recommendations you can share',
    icon: FileSearch,
  },
  {
    title: 'Generate personalised outreach',
    description: 'Professional pitch scripts tailored to each prospect',
    icon: Send,
  },
  {
    title: 'Track follow-ups',
    description: 'Keep your pipeline organised from first contact to close',
    icon: GitBranch,
  },
] as const

export default function HomePage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const router = useRouter()
  const { userId: sessionUserId, loading } = useSupabaseSession()

  useEffect(() => {
    if (!loading && sessionUserId) {
      router.replace('/app')
    }
  }, [loading, router, sessionUserId])

  if (!loading && sessionUserId) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute top-[35%] right-[-200px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <AppHeader
        variant="marketing"
        title={BRAND_NAME}
        description="Lead generation + website audits"
      />

      <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
        <Card className="border-border bg-gradient-to-br from-card to-secondary/30">
          <CardContent className="p-4 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold text-foreground sm:text-xl">
              Find weak websites. Turn them into paying clients.
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Find leads, run audits, generate outreach, and track your pipeline — all in one
              place.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="sm" className="gap-2">
                <Link href="/signup">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="gap-2 bg-secondary text-secondary-foreground hover:opacity-90"
              >
                <Link href="/signin">Sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            What you can do
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <Card
                key={benefit.title}
                className="h-full border-border bg-card"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary sm:h-10 sm:w-10">
                    <benefit.icon className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                  </div>
                  <h4 className="mb-1 text-sm font-semibold text-foreground">{benefit.title}</h4>
                  <p className="line-clamp-3 text-xs text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Example audit result
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              See what a prospect looks like before you reach out
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Performance
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-rose-400">42</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  SEO
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-amber-300">68</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Opportunity
                </p>
                <p className="mt-2 text-lg font-bold text-emerald-300">High</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended action
                </p>
                <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
                  Rebuild or optimise
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Why agencies use {BRAND_NAME}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {[
                { value: 'Leads', label: 'Find prospects fast' },
                { value: 'Audits', label: 'Client-ready insights' },
                { value: 'Outreach', label: 'Pitch professionally' },
                { value: 'Pipeline', label: 'Track follow-ups' },
              ].map((stat) => (
                <div key={stat.value}>
                  <p className="tabular-nums text-2xl font-bold text-foreground sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  )
}
