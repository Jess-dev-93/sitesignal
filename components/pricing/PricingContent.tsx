'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, ChevronDown, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { COMPARISON_ROWS, FAQS, PLANS } from './plans'

type PricingContentProps = {
  sessionUserId?: string | null
  variant?: 'marketing' | 'app'
}

export default function PricingContent({
  sessionUserId = null,
  variant = 'marketing',
}: PricingContentProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)
  const [upgradeCancelled, setUpgradeCancelled] = useState(false)

  const pricingBase = variant === 'app' ? '/app/pricing' : '/pricing'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') setUpgradeSuccess(true)
    if (params.get('cancelled') === 'true') setUpgradeCancelled(true)
  }, [])

  const handleUpgrade = async (planKey: string) => {
    setCheckoutError(null)

    if (planKey === 'starter') {
      window.location.href = sessionUserId ? '/app' : '/signup'
      return
    }

    if (!sessionUserId) {
      window.location.href = `/signup?plan=${planKey}`
      return
    }

    try {
      setCheckoutLoading(planKey)

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionUserId,
        },
        body: JSON.stringify({
          plan: planKey,
          successUrl: `${window.location.origin}/app?upgraded=true`,
          cancelUrl: `${window.location.origin}${pricingBase}?cancelled=true`,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start checkout. Please try again.')
      }

      window.location.href = data.url
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="space-y-16">
      {upgradeSuccess && (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="p-5 text-center">
            <p className="text-sm font-semibold text-emerald-300">
              Welcome to the next level! Your plan has been upgraded successfully.
            </p>
            <Link href="/app" className="mt-2 inline-block text-xs font-medium text-emerald-400 underline underline-offset-2">
              Go to your app →
            </Link>
          </CardContent>
        </Card>
      )}

      {upgradeCancelled && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-5 text-center">
            <p className="text-sm font-semibold text-amber-200">
              No worries — your plan hasn&apos;t changed. You can upgrade any time.
            </p>
          </CardContent>
        </Card>
      )}

      {checkoutError && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-5 text-center">
            <p className="text-sm font-semibold text-destructive">{checkoutError}</p>
          </CardContent>
        </Card>
      )}

      <section className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Simple, transparent pricing — cancel anytime
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Find clients.{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            Win the work.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Start free and upgrade when you&apos;re ready. No lock-in. All prices in AUD.
        </p>
      </section>

      <section aria-label="Pricing plans">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.key}
              className={`flex h-full flex-col ${
                plan.highlight
                  ? 'border-primary/40 bg-gradient-to-br from-card to-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              <CardHeader className="border-b border-border p-6">
                {plan.badge ? (
                  <span className="mb-3 inline-flex w-fit items-center rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                    {plan.badge}
                  </span>
                ) : null}
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {plan.name}
                </p>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="text-4xl font-bold text-foreground">{plan.priceLabel}</span>
                  <span className="mb-1 text-sm text-muted-foreground">{plan.priceSub}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col p-6">
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 shrink-0 ${
                          feature.included ? 'text-emerald-400' : 'text-muted-foreground/40'
                        }`}
                      >
                        {feature.included ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </span>
                      <span
                        className={`text-sm leading-snug ${
                          feature.included ? 'text-foreground' : 'text-muted-foreground/60'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={checkoutLoading === plan.key}
                    variant={plan.highlight ? 'default' : 'secondary'}
                    className="w-full"
                  >
                    {checkoutLoading === plan.key ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting…
                      </>
                    ) : sessionUserId && plan.key !== 'starter' ? (
                      `Upgrade to ${plan.name}`
                    ) : (
                      plan.cta
                    )}
                  </Button>
                  {plan.key === 'starter' ? (
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      No credit card required
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-border bg-card">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
          {[
            {
              title: 'No lock-in contracts',
              body: 'Month to month. Cancel any time from your account settings.',
            },
            {
              title: 'Built for Australia',
              body: 'Prices in AUD. Lead finder optimised for Australian markets.',
            },
            {
              title: 'Instant access',
              body: 'Create your account and start auditing websites in under 2 minutes.',
            },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2 px-6 text-center">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <section>
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Compare plans
          </p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Everything side by side</h2>
        </div>

        <Card className="overflow-hidden border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Feature
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.key}
                      className={`px-6 py-4 text-center text-sm font-bold ${
                        plan.highlight ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-border ${i % 2 === 0 ? 'bg-secondary/10' : ''}`}
                  >
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">{row.feature}</td>
                    {(['starter', 'pro', 'agency'] as const).map((planKey) => {
                      const val = row[planKey]
                      const isCheck = val === '✓'
                      const isCross = val === '✕'
                      return (
                        <td
                          key={planKey}
                          className={`px-6 py-3.5 text-center text-sm font-medium ${
                            isCheck
                              ? 'text-emerald-400'
                              : isCross
                                ? 'text-muted-foreground/40'
                                : 'text-foreground'
                          }`}
                        >
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            FAQ
          </p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Common questions</h2>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map((faq, i) => (
            <Card key={faq.q} className="overflow-hidden border-border bg-card">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-secondary/20"
              >
                <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === i ? (
                <div className="border-t border-border px-5 py-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      {variant === 'marketing' ? (
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 px-6 py-12 text-center">
          <CardContent className="p-0">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to find your next client?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Start free. No credit card. Be finding leads and running audits in under 2 minutes.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href={sessionUserId ? '/app' : '/signup'}>
                  {sessionUserId ? 'Go to App' : 'Start Free — No Card Needed'}
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/">Learn more</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
