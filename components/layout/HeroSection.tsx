'use client'

import { UserProfile } from '../../lib/profileStorage'

// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_FEATURES = [
  {
    icon: '⚡',
    title: 'Fast & Focused',
    body: 'Find leads, Audit Websites, and move from research to a client conversation — without the usual back-and-forth.',
  },
  {
    icon: '📈',
    title: 'Commercially Actionable',
    body: 'Every scan surfaces real issues and translates them into outreach that makes commercial sense to a business owner.',
  },
  {
    icon: '🏆',
    title: 'Agency-Grade Output',
    body: 'Present yourself like a premium studio. Deliver findings that look polished and justify a serious project fee.',
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type HeroSectionProps = {
  isLoggedIn: boolean
  sessionEmail: string | null
  profile: UserProfile
  profileComplete?: boolean          // ← NEW — controls whether nudge shows
  onPrimaryClick: () => void
  onSecondaryClick: () => void
  onOpenProfile: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNameFromEmail(email: string | null): string {
  if (!email) return 'there'
  const firstPart = email.split('@')[0]
  const cleaned = firstPart.split(/[._-]/)[0]
  if (!cleaned) return 'there'
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function getDisplayName(profile: UserProfile, sessionEmail: string | null): string {
  if (profile.yourName?.trim()) return profile.yourName.trim().split(' ')[0]
  return getNameFromEmail(sessionEmail)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeroSection({
  isLoggedIn,
  sessionEmail,
  profile,
  profileComplete = true,            // ← default true so nudge is hidden unless explicitly false
  onPrimaryClick,
  onSecondaryClick,
  onOpenProfile,
}: HeroSectionProps) {

  // ── Logged-in hero ────────────────────────────────────────────────────────

  if (isLoggedIn) {
    return (
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] px-5 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:px-8 sm:py-8 md:px-10"
      >
        {/* Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-blue-500/[0.10] blur-3xl sm:h-72 sm:w-72"
        />
        {/* Grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:36px_36px]"
        />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">

            {/* Welcome badge */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-blue-200 sm:text-xs">
              <span aria-hidden="true">🚀</span>
              <span>Welcome back</span>
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-[2.2rem]"
            >
              Ready to turn more weak websites into client opportunities,
              <span className="block bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {getDisplayName(profile, sessionEmail)}?
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Search your market, find underperforming websites, run instant audits, and
              generate outreach that helps you win better web projects.
            </p>

            {/* ── Profile nudge — only shows if profileComplete is false ── */}
            {!profileComplete && (
              <button
                onClick={onOpenProfile}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/[0.15] hover:text-amber-200"
              >
                <span aria-hidden="true">🙋</span>
                Complete your profile
              </button>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
            <button
              onClick={onPrimaryClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
            >
              <span aria-hidden="true">🎯</span>
              Find Weak Websites
            </button>

            <button
              onClick={onSecondaryClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/[0.10] active:translate-y-0"
            >
              <span aria-hidden="true">📊</span>
              Run Instant Audit
            </button>
          </div>
        </div>
      </section>
    )
  }

  // ── Logged-out / marketing hero ───────────────────────────────────────────

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] px-5 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:px-8 sm:py-10 md:px-12 md:py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-blue-500/[0.10] blur-3xl sm:h-72 sm:w-72"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:36px_36px]"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-blue-200 sm:text-xs">
          <span aria-hidden="true">🚀</span>
          <span>Built for Australian web developers &amp; digital agencies</span>
        </div>

        <h1
          id="hero-heading"
          className="text-[1.75rem] font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3rem]"
        >
          Turn underperforming websites
          <span className="mt-1 block bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text pb-2 text-transparent sm:mt-1.5">
            into paying clients
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:mt-5 sm:text-base">
          Identify businesses running on slow, outdated, or poorly optimised websites.
          Audit them in minutes, generate a professional pitch, and close the work —
          all in one place.
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:justify-center">
          <button
            onClick={onPrimaryClick}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0 sm:w-auto sm:px-7 sm:py-3.5"
          >
            <span aria-hidden="true">🎯</span>
            Find Weak Websites
          </button>

          <button
            onClick={onSecondaryClick}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/[0.10] active:translate-y-0 sm:w-auto sm:px-7 sm:py-3.5"
          >
            <span aria-hidden="true">📊</span>
            Run Instant Audit
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-500 sm:mt-5">
          Trusted by web developers across Sydney, Melbourne, Brisbane &amp; beyond
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {HERO_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-left"
            >
              <div className="mb-2 text-xl">{feature.icon}</div>
              <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}