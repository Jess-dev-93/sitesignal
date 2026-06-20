import { Card, CardContent } from '../ui/card'

const EXAMPLE_OUTREACH =
  'Hi Joe,\n\nI noticed your website loads slowly on mobile — I ran a quick check and the performance score came back at 42. That often means missed calls from people searching on their phone.\n\nWould you be open to a quick chat about fixing that?'

export default function ExampleOpportunityCard() {
  return (
    <Card className="overflow-hidden border-success-border/40 bg-success-muted/15">
      <CardContent className="p-5 sm:p-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-success">
          Example opportunity
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Website', value: 'joesplumbing.com.au' },
            { label: 'Opportunity score', value: '87', accent: true },
            { label: 'Level', value: 'High opportunity', accent: true },
            { label: 'Issue', value: 'Slow mobile experience' },
            { label: 'Recommended action', value: 'Optimise or rebuild' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  item.accent ? 'text-success' : 'text-foreground'
                }`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/90">
            Generated outreach preview
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-secondary-foreground italic">
            {EXAMPLE_OUTREACH}
          </p>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          This is what a scan unlocks — a concrete reason to reach out, not just a score.
        </p>
      </CardContent>
    </Card>
  )
}
