import { levelLabel, type OpportunityScoreResult } from '../../lib/opportunityScore'
import { Card, CardContent } from '../ui/card'

type OpportunityScoreCardProps = {
  result: OpportunityScoreResult
  compact?: boolean
}

export default function OpportunityScoreCard({ result, compact = false }: OpportunityScoreCardProps) {
  const levelClass =
    result.level === 'HIGH'
      ? 'text-success border-success-border bg-success-muted'
      : result.level === 'MEDIUM'
        ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
        : 'text-muted-foreground border-border bg-secondary/50'

  return (
    <Card className="overflow-hidden border-success-border/30 bg-gradient-to-br from-card via-success-muted/20 to-violet-500/5">
      <CardContent className={compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-success">
          Opportunity score
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <p className="text-5xl font-bold tabular-nums tracking-tight text-foreground sm:text-6xl">
            {result.score}
          </p>
          <span
            className={`mb-2 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${levelClass}`}
          >
            {levelLabel(result.level)}
          </span>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Why this is worth contacting them
          </p>
          <ul className="space-y-1.5">
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
