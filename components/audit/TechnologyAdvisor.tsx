import { Card, CardContent } from '../ui/card'

type TechnologyAdvisorProps = {
  performance: number
}

const PATHS = [
  {
    tier: 'Quick win',
    title: 'Upgrade hosting',
    description: 'Faster server, caching, and image compression — often the fastest ROI.',
    when: (p: number) => p < 85,
  },
  {
    tier: 'Modernise',
    title: 'Move to Bricks or a lighter theme',
    description: 'Reduce builder bloat and improve mobile speed without a full rebuild.',
    when: (p: number) => p < 70,
  },
  {
    tier: 'Rebuild',
    title: 'Move to Webflow',
    description: 'Design-led marketing sites with better performance out of the box.',
    when: (p: number) => p < 55,
  },
  {
    tier: 'Performance',
    title: 'Move to Next.js',
    description: 'Maximum speed and flexibility for businesses ready to invest in growth.',
    when: (p: number) => p < 45,
  },
] as const

export default function TechnologyAdvisor({ performance }: TechnologyAdvisorProps) {
  const visiblePaths = PATHS.filter((path) => path.when(performance))

  if (visiblePaths.length === 0) return null

  return (
    <Card className="overflow-hidden border-border bg-card">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300/90">
              Technology advisor
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Recommended paths for this site
            </h3>
          </div>
          <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Stack detection coming soon
          </span>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {['CMS / builder', 'Hosting', 'Page builder'].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-dashed border-border bg-secondary/20 p-3 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/80">Auto-detect soon</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {visiblePaths.map((path) => (
            <div
              key={path.title}
              className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300">
                {path.tier}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{path.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {path.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
