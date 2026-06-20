import { Check, X } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

const WITHOUT = [
  'Cold outreach',
  'Guessing who needs help',
  'Generic emails',
] as const

const WITH = [
  'Finds real issues',
  'Creates evidence-based outreach',
  'Gives you a repeatable system',
] as const

export default function WhyThisMatters() {
  return (
    <Card className="overflow-hidden border-border bg-card">
      <CardContent className="p-5 sm:p-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
          Why this matters
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
            <p className="mb-3 text-sm font-semibold text-rose-300">Most freelancers</p>
            <ul className="space-y-2">
              {WITHOUT.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/90" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-success-border bg-success-muted/40 p-4">
            <p className="mb-3 text-sm font-semibold text-success">SiteSignal</p>
            <ul className="space-y-2">
              {WITH.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
