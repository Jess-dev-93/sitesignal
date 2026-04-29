'use client'

import Link from 'next/link'

export default function AccountPrompt() {
  return (
    <section
      id="account-section"
      className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            Account
          </div>

          <h2 className="text-xl font-bold text-white">Save your work and build your pipeline</h2>

          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Create a free account to save lead searches, outreach drafts, audit history,
            and call list activity in one place.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
          <Link
            href="/signin"
            className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition hover:bg-blue-500"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </section>
  )
}