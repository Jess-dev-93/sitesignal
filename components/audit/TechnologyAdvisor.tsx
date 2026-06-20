import type { RecommendedPath, TechStack } from '../../lib/techStack'
import { buildRecommendedPaths } from '../../lib/techStack'
import { Card, CardContent } from '../ui/card'

type TechnologyAdvisorProps = {
  performance: number
  stack: TechStack
}

const ROLE_STYLES: Record<RecommendedPath['role'], string> = {
  best: 'border-success-border/50 bg-success-muted/30',
  alternative: 'border-violet-500/25 bg-violet-500/[0.06]',
  performance: 'border-blue-500/25 bg-blue-500/[0.06]',
}

const ROLE_BADGE: Record<RecommendedPath['role'], string> = {
  best: 'text-success',
  alternative: 'text-violet-300',
  performance: 'text-blue-300',
}

export default function TechnologyAdvisor({ performance, stack }: TechnologyAdvisorProps) {
  const paths = buildRecommendedPaths(stack, performance)

  const stackItems = [
    { label: 'CMS', value: stack.cms },
    { label: 'Page builder', value: stack.pageBuilder ?? 'Not detected' },
    { label: 'Hosting', value: stack.hosting },
  ]

  return (
    <Card className="overflow-hidden border-border bg-card">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300/90">
              Technology advisor
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">Recommended path</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Based on what we detected on the site and its performance score.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
              stack.confidence === 'high'
                ? 'border-success-border bg-success-muted text-success'
                : stack.confidence === 'medium'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-border bg-secondary/50 text-muted-foreground'
            }`}
          >
            {stack.confidence} confidence
          </span>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Current stack
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {stackItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-secondary/30 px-4 py-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Recommended paths
          </p>
          <div className="grid gap-3 lg:grid-cols-3">
            {paths.map((path) => (
              <div
                key={path.role}
                className={`rounded-xl border p-4 ${ROLE_STYLES[path.role]}`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.14em] ${ROLE_BADGE[path.role]}`}
                >
                  {path.roleLabel}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{path.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {path.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
