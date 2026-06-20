'use client'

import { estimateClientValue } from '../../lib/clientValue'
import { useAnimatedScore } from '../../lib/useAnimatedScore'
import { levelBadgeLabel, type OpportunityScoreResult } from '../../lib/opportunityScore'
import SiteIdentity from './SiteIdentity'
import { Badge } from '../ui/Badge'
import { Card, CardContent } from '../ui/card'

type OpportunityScoreCardProps = {
  result: OpportunityScoreResult
  url: string
  pageTitle?: string | null
  scannedAt?: string
  compact?: boolean
}

function scoreRingColor(level: OpportunityScoreResult['level']) {
  if (level === 'HIGH') return 'stroke-success'
  if (level === 'MEDIUM') return 'stroke-amber-400'
  return 'stroke-muted-foreground'
}

function scoreGlow(level: OpportunityScoreResult['level']) {
  if (level === 'HIGH') return 'shadow-[0_0_64px_rgba(16,185,129,0.28)]'
  if (level === 'MEDIUM') return 'shadow-[0_0_64px_rgba(251,191,36,0.22)]'
  return 'shadow-[0_0_40px_rgba(148,163,184,0.15)]'
}

function levelVariant(level: OpportunityScoreResult['level']) {
  if (level === 'HIGH') return 'success' as const
  if (level === 'MEDIUM') return 'warning' as const
  return 'muted' as const
}

export default function OpportunityScoreCard({
  result,
  url,
  pageTitle,
  scannedAt,
  compact = false,
}: OpportunityScoreCardProps) {
  const animatedScore = useAnimatedScore(result.score)
  const clientValue = estimateClientValue(result.level)
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, animatedScore))
  const dashOffset = circumference - (progress / 100) * circumference
  const ringSize = compact ? 'h-40 w-40' : 'h-48 w-48 sm:h-56 sm:w-56'
  const scoreText = compact ? 'text-5xl' : 'text-6xl sm:text-7xl'

  return (
    <Card
      className={`overflow-hidden border-2 border-success-border/40 bg-gradient-to-br from-card via-success-muted/25 to-violet-500/10 ${scoreGlow(result.level)}`}
    >
      <CardContent className={compact ? 'p-6 sm:p-8' : 'p-8 sm:p-10'}>
        <div className="mb-8">
          <SiteIdentity url={url} pageTitle={pageTitle} scannedAt={scannedAt} size="lg" />
        </div>

        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-5">
            <div className={`relative ${ringSize} shrink-0`}>
              <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  className="stroke-border/80"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  className={`${scoreRingColor(result.level)} transition-all duration-300 ease-out`}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-bold tabular-nums tracking-tight text-foreground ${scoreText}`}>
                  {animatedScore}
                </span>
              </div>
            </div>

            <Badge variant={levelVariant(result.level)} className="px-4 py-1.5 text-xs tracking-[0.14em]">
              {levelBadgeLabel(result.level)}
            </Badge>
          </div>

          <div className="w-full max-w-xs rounded-2xl border border-border bg-card/90 px-6 py-5 text-center lg:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {clientValue.label}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-amber-400/90">
              {clientValue.symbols}
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">{clientValue.range}</p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Why this is worth contacting them
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {result.reasonDetails.map((detail) => (
              <li
                key={detail.issue}
                className="rounded-xl border border-border bg-card/60 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      detail.category === 'seo'
                        ? 'blue'
                        : detail.category === 'accessibility'
                          ? 'violet'
                          : detail.category === 'mobile' || detail.category === 'performance'
                            ? 'warning'
                            : 'muted'
                    }
                  >
                    {detail.badge}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-foreground">{detail.issue}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {detail.outcome}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
