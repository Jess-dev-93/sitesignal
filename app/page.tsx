'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowRight, Check, FileSearch, Search, Send, Sparkles, X } from 'lucide-react'
import { useSupabaseSession } from '../lib/useSupabaseSession'
import { passwordRecoveryRedirectTarget } from '../lib/authRecovery'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'
import { NextPageProps, useUnwrapNextPageProps } from '../lib/nextPageProps'
import { BRAND_NAME } from '../lib/brand'
import { AppHeader } from '../components/app-header'
import ProductPreviewMock from '../components/marketing/ProductPreviewMock'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import SiteFooter from '../components/site-footer'
import PageBackground from '../components/layout/PageBackground'
import SectionLabel from '../components/layout/SectionLabel'

const HERO_TRUST = [
  'Free plan available',
  'No credit card required',
  'Built by a working freelancer',
] as const

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Find prospects in minutes',
    description:
      'Search by industry and location — find businesses that already have a reason to need help.',
    icon: Search,
  },
  {
    step: 2,
    title: 'Uncover real issues',
    description:
      'Run audits that surface specific website problems you can pitch on — not vague guesses.',
    icon: FileSearch,
  },
  {
    step: 3,
    title: 'Generate outreach in seconds',
    description:
      'Start evidence-based conversations with emails and scripts tied to what you found.',
    icon: Send,
  },
] as const

const FROM_ITEMS = [
  'Cold outreach',
  'Guessing who needs help',
  'Generic emails',
  'No process',
] as const

const TO_ITEMS = [
  'Targeted prospects',
  'Evidence-based pitches',
  'Personalised outreach',
  'Repeatable client acquisition',
] as const

const LEAD_JOURNEY = [
  { label: 'Lead found', value: "Joe's Plumbing Sydney", highlight: false },
  { label: 'Audit result', value: 'Performance 42', highlight: true },
  { label: 'Issue found', value: 'Mobile speed slow', highlight: false },
  { label: 'Recommended action', value: 'Optimise or rebuild', highlight: false },
  {
    label: 'Outreach generated',
    value: '"We noticed your website loads slowly on mobile…"',
    highlight: true,
    quote: true,
  },
] as const

const WHY_BENEFITS = [
  {
    title: 'Find prospects in minutes',
    description: '5 free lead searches each month — discover real website gaps fast.',
  },
  {
    title: 'Generate outreach in seconds',
    description: 'AI-powered emails and scripts tied to actual audit findings.',
  },
  {
    title: 'Pitch with evidence',
    description: '5 free audits per month — lead with scores and issues, not guesswork.',
  },
  {
    title: 'Keep every lead organised',
    description: 'Track follow-ups, pipeline value and conversations in one place.',
  },
] as const

