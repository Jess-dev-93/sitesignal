'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import MainNavbar from '../../components/layout/MainNavbar'
import {
  DEFAULT_PROFILE,
  getStoredProfile,
  UserProfile,
} from '../../lib/profileStorage'

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 0,
    priceLabel: 'Free',
    priceSub: 'forever',
    description: 'Perfect for testing the water. Get a feel for the tool before committing.',
    badge: null,
    highlight: false,
    cta: 'Get Started Free',
    ctaStyle: 'secondary',
    features: [
      { text: '5 website audits per month', included: true },
      { text: '3 lead searches per month', included: true },
      { text: 'AI audit report', included: true },
      { text: 'Basic outreach kit (email only)', included: true },
      { text: 'Audit history (last 10)', included: true },
      { text: 'PDF & Excel export', included: false },
      { text: 'All 4 outreach formats', included: false },
      { text: 'Call list & pipeline CRM', included: false },
      { text: 'White-label PDF reports', included: false },
      { text: 'Team seats', included: false },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 49,
    priceLabel: '\$49',
    priceSub: 'per month',
    description: 'Everything you need to find, pitch, and win web clients consistently.',
    badge: 'Most Popular',
    highlight: true,
    cta: 'Start Pro — \$49/mo',
    ctaStyle: 'primary',
    features: [
      { text: 'Unlimited website audits', included: true },
      { text: 'Unlimited lead searches', included: true },
      { text: 'AI audit report', included: true },
      { text: 'All 4 outreach formats', included: true },
      { text: 'Full audit history', included: true },
      { text: 'PDF & Excel export', included: true },
      { text: 'Call list & pipeline CRM', included: true },
      { text: 'Priority support', included: true },
      { text: 'White-label PDF reports', included: false },
      { text: 'Team seats', included: false },
    ],
  },
  {
    key: 'agency',
    name: 'Agency',
    price: 149,
    priceLabel: '\$149',
    priceSub: 'per month',
    description: 'Built for agencies running audits at scale and delivering to clients.',
    badge: null,
    highlight: false,
    cta: 'Start Agency — \$149/mo',
    ctaStyle: 'secondary',
    features: [
      { text: 'Unlimited website audits', included: true },
      { text: 'Unlimited lead searches', included: true },
      { text: 'AI audit report', included: true },
      { text: 'All 4 outreach formats', included: true },
      { text: 'Full audit history', included: true },
      { text: 'PDF & Excel export', included: true },
      { text: 'Call list & pipeline CRM', included: true },
      { text: 'Priority support', included: true },
      { text: 'White-label PDF reports', included: true },
      { text: 'Team seats (up to 3)', included: true },
    ],
  },
]

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — no lock-in contracts. Cancel from your account settings and you keep access until the end of your billing period.',
  },
  {
    q: 'What counts as a website audit?',
    a: 'Each time you scan a URL through the audit tool, that counts as one audit. Reopening a saved audit from history does not count.',
  },
  {
    q: 'What counts as a lead search?',
    a: 'Each time you run a new search in the Lead Finder, that counts as one search. Reopening a past search from history is free.',
  },
  {
    q: 'Do I need a credit card to start?',
    a: 'No credit card required for the Starter plan. You only need payment details when upgrading to Pro or Agency.',
  },
  {
    q: 'What is white-label PDF?',
    a: 'Agency plan users can upload their own logo and remove sitesignal branding from exported PDF reports — so the report looks like it came from your studio.',
  },
  {
    q: 'Can I upgrade or downgrade later?',
    a: "Yes. You can upgrade instantly and downgrade at the end of your billing cycle. We'll prorate any mid-cycle upgrades.",
  },
  {
    q: 'Is this built for Australian web developers?',
    a: 'Yes — the lead finder is optimised for Australian businesses and locations. Pricing is in AUD.',
  },
]

