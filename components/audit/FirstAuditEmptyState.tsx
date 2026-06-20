import { Card, CardContent } from '../ui/card'

export default function FirstAuditEmptyState() {
  return (
    <Card className="border-dashed border-border/80 bg-gradient-to-br from-card to-violet-500/[0.04]">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:py-14">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-3xl">
          🔍
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Run your first audit to discover opportunities
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Paste any business URL above. You&apos;ll get an opportunity score, talking points, and
          outreach you can send today.
        </p>
      </CardContent>
    </Card>
  )
}
