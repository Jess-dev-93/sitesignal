'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileSearch, Search, Send, Sparkles } from 'lucide-react'
import { useSupabaseSession } from '../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../lib/nextPageProps'
import { BRAND_NAME } from '../lib/brand'
import { AppHeader } from '../components/app-header'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import SiteFooter from '../components/site-footer'

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Find weak websites',
    description: 'Search by industry and location.',
    icon: Search,
  },
  {
    step: 2,
    title: 'Run an audit',
    description: 'See performance, SEO, accessibility and opportunity.',
    icon: FileSearch,
  },
  {
    step: 3,
    title: 'Send better outreach',
    description: 'Generate emails, call scripts and follow-ups based on real issues.',
    icon: Send,
  },
] as const

const WHY_BENEFITS = [
  { title: 'Find prospects faster', description: 'Discover local businesses with real website gaps.' },
  { title: 'Pitch with evidence', description: 'Lead with audit scores and specific issues, not guesswork.' },
  { title: 'Sound professional', description: 'Outreach that references what you actually found.' },
  { title: 'Track every follow-up', description: 'Keep calls, emails and pipeline in one place.' },
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

      <main className="mx-auto w-full max-w-6xl space-y-8 p-4 pb-10 sm:space-y-10 sm:p-6">
        {/* Hero */}
        <Card className="border-border bg-gradient-to-br from-card to-secondary/30">
          <CardContent className="p-5 sm:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-200">
                <Sparkles className="h-3 w-3" />
                Currently in early access
              </span>
            </div>

            <h2 className="mb-3 text-xl font-semibold leading-snug text-foreground sm:text-2xl md:text-3xl">
              Find weak websites. Turn them into paying clients.
            </h2>
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Find local businesses with underperforming websites, run client-ready audits, and
              generate personalised outreach so you can pitch with confidence.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="sm" className="gap-2 sm:h-10 sm:px-5">
                <Link href="/signup">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="gap-2 sm:h-10 sm:px-5"
              >
                <Link href="/signin">Sign in</Link>
              </Button>
            </div>

            <p className="mt-5 text-xs text-muted-foreground sm:text-sm">
              Built by a freelance web developer for real client outreach.
            </p>
          </CardContent>
        </Card>

        {/* Who it's for */}
        <section aria-labelledby="who-its-for-heading">
          <h3
            id="who-its-for-heading"
            className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground"
          >
            Who it&apos;s for
          </h3>
          <Card className="border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-foreground sm:text-base">
                Built for freelancers, web designers, developers and small agencies who want a
                smarter way to find clients.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-it-works-heading">
          <h3
            id="how-it-works-heading"
            className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground"
          >
            How it works
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <Card key={item.step} className="border-border bg-card">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {item.step}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <h4 className="mb-2 text-base font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Example audit result */}
        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="text-base font-semibold text-foreground sm:text-lg">
              Example audit result
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              See what a prospect looks like before you reach out
            </p>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6">
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
            <p className="text-sm text-muted-foreground">
              Turn audit results into a clear reason to contact the business.
            </p>
          </CardContent>
        </Card>

        {/* Why use it */}
        <section aria-labelledby="why-use-heading">
          <h3
            id="why-use-heading"
            className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground"
          >
            Why use {BRAND_NAME}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_BENEFITS.map((benefit) => (
              <Card key={benefit.title} className="border-border bg-card">
                <CardContent className="p-4 sm:p-5">
                  <h4 className="mb-1.5 text-sm font-semibold text-foreground">{benefit.title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing preview / CTA */}
        <Card className="border-border bg-gradient-to-br from-card to-primary/5">
          <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Simple pricing
              </p>
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                Start free. Upgrade when you&apos;re ready.
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Free plan includes audits and lead searches to get started. Pro unlocks unlimited
                usage, outreach formats and pipeline tracking from $49/month.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button asChild className="gap-2">
                <Link href="/signup">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  )
}