export default function PricingPage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // ── Read ?upgraded=true or ?cancelled=true from URL ──
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)
  const [upgradeCancelled, setUpgradeCancelled] = useState(false)

  useEffect(() => {
    setProfile(getStoredProfile())

    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') setUpgradeSuccess(true)
    if (params.get('cancelled') === 'true') setUpgradeCancelled(true)

    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email || null)
      setSessionUserId(data.session?.user?.id || null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSessionEmail(session?.user?.email || null)
      setSessionUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // ── Stripe Checkout Handler ──────────────────────────
  const handleUpgrade = async (planKey: string) => {
    setCheckoutError(null)

    // Starter — just go to signup or app
    if (planKey === 'starter') {
      window.location.href = sessionUserId ? '/app' : '/signup'
      return
    }

    // Not logged in — send to signup with plan param
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
          cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start checkout. Please try again.')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (err: any) {
      console.error('Checkout error:', err)
      setCheckoutError(err.message || 'Something went wrong. Please try again.')
      setCheckoutLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.13),transparent_55%),linear-gradient(160deg,#080e1f_0%,#0f1a38_50%,#080e1f_100%)]">
      <MainNavbar
        sessionEmail={sessionEmail}
        isLoggedIn={!!sessionUserId}
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onSignOut={handleSignOut}
        appHref="/app"
      />

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 md:px-6 md:py-16">

        {/* ── Upgrade success banner ── */}
        {upgradeSuccess && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-5 py-4 text-center">
            <p className="text-sm font-semibold text-emerald-300">
              🎉 Welcome to the next level! Your plan has been upgraded successfully.
            </p>
            <Link
              href="/app"
              className="mt-2 inline-block text-xs font-medium text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
            >
              Go to your app →
            </Link>
          </div>
        )}

        {/* ── Cancelled banner ── */}
        {upgradeCancelled && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] px-5 py-4 text-center">
            <p className="text-sm font-semibold text-amber-300">
              No worries — your plan hasn't changed. You can upgrade any time.
            </p>
          </div>
        )}

        {/* ── Checkout error ── */}
        {checkoutError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] px-5 py-4 text-center">
            <p className="text-sm font-semibold text-rose-300">
              ⚠️ {checkoutError}
            </p>
          </div>
        )}

        {/* ── Hero ── */}
        <section className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-blue-200">
            <span>💳</span>
            <span>Simple, transparent pricing — cancel anytime</span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-[3.25rem]">
            Find clients.{' '}
            <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Win the work.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">
            Start free and upgrade when you're ready. No lock-in. Cancel anytime.
            All prices in AUD.
          </p>
        </section>

        {/* ── Pricing Cards ── */}
        <section aria-label="Pricing plans">
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`relative flex flex-col overflow-hidden rounded-[28px] border transition-all duration-200 ${
                  plan.highlight
                    ? 'border-blue-500/40 bg-blue-500/[0.06] shadow-[0_0_60px_rgba(37,99,235,0.15),0_24px_60px_rgba(0,0,0,0.2)]'
                    : 'border-white/[0.08] bg-white/[0.035] shadow-[0_24px_60px_rgba(0,0,0,0.18)]'
                }`}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute right-5 top-5">
                    <span className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)]">
                      ⭐ {plan.badge}
                    </span>
                  </div>
                )}

                {/* Card header */}
                <div className={`border-b px-6 py-7 ${
                  plan.highlight ? 'border-blue-500/20' : 'border-white/[0.07]'
                }`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {plan.name}
                  </p>

                  <div className="mt-3 flex items-end gap-1.5">
                    <span className="text-4xl font-bold text-white">
                      {plan.priceLabel}
                    </span>
                    <span className="mb-1 text-sm text-slate-500">
                      {plan.priceSub}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="flex-1 px-6 py-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-3">
                        <span className={`mt-[3px] flex-shrink-0 text-sm ${
                          feature.included ? 'text-emerald-400' : 'text-slate-600'
                        }`}>
                          {feature.included ? '✓' : '✕'}
                        </span>
                        <span className={`text-sm leading-snug ${
                          feature.included ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button — wired to Stripe */}
                <div className="px-6 pb-7">
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={checkoutLoading === plan.key}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
                      plan.ctaStyle === 'primary'
                        ? 'bg-blue-600 text-white shadow-[0_10px_28px_rgba(37,99,235,0.26)] hover:bg-blue-500'
                        : 'border border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.10]'
                    }`}
                  >
                    {checkoutLoading === plan.key ? (
                      <>
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        Redirecting to checkout...
                      </>
                    ) : (
                      <>
                        {sessionUserId && plan.key !== 'starter'
                          ? `Upgrade to ${plan.name}`
                          : plan.cta}
                      </>
                    )}
                  </button>

                  {plan.key === 'starter' && (
                    <p className="mt-2 text-center text-[11px] text-slate-600">
                      No credit card required
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust bar ── */}
        <section className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] px-6 py-6 sm:px-10">
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/[0.07]">
            {[
              {
                icon: '🔒',
                title: 'No lock-in contracts',
                body: 'Month to month. Cancel any time from your account settings.',
              },
              {
                icon: '🇦🇺',
                title: 'Built for Australia',
                body: 'Prices in AUD. Lead finder optimised for Australian markets.',
              },
              {
                icon: '⚡',
                title: 'Instant access',
                body: 'Create your account and start auditing websites in under 2 minutes.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center gap-2 px-6 text-center"
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs leading-relaxed text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature comparison table ── */}
        <section>
          <div className="mb-8 text-center">
            <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              Compare plans
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Everything side by side
            </h2>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.035]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Feature
                    </th>
                    {PLANS.map((plan) => (
                      <th
                        key={plan.key}
                        className={`px-6 py-4 text-center text-sm font-bold ${
                          plan.highlight ? 'text-blue-300' : 'text-white'
                        }`}
                      >
                        {plan.name}
                        {plan.highlight && (
                          <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                            Popular
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Website audits / month',  starter: '5',         pro: 'Unlimited', agency: 'Unlimited' },
                    { feature: 'Lead searches / month',   starter: '3',         pro: 'Unlimited', agency: 'Unlimited' },
                    { feature: 'AI audit report',         starter: '✓',         pro: '✓',         agency: '✓' },
                    { feature: 'Outreach formats',        starter: 'Email only', pro: 'All 4',    agency: 'All 4' },
                    { feature: 'Audit history',           starter: 'Last 10',   pro: 'Full',      agency: 'Full' },
                    { feature: 'PDF export',              starter: '✕',         pro: '✓',         agency: '✓' },
                    { feature: 'Excel / CSV export',      starter: '✕',         pro: '✓',         agency: '✓' },
                    { feature: 'Call list & CRM',         starter: '✕',         pro: '✓',         agency: '✓' },
                    { feature: 'White-label PDF',         starter: '✕',         pro: '✕',         agency: '✓' },
                    { feature: 'Team seats',              starter: '✕',         pro: '✕',         agency: 'Up to 3' },
                    { feature: 'Priority support',        starter: '✕',         pro: '✓',         agency: '✓' },
                  ].map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-white/[0.05] ${
                        i % 2 === 0 ? 'bg-white/[0.01]' : ''
                      }`}
                    >
                      <td className="px-6 py-3.5 text-sm text-slate-400">
                        {row.feature}
                      </td>
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
                                  ? 'text-slate-600'
                                  : planKey === 'pro'
                                    ? 'text-blue-300'
                                    : 'text-slate-300'
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
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <div className="mb-8 text-center">
            <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              FAQ
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Common questions
            </h2>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.03]"
                >
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                  <span
                    className="flex-shrink-0 text-slate-400 transition-transform duration-200"
                    style={{
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▼
                  </span>
                </button>

                {openFaq === i && (
                  <div className="border-t border-white/[0.07] px-5 py-4">
                    <p className="text-sm leading-relaxed text-slate-400">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="relative overflow-hidden rounded-[28px] border border-blue-500/20 bg-blue-500/[0.06] px-6 py-12 text-center shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-blue-500/[0.12] blur-3xl"
          />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Ready to find your next client?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              Start free. No credit card. Be finding leads and running audits in under
              2 minutes.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={sessionUserId ? '/app' : '/signup'}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
              >
                <span>🎯</span>
                {sessionUserId ? 'Go to App' : 'Start Free — No Card Needed'}
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.10] active:translate-y-0"
              >
                Learn more
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-600">
              Trusted by web developers across Sydney, Melbourne, Brisbane &amp; beyond
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          role="contentinfo"
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] backdrop-blur-sm"
        >
          <div className="relative flex flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:justify-between sm:px-10 sm:py-6 sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-base shadow-[0_6px_16px_rgba(37,99,235,0.25)]">
                🎯
              </div>
              <div className="text-left">
                <p className="text-sm font-bold leading-none text-white">sitesignal</p>
                <p className="mt-0.5 text-[11px] leading-none tracking-wide text-slate-500">
                  Lead generation + website audits · Sydney, Australia
                </p>
              </div>
            </div>

            <nav className="flex gap-4 text-xs text-slate-500">
              <Link href="/" className="transition hover:text-slate-300">Home</Link>
              <Link href="/pricing" className="transition hover:text-slate-300">Pricing</Link>
              <Link href="/signin" className="transition hover:text-slate-300">Sign In</Link>
              <Link href="/signup" className="transition hover:text-slate-300">Sign Up</Link>
            </nav>

            <p className="text-[11px] text-slate-600">
              © {new Date().getFullYear()} sitesignal. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </main>
  )
}