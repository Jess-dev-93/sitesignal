import type { OpportunityScoreResult } from '../../lib/opportunityScore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

type OpportunityFoundPanelProps = {
  result: OpportunityScoreResult
  onGenerateOutreach: () => void
  onManualOutreach: () => void
  outreachReady: boolean
  arrivedForOutreach?: boolean
}

export default function OpportunityFoundPanel({
  result,
  onGenerateOutreach,
  onManualOutreach,
  outreachReady,
  arrivedForOutreach = false,
}: OpportunityFoundPanelProps) {
  return (
    <Card
      className={`overflow-hidden border-2 ${
        arrivedForOutreach
          ? 'border-violet-500/40 bg-violet-500/[0.08]'
          : 'border-success-border/50 bg-success-muted/25'
      }`}
    >
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-success">
            Opportunity found
          </p>
          <h3 className="mt-2 text-xl font-bold text-foreground sm:text-2xl">
            What happens next?
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Issue', value: result.primaryIssue, badge: 'Technical issue' as const },
            { label: 'Impact', value: result.impact, badge: 'Business impact' as const },
            { label: 'Recommendation', value: result.recommendation, badge: 'Next step' as const },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card/90 p-4">
              <div className="mb-2">
                <Badge variant={item.label === 'Impact' ? 'warning' : item.label === 'Issue' ? 'rose' : 'success'}>
                  {item.badge}
                </Badge>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm text-muted-foreground">
            Turn this finding into a real conversation — outreach is pre-filled with evidence from
            this scan.
          </p>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              type="button"
              disabled={!outreachReady}
              onClick={onGenerateOutreach}
              className={`h-12 min-w-[220px] gap-2 px-8 text-base font-semibold ${
                arrivedForOutreach
                  ? 'bg-violet-600 hover:bg-violet-500'
                  : 'bg-success text-white hover:opacity-90'
              }`}
            >
              Generate Outreach →
            </Button>
            <button
              type="button"
              onClick={onManualOutreach}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Write custom outreach instead
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
