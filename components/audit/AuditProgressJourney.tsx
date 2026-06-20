'use client'

import { Check } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

type AuditProgressJourneyProps = {
  onGenerateOutreach: () => void
  onAddToPipeline: () => void
  onViewHistory: () => void
  outreachReady: boolean
}

const STEPS = [
  { id: 'audit', label: 'Audit complete', status: 'done' as const },
  { id: 'outreach', label: 'Generate outreach', status: 'next' as const },
  { id: 'pipeline', label: 'Add to pipeline', status: 'pending' as const },
  { id: 'contact', label: 'Contact lead', status: 'pending' as const },
]

export default function AuditProgressJourney({
  onGenerateOutreach,
  onAddToPipeline,
  onViewHistory,
  outreachReady,
}: AuditProgressJourneyProps) {
  return (
    <Card className="overflow-hidden border-success-border/40 bg-gradient-to-r from-success-muted/30 via-card to-violet-500/5 shadow-lg shadow-success/5">
      <CardContent className="p-5 sm:p-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-success">
          Your next moves
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <ol className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            {STEPS.map((step, index) => (
              <li key={step.id} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    step.status === 'done'
                      ? 'border-success-border bg-success-muted text-success'
                      : step.status === 'next'
                        ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                        : 'border-border bg-secondary/40 text-muted-foreground'
                  }`}
                >
                  {step.status === 'done' ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <span className="text-[10px] opacity-70" aria-hidden="true">
                      {index + 1}
                    </span>
                  )}
                  {step.label}
                </span>
                {index < STEPS.length - 1 ? (
                  <span className="hidden text-muted-foreground/50 sm:inline" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!outreachReady}
              onClick={onGenerateOutreach}
              className="bg-success text-white hover:opacity-90"
            >
              Generate outreach →
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={onAddToPipeline}>
              Add to pipeline
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={onViewHistory}>
              History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
