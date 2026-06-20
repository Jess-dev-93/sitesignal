'use client'

import { BRAND_NAME } from '../../lib/brand'

/** Static product preview — styled like the real app for landing page proof */
export default function ProductPreviewMock() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-[#0b1020] shadow-2xl shadow-violet-500/10 ring-1 ring-white/10"
      aria-label={`${BRAND_NAME} product preview`}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#0f1528] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" aria-hidden="true" />
        <span className="mx-auto truncate text-[11px] text-slate-500">
          app.{BRAND_NAME.toLowerCase()}.com.au — Lead Finder
        </span>
      </div>

      <div className="flex min-h-[320px] flex-col md:min-h-[360px] md:flex-row">
        {/* Sidebar hint */}
        <div className="hidden w-14 shrink-0 border-r border-white/10 bg-[#0d1224] p-2 md:block">
          <div className="mx-auto mb-3 h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`mx-auto mb-2 h-8 w-8 rounded-lg ${i === 2 ? 'bg-white/10' : 'bg-white/[0.03]'}`}
            />
          ))}
        </div>

        {/* Main panel */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Lead Finder
              </p>
              <p className="text-sm font-semibold text-white">Plumbers in Sydney</p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
              12 hot leads
            </span>
          </div>

          {/* Lead card */}
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                HOT
              </span>
              <span className="text-xs text-slate-500">Performance 42 · SEO 68</span>
            </div>
            <p className="text-base font-semibold text-white">Joe&apos;s Plumbing Sydney</p>
            <p className="mt-1 text-xs text-blue-300">joesplumbing.com.au</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Mobile speed slow', 'Missing meta tags', 'Low accessibility'].map((issue) => (
                <span
                  key={issue}
                  className="rounded-full border border-rose-500/15 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200"
                >
                  {issue}
                </span>
              ))}
            </div>
          </div>

          {/* Outreach snippet */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-300/80">
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
  )
}
