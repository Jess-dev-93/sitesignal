'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowRight,
  FileSearch,
  HelpCircle,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { useSupabaseSession } from '../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../lib/nextPageProps'
import { BRAND_NAME } from '../lib/brand'
import { AppHeader } from '../components/app-header'
import ProductPreviewMock from '../components/marketing/ProductPreviewMock'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import SiteFooter from '../components/site-footer'

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Find businesses ready to hire you',
    description:
      'Search by industry and location to find businesses that already have a reason to need help.',
    icon: Search,
  },
  {
    step: 2,
    title: 'Uncover real issues',
    description:
      'Find website issues you can use as a reason to start the conversation — not vague guesses.',
    icon: FileSearch,
  },
  {
    step: 3,
    title: 'Start evidence-based conversations',
    description:
      'Generate outreach based on what you found — not generic cold pitching.',
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
    title: 'Find prospects faster',
    description: 'Discover businesses with real website gaps — not random names on a list.',
  },
  {
    title: 'Pitch with evidence',
    description: 'Lead with specific issues you can point to, not guesswork.',
  },
  {
    title: 'Sound professional',
    description: 'Outreach that references what you actually audited.',
  },
  {
    title: 'Track every follow-up',
    description: 'Keep calls, emails and pipeline in one place.',
  },
] as const

const OBJECTIONS = [
  {
    question: "Can't I just use Google?",
    answer:
      'Yes — but Google shows you businesses, not which ones have weak websites, what is broken, or what to say when you reach out. SiteSignal connects search → issues → outreach in one flow.',
  },
  {
    question: "Can't I run Lighthouse myself?",
    answer:
      'Absolutely. But you still need to find the prospect, interpret the scores, write the pitch, and track follow-ups. SiteSignal wraps that entire workflow — not just a single audit.',
  },
  {
    question: "Can't ChatGPT write outreach?",
    answer:
      'It can write generic emails. SiteSignal generates outreach tied to real audit findings on a specific business — so your message sounds researched, not templated.',
  },
] as const

const COMING_SOON = [
  'Technology recommendations',
  'Historical website snapshots',
  'Advanced outreach workflows',
  'Agency collaboration tools',
] as const

function SectionLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3
      id={id}
      className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground"
    >
      {children}
    </h3>
  )
}

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

      <main className="mx-auto w-full max-w-6xl space-y-14 p-4 pb-12 sm:space-y-16 sm:p-6 sm:pb-16">
        {/* Hero + product preview */}
        <section aria-labelledby="hero-heading" className="space-y-6 sm:space-y-8">
          <Card className="overflow-hidden border-border bg-gradient-to-br from-card via-card to-violet-500/10 shadow-lg shadow-violet-500/5">
            <CardContent className="p-8 sm:p-12 md:p-14 lg:px-16 lg:pt-16 lg:pb-10">
              <div className="mb-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Currently in early access
                </span>
              </div>

              <h2
                id="hero-heading"
                className="mb-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
              >
                Find weak websites. Turn them into paying clients.
              </h2>
              <p className="mb-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Find local businesses with underperforming websites, uncover issues you can pitch
                on, and start conversations based on evidence — not cold guessing.
              </p>
              <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground/90 sm:text-base">
                Built for freelancers, web designers, developers and small agencies who want a
                smarter way to find clients.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 gap-2 px-6 text-base">
                  <Link href="/signup">
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="h-11 px-6 text-base">
                  <Link href="/signin">Sign in</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product screenshot — immediately below hero */}
          <div>
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
              See the product
            </p>
            <ProductPreviewMock />
            <p className="mt-3 text-center text-xs text-muted-foreground sm:text-sm">
              Lead finder, audit insights and outreach — in one workspace
            </p>
          </div>
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

        {/* Why this works */}
        <section aria-labelledby="why-this-works-heading">
          <SectionLabel id="why-this-works-heading">Why {BRAND_NAME} works</SectionLabel>
          <Card className="border-border bg-card">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Most freelancers do outreach like this:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground/60">•</span>
                    Buy a lead list
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground/60">•</span>
                    Send generic emails
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground/60">•</span>
                    Hope for replies
                  </li>
                </ul>
              </div>
              <div className="h-px bg-border" />
              <p className="text-base leading-relaxed text-foreground sm:text-lg">
                {BRAND_NAME} starts with a{' '}
                <span className="font-semibold text-violet-300">real website issue</span> first.
                That means every conversation begins with evidence, not guesswork.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* The transformation */}
        <section aria-labelledby="transformation-heading">
          <SectionLabel id="transformation-heading">The transformation</SectionLabel>
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <Card className="border-rose-500/20 bg-rose-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-rose-300/90">
                  From
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {FROM_ITEMS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/80" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="hidden items-center justify-center md:flex">
              <ArrowRight className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-center py-1 md:hidden">
              <ArrowDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>

            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-emerald-300/90">
                  To
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {TO_ITEMS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-emerald-400">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            People buy transformations — not software.
          </p>
        </section>

        {/* Example lead journey */}
        <section aria-labelledby="lead-journey-heading">
          <SectionLabel id="lead-journey-heading">Example lead journey</SectionLabel>
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border pb-4">
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
                      step.highlight ? 'bg-secondary/20' : ''
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

        {/* Objection handling */}
        <section aria-labelledby="objections-heading">
          <SectionLabel id="objections-heading">Why not use separate tools?</SectionLabel>
          <Card className="border-border bg-card">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                You could search manually, run audits manually, write outreach manually and track
                prospects manually. {BRAND_NAME} combines the entire workflow into one process.
              </p>
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
                {OBJECTIONS.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-xl border border-border bg-secondary/20 p-4 sm:p-5"
                  >
                    <div className="mb-2 flex items-start gap-2">
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      <p className="text-sm font-semibold text-foreground">{item.question}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Benefits */}
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

        {/* Founder story — expanded */}
        <section aria-labelledby="founder-story-heading">
          <SectionLabel id="founder-story-heading">Why I built {BRAND_NAME}</SectionLabel>
          <Card className="overflow-hidden border-border bg-gradient-to-br from-card via-violet-500/5 to-secondary/20">
            <CardContent className="p-8 sm:p-10 md:p-12">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-violet-300/80">
                Founder story
              </p>
              <blockquote className="max-w-3xl text-lg leading-relaxed text-foreground sm:text-xl sm:leading-relaxed">
                I&apos;m a freelance developer. I built {BRAND_NAME} because I needed it — after
                years of manually finding prospects, running audits and writing outreach one by
                one.
              </blockquote>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground">
                I wanted a faster, more structured way to identify opportunities and start better
                conversations. Not another growth-hack tool — something I&apos;d actually use on
                real client work.
              </p>
              <p className="mt-6 border-t border-border pt-6 text-base font-semibold text-foreground">
                Built for freelancers who do the work, not just talk about it.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Coming soon */}
        <section aria-labelledby="coming-soon-heading">
          <SectionLabel id="coming-soon-heading">Coming soon</SectionLabel>
          <Card className="border-dashed border-border bg-card/50">
            <CardContent className="p-6 sm:p-8">
              <p className="mb-4 text-sm text-muted-foreground">
                We&apos;re shipping the core workflow first. On the horizon:
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {COMING_SOON.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-foreground/90"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Pricing CTA */}
        <Card className="border-border bg-gradient-to-br from-card to-primary/5">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Simple pricing
              </p>
              <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
                Start free. Upgrade when you&apos;re ready.
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Free plan includes lead searches and issue reports to get started. Pro unlocks
                unlimited usage, outreach formats and pipeline tracking from $49/month.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button asChild className="h-11 gap-2 px-6">
                <Link href="/signup">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-11 px-6">
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
