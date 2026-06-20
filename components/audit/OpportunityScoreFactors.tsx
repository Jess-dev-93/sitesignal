import { Check } from 'lucide-react'
import type { TechStack } from '../../lib/techStack'
import { Badge } from '../ui/Badge'

type ScoresInput = {
  mobile: {
    performance: number
    seo: number
    accessibility: number
    bestPractices: number
  }
  details?: {
    hasMetaDescription?: boolean
    loadTime?: string
  }
}

const FACTORS = [
  {
    label: 'Performance',
    isActive: (s: ScoresInput) => s.mobile.performance < 85,
  },
  {
    label: 'SEO',
    isActive: (s: ScoresInput) => s.mobile.seo < 85,
  },
  {
    label: 'Accessibility',
    isActive: (s: ScoresInput) => s.mobile.accessibility < 85,
  },
  {
    label: 'Mobile experience',
    isActive: (s: ScoresInput) => s.mobile.performance < 75,
  },
  {
    label: 'Technology age',
    isActive: (s: ScoresInput) => s.mobile.performance < 65,
    isDetected: (stack?: TechStack | null) =>
      Boolean(
        stack &&
          (stack.pageBuilder === 'Elementor' ||
            stack.pageBuilder === 'Divi' ||
            stack.cms === 'WordPress' ||
            stack.cms === 'Joomla')
      ),
  },
  {
    label: 'Business impact',
    isActive: (s: ScoresInput) =>
      s.mobile.performance < 70 ||
      s.mobile.seo < 70 ||
      s.details?.hasMetaDescription === false,
  },
] as const

type OpportunityScoreFactorsProps = {
  scores?: ScoresInput | null
  techStack?: TechStack | null
}

export default function OpportunityScoreFactors({
  scores,
  techStack,
}: OpportunityScoreFactorsProps) {
  return (
    <div className="rounded-xl border border-border bg-card/80 px-4 py-4 sm:px-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Opportunity score factors
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {FACTORS.map((factor) => {
          const active = scores ? factor.isActive(scores) : true
          const detected =
            'isDetected' in factor && factor.isDetected
              ? factor.isDetected(techStack)
              : !('comingSoon' in factor && factor.comingSoon)
          const muted = !detected && !scores

          return (
            <li
              key={factor.label}
              className={`flex items-center gap-2 text-xs sm:text-sm ${
                muted
                  ? 'text-muted-foreground/60'
                  : active
                    ? 'text-foreground'
                    : 'text-muted-foreground'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 shrink-0 ${
                  muted
                    ? 'text-muted-foreground/40'
                    : active
                      ? 'text-success'
                      : 'text-muted-foreground/50'
                }`}
                aria-hidden="true"
              />
              <span>{factor.label}</span>
              {active && detected ? (
                <Badge variant="warning" className="ml-auto hidden sm:inline-flex">
                  Active
                </Badge>
              ) : null}
              {!detected && scores ? (
                <Badge variant="muted" className="ml-auto">
                  N/A
                </Badge>
              ) : null}
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Scores combine Lighthouse data with issues that affect real business outcomes — not
        vanity metrics.
      </p>
    </div>
  )
}
