import { estimateClientValue } from '../../lib/clientValue'
import { levelLabel, type OpportunityScoreResult } from '../../lib/opportunityScore'
import { Card, CardContent } from '../ui/card'

type OpportunityScoreCardProps = {
  result: OpportunityScoreResult
  compact?: boolean
}

function scoreRingColor(level: OpportunityScoreResult['level']) {
  if (level === 'HIGH') return 'stroke-success'
  if (level === 'MEDIUM') return 'stroke-amber-400'
  return 'stroke-muted-foreground'
}

function scoreGlow(level: OpportunityScoreResult['level']) {
  if (level === 'HIGH') return 'shadow-[0_0_48px_rgba(16,185,129,0.25)]'
  if (level === 'MEDIUM') return 'shadow-[0_0_48px_rgba(251,191,36,0.2)]'
  return 'shadow-[0_0_32px_rgba(148,163,184,0.15)]'
}

export default function OpportunityScoreCard({ result, compact = false }: OpportunityScoreCardProps) {
  const levelClass =
    result.level === 'HIGH'
      ? 'text-success border-success-border bg-success-muted'
      : result.level === 'MEDIUM'
        ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
        : 'text-muted-foreground border-border bg-secondary/50'

  const clientValue = estimateClientValue(result.level)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, result.score))
  const dashOffset = circumference - (progress / 100) * circumference

  return (
    <Card
      className={`overflow-hidden border-2 border-success-border/40 bg-gradient-to-br from-card via-success-muted/25 to-violet-500/10 ${scoreGlow(result.level)}`}
    >
      <CardContent className={compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative h-36 w-36 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  className="stroke-border"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  className={`${scoreRingColor(result.level)} transition-all duration-1000 ease-out`}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                  {result.score}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  / 100
                </span>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-success">
                Opportunity score
              </p>
              <span
                className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${levelClass}`}
              >
                {levelLabel(result.level)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 px-5 py-4 text-center lg:min-w-[200px] lg:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {clientValue.label}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-amber-400/90">
              {clientValue.symbols}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{clientValue.range}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Why this is worth contacting them
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {result.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm text-secondary-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
