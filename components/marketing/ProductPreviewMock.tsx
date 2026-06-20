'use client'

import { Check } from 'lucide-react'
import { BRAND_NAME } from '../../lib/brand'

const FLOATING_BADGES = [
  { label: 'Lead found', className: 'left-2 top-8 sm:left-4 sm:top-6' },
  { label: 'Opportunity detected', className: 'right-2 top-16 sm:right-6 sm:top-10' },
  { label: 'Outreach generated', className: 'bottom-8 left-4 sm:bottom-10 sm:left-8' },
] as const

/** Static product preview — styled like the real app for landing page proof */
export default function ProductPreviewMock() {
  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Glow behind showcase */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-violet-500/25 via-fuchsia-500/10 to-transparent blur-3xl sm:-inset-8"
      />

      {/* Floating demo badges */}
      {FLOATING_BADGES.map((badge) => (
        <span
          key={badge.label}
          className={`absolute z-10 hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-[#0b1020]/95 px-3 py-1.5 text-[10px] font-semibold text-emerald-300 shadow-lg shadow-emerald-500/10 backdrop-blur-sm sm:inline-flex ${badge.className}`}
        >
          <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
          {badge.label}
        </span>
      ))}

      <div
        className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0b1020] shadow-[0_32px_80px_-12px_rgba(139,92,246,0.35),0_24px_48px_-24px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
        aria-label={`${BRAND_NAME} product preview`}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-[#0f1528] px-4 py-3.5 sm:px-5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" aria-hidden="true" />
          <span className="mx-auto truncate text-[11px] text-slate-500">
            app.{BRAND_NAME.toLowerCase()}.com.au — Lead Finder
          </span>
        </div>

        <div className="flex min-h-[340px] flex-col md:min-h-[400px] md:flex-row">
          {/* Sidebar hint */}
          <div className="hidden w-16 shrink-0 border-r border-white/10 bg-[#0d1224] p-2.5 md:block">
            <div className="mx-auto mb-3 h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`mx-auto mb-2 h-9 w-9 rounded-lg ${i === 2 ? 'bg-white/10' : 'bg-white/[0.03]'}`}
              />
            ))}
          </div>

          {/* Main panel */}
          <div className="min-w-0 flex-1 p-5 sm:p-6 md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Lead Finder
                </p>
                <p className="text-base font-semibold text-white sm:text-lg">Plumbers in Sydney</p>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-300">
                12 hot leads
              </span>
            </div>

            {/* Lead card */}
            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-300">
                  HOT
                </span>
                <span className="text-xs text-slate-500">Performance 42 · SEO 68</span>
              </div>
              <p className="text-lg font-semibold text-white">Joe&apos;s Plumbing Sydney</p>
              <p className="mt-1 text-xs text-blue-300 sm:text-sm">joesplumbing.com.au</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Mobile speed slow', 'Missing meta tags', 'Low accessibility'].map((issue) => (
                  <span
                    key={issue}
                    className="rounded-full border border-rose-500/15 bg-rose-500/10 px-2.5 py-0.5 text-[10px] text-rose-200"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>

            {/* Outreach snippet */}
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.08] p-4 sm:p-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">
                Outreach generated
              </p>
              <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                Hi Joe — I was looking at local plumbing sites in Sydney and noticed yours loads
                quite slowly on mobile (score 42). That often means missed calls from people
                searching on their phone. Would you be open to a quick chat about fixing that?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile badges row */}
      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:hidden">
        {FLOATING_BADGES.map((badge) => (
          <span
            key={badge.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-card px-2.5 py-1 text-[10px] font-semibold text-emerald-400"
          >
            <Check className="h-3 w-3" aria-hidden="true" />
            {badge.label}
          </span>
        ))}
      </div>
    </div>
  )
}