export default function HomePage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const router = useRouter()
  const { userId: sessionUserId, loading } = useSupabaseSession()

  useEffect(() => {
    const recoveryTarget = passwordRecoveryRedirectTarget(
      window.location.pathname,
      window.location.hash
    )
    if (recoveryTarget) {
      router.replace(recoveryTarget)
    }
  }, [router])

  useEffect(() => {
    if (supabaseConfigError) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (loading) return

    if (sessionUserId) {
      router.replace('/app')
    }
  }, [loading, router, sessionUserId])

  if (!loading && sessionUserId) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageBackground />

      <AppHeader
        variant="marketing"
        title={BRAND_NAME}
        description="Lead generation + website audits"
      />

      <main className="ss-marketing-main-wide">
        {/* Hero */}
        <section aria-labelledby="hero-heading">
          <Card className="overflow-hidden border-border bg-gradient-to-br from-card via-card to-violet-500/10 shadow-lg shadow-violet-500/5">
            <CardContent className="px-8 py-14 sm:px-14 sm:py-16 md:px-16 md:py-20 lg:px-20 lg:py-24">
              <div className="mb-8 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Currently in early access
                </span>
              </div>

              <h2
                id="hero-heading"
                className="mb-6 max-w-none text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-[2.65rem] lg:text-[2.85rem] xl:text-5xl xl:whitespace-nowrap"
              >
                Find weak websites. Turn them into paying clients.
              </h2>

              <p className="mb-6 max-w-xl text-lg font-medium leading-snug text-foreground/90 sm:text-xl">
                Find businesses with real website issues, prove the value, and start better client
                conversations.
              </p>

              <p className="mb-10 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                Built for freelancers, web designers, developers and small agencies.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 gap-2 px-7 text-base">
                  <Link href="/signup">
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="h-12 px-7 text-base">
                  <Link href="/signin">Sign in</Link>
                </Button>
              </div>

              <ul className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                {HERO_TRUST.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Screenshot showcase */}
        <section aria-labelledby="screenshot-heading" className="pt-2">
          <SectionLabel id="screenshot-heading">See the product</SectionLabel>
          <ProductPreviewMock />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Lead finder, audit insights and outreach — in one workspace
          </p>
          <p className="mt-3 text-center text-xs text-muted-foreground/75 sm:text-sm">
            Built using real client outreach workflows
          </p>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-it-works-heading">
          <SectionLabel id="how-it-works-heading">How it works</SectionLabel>
          <div className="grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <Card key={item.step} className="border-border bg-card">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {item.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  <h4 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Transformation — prominent */}
        <section aria-labelledby="transformation-heading">
          <SectionLabel id="transformation-heading">The transformation</SectionLabel>
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-secondary/30 to-card p-6 sm:p-8 md:p-10">
            <p className="mb-8 text-center text-base font-medium text-foreground sm:text-lg">
              Less frustration. More clients. A process you can repeat.
            </p>
            <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              <Card className="border-rose-500/25 bg-rose-500/[0.07] shadow-sm">
                <CardHeader className="pb-3 sm:px-8 sm:pt-8">
                  <CardTitle className="text-base font-bold uppercase tracking-wider text-rose-300 sm:text-lg">
                    From
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-8 sm:px-8">
                  {FROM_ITEMS.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 text-base text-muted-foreground"
                    >
                      <X className="mt-0.5 h-5 w-5 shrink-0 text-rose-400/90" aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="hidden items-center justify-center md:flex">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                  <ArrowRight className="h-6 w-6 text-foreground/70" aria-hidden="true" />
                </div>
              </div>
              <div className="flex items-center justify-center py-2 md:hidden">
                <ArrowDown className="h-6 w-6 text-foreground/50" aria-hidden="true" />
              </div>

              <Card className="border-success-border bg-success-muted shadow-sm">
                <CardHeader className="pb-3 sm:px-8 sm:pt-8">
                  <CardTitle className="text-base font-bold uppercase tracking-wider text-success sm:text-lg">
                    To
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-8 sm:px-8">
                  {TO_ITEMS.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-base text-foreground">
                      <Check
                        className="mt-0.5 h-5 w-5 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <p className="mt-8 text-center text-sm font-medium text-muted-foreground sm:text-base">
              People buy transformations — not software.
            </p>
          </div>
        </section>

        {/* Example lead journey */}
        <section aria-labelledby="lead-journey-heading">
          <SectionLabel id="lead-journey-heading">Example lead journey</SectionLabel>
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border pb-4 sm:px-8 sm:py-6">
              <CardTitle className="text-lg font-semibold text-foreground sm:text-xl">
                From find to pitch — in one workflow
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                See the whole journey, not just a score
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {LEAD_JOURNEY.map((step, index) => (
                  <div
                    key={step.label}
                    className={`flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-start sm:gap-6 sm:px-8 sm:py-5 ${
                      step.highlight ? 'border-l-2 border-success bg-success-muted/50 sm:border-l-[3px]' : ''
                    }`}
                  >
                    <div className="flex w-full shrink-0 items-center gap-3 sm:w-44">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {step.label}
                      </p>
                    </div>
                    <p
                      className={`min-w-0 flex-1 text-sm leading-relaxed sm:text-base ${
                        'quote' in step && step.quote
                          ? 'italic text-foreground/90'
                          : 'font-medium text-foreground'
                      }`}
                    >
                      {step.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border bg-secondary/10 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:gap-4 sm:text-sm">
                <span>Find</span>
                <span className="text-muted-foreground/50" aria-hidden="true">
                  →
                </span>
                <span>Audit</span>
                <span className="text-muted-foreground/50" aria-hidden="true">
                  →
                </span>
                <span>Pitch</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Why use SiteSignal */}
        <section aria-labelledby="why-use-heading">
          <SectionLabel id="why-use-heading">Why use {BRAND_NAME}</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_BENEFITS.map((benefit) => (
              <Card key={benefit.title} className="border-border bg-card">
                <CardContent className="p-4 sm:p-5">
                  <h4 className="mb-1.5 text-sm font-semibold text-foreground sm:text-base">
                    {benefit.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Founder story */}
        <section aria-labelledby="founder-story-heading">
          <SectionLabel id="founder-story-heading">Founder story</SectionLabel>
          <Card className="overflow-hidden border-border bg-gradient-to-br from-card via-violet-500/5 to-secondary/20">
            <CardContent className="p-8 sm:p-10 md:p-12 lg:p-14">
              <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10 lg:gap-12">
                <div className="mx-auto shrink-0 md:mx-0">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-border ring-offset-4 ring-offset-card sm:h-32 sm:w-32 md:h-36 md:w-36">
                    <Image
                      src="/images/founder.jpg"
                      alt="Jess, founder of SiteSignal"
                      fill
                      className="object-cover object-top grayscale contrast-[1.05]"
                      sizes="(max-width: 768px) 128px, 144px"
                    />
                  </div>
                  <p className="mt-4 text-center text-sm font-medium text-foreground md:text-left">
                    Jess
                  </p>
                  <p className="text-center text-xs text-muted-foreground md:text-left">
                    Founder, {BRAND_NAME}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <blockquote className="text-lg leading-relaxed text-foreground sm:text-xl sm:leading-relaxed">
                    I built {BRAND_NAME} because I was doing this work manually every week. Finding
                    prospects, running audits and writing outreach took time. I wanted a faster way to
                    identify opportunities and start better conversations.
                  </blockquote>
                  <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                    I&apos;m a freelance developer — not a growth guru. This is the tool I wished I
                    had when chasing client work on my own.
                  </p>
                  <p className="mt-8 border-t border-border pt-6 text-base font-semibold text-foreground">
                    Built for freelancers who do the work, not just talk about it.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pricing CTA */}
        <section aria-labelledby="pricing-cta-heading">
          <SectionLabel id="pricing-cta-heading">Get started</SectionLabel>
          <Card className="overflow-hidden border border-primary/25 bg-gradient-to-br from-card via-primary/10 to-success-muted shadow-xl shadow-primary/10 ring-1 ring-success-border/30">
            <CardContent className="flex flex-col items-start gap-8 p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14 md:p-16">
              <div className="max-w-xl">
                <h3 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
                  Start finding opportunities today.
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Free plan includes lead searches and issue reports. Upgrade only when you need
                  more — unlimited audits, outreach formats and pipeline from $49/month.
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:min-w-[220px]">
                <Button asChild className="h-12 gap-2 px-7 text-base">
                  <Link href="/signup">
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="h-12 px-7 text-base">
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
