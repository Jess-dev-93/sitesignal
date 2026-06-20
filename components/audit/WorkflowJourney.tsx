import { Card } from '../ui/card'

const STEPS = [
  { label: 'Find', active: false },
  { label: 'Audit', active: true },
  { label: 'Outreach', active: false },
  { label: 'Pipeline', active: false },
  { label: 'Client', active: false },
] as const

export default function WorkflowJourney() {
  return (
    <Card className="overflow-hidden border-border bg-gradient-to-r from-card via-card to-violet-500/5">
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2 sm:gap-3">
              <span
                className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px] ${
                  step.active
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                    : 'border-border bg-secondary/50 text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span className="text-muted-foreground/50" aria-hidden="true">
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Every feature in SiteSignal follows this workflow.
        </p>
      </div>
    </Card>
  )
}
