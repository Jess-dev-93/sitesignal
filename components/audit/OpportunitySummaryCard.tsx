import type { OpportunityScoreResult } from '../../lib/opportunityScore'
import type { TechStack } from '../../lib/techStack'
import {
  confidenceFromStack,
  estimateClientValue,
  estimateEffort,
  recommendedActionLabel,
} from '../../lib/clientValue'
import { levelBadgeLabel } from '../../lib/opportunityScore'
import { Badge } from '../ui/Badge'
import { Card, CardContent } from '../ui/card'

type OpportunitySummaryCardProps = {
  result: OpportunityScoreResult
  stack?: TechStack | null
  performance: number
}

export default function OpportunitySummaryCard({
  result,
  stack,
  performance,
}: OpportunitySummaryCardProps) {
  const value = estimateClientValue(result.level)
  const confidence = confidenceFromStack(stack)
  const action = recommendedActionLabel(result.recommendation, performance)
  const effort = estimateEffort(result.level)

  const levelVariant =
    result.level === 'HIGH' ? 'success' : result.level === 'MEDIUM' ? 'warning' : 'muted'

  return (
    <Card className="overflow-hidden border-2 border-violet-500/25 bg-gradient-to-br from-card via-violet-500/[0.06] to-card shadow-lg shadow-violet-500/5">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
            Opportunity summary
          </p>
          <Badge variant={levelVariant}>{levelBadgeLabel(result.level)}</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Potential project value', value: value.range },
            { label: 'Confidence', value: confidence },
            { label: 'Recommended action', value: action },
            { label: 'Estimated effort', value: effort },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-card/80 px-4 py-3.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {stack ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <Badge variant="muted">{stack.cms}</Badge>
            {stack.pageBuilder ? <Badge variant="violet">{stack.pageBuilder}</Badge> : null}
            <Badge variant="blue">{stack.hosting}</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
