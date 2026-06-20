'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type UsageData = {
  plan: string
  auditCount: number
  searchCount: number
  auditLimit: number
  searchLimit: number
  auditLimitReached: boolean
  searchLimitReached: boolean
}

type UsageLimitBannerProps = {
  userId: string | null
  refreshKey?: number
  compact?: boolean          // ← added — used on leads page
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsageLimitBanner({
  userId,
  refreshKey,
  compact = false,
}: UsageLimitBannerProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    const fetchUsage = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/user-plan', {
          headers: { 'x-user-id': userId },
        })
        const data = await res.json()
        if (data.plan) setUsage(data)
      } catch (err) {
        console.error('Failed to fetch usage:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [userId, refreshKey])

  // Don't show for pro/agency or if still loading
  if (!usage || loading) return null
  if (usage.plan === 'pro' || usage.plan === 'agency') return null

  const auditPercent  = Math.min((usage.auditCount  / usage.auditLimit)  * 100, 100)
  const searchPercent = Math.min((usage.searchCount / usage.searchLimit) * 100, 100)

  const bothLimitsReached = usage.auditLimitReached && usage.searchLimitReached
  const anyLimitReached   = usage.auditLimitReached || usage.searchLimitReached
  const gettingClose      = auditPercent >= 60 || searchPercent >= 60

  // Don't show if barely used and no limits hit
  if (!anyLimitReached && !gettingClose) return null

  // ── Compact mode — small pill for page headers ─────────────────────────────
  if (compact) {
    return (
      <Link
        href="/app/pricing"
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80 ${
          bothLimitsReached
            ? 'border-rose-500/30 bg-rose-500/[0.08] text-rose-300'
            : anyLimitReached
              ? 'border-amber-500/30 bg-amber-500/[0.08] text-amber-300'
              : 'border-blue-500/30 bg-blue-500/[0.08] text-blue-300'
        }`}
      >
        <span>{bothLimitsReached ? '🚫' : anyLimitReached ? '⚠️' : '📊'}</span>
        <span>
          {usage.auditCount}/{usage.auditLimit} audits ·{' '}
          {usage.searchCount}/{usage.searchLimit} searches
        </span>
        <span className="text-white/40">→ Upgrade</span>
      </Link>
    )
  }

  // ── Full banner mode ───────────────────────────────────────────────────────
  return (
    <div
      className={`overflow-hidden rounded-[24px] border p-5 sm:p-6 ${
        bothLimitsReached
          ? 'border-rose-500/30 bg-rose-500/[0.06]'
          : anyLimitReached
            ? 'border-amber-500/30 bg-amber-500/[0.06]'
            : 'border-border bg-card'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">
              {bothLimitsReached ? '🚫' : anyLimitReached ? '⚠️' : '📊'}
            </span>
            <p className={`text-sm font-bold ${
              bothLimitsReached
                ? 'text-rose-300'
                : anyLimitReached
                  ? 'text-amber-300'
                  : 'text-white'
            }`}>
              {bothLimitsReached
                ? 'Free plan limits reached for this month'
                : anyLimitReached
                  ? 'One of your free limits has been reached'
                  : 'Getting close to your free plan limits'}
            </p>
          </div>

          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            {bothLimitsReached
              ? 'Upgrade to Pro for unlimited audits and lead searches — no limits, ever.'
              : anyLimitReached
                ? "You can still use features that haven't hit their limit. Upgrade for unlimited access."
                : 'Upgrade to Pro before you run out — unlimited audits and searches from \$49/month.'}
          </p>

          {/* ── Usage bars ── */}
          <div className="space-y-3">

            {/* Audit bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Website Audits
                </span>
                <span className={`text-[11px] font-bold ${
                  usage.auditLimitReached ? 'text-rose-400' : 'text-secondary-foreground'
                }`}>
                  {usage.auditCount} / {usage.auditLimit}
                  {usage.auditLimitReached && ' — Limit reached'}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    usage.auditLimitReached
                      ? 'bg-rose-500'
                      : auditPercent >= 80
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${auditPercent}%` }}
                />
              </div>
            </div>

            {/* Search bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Lead Searches
                </span>
                <span className={`text-[11px] font-bold ${
                  usage.searchLimitReached ? 'text-rose-400' : 'text-secondary-foreground'
                }`}>
                  {usage.searchCount} / {usage.searchLimit}
                  {usage.searchLimitReached && ' — Limit reached'}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    usage.searchLimitReached
                      ? 'bg-rose-500'
                      : searchPercent >= 80
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${searchPercent}%` }}
                />
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-600">
            Resets on the 1st of each month · Free plan: 5 audits + 3 searches/month
          </p>
        </div>

        {/* ── Upgrade CTA ── */}
        <div className="flex flex-shrink-0 flex-col gap-2 sm:ml-6 sm:items-end">
          <Link
            href="/app/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
          >
            <span>🚀</span>
            Upgrade to Pro
          </Link>
          <p className="text-[11px] text-slate-600">
            From \$49/month · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}