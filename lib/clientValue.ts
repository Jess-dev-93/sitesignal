import type { OpportunityLevel } from './opportunityScore'
import type { TechStack } from './techStack'

export function estimateClientValue(level: OpportunityLevel): {
  label: string
  symbols: string
  range: string
} {
  if (level === 'HIGH') {
    return {
      label: 'High potential client value',
      symbols: '$$$',
      range: '$3k – $12k',
    }
  }
  if (level === 'MEDIUM') {
    return {
      label: 'Solid potential client value',
      symbols: '$$',
      range: '$1,500 – $6,000',
    }
  }
  return {
    label: 'Quick-win opportunity',
    symbols: '$',
    range: '$500 – $2,500',
  }
}

export function estimateEffort(level: OpportunityLevel): string {
  if (level === 'HIGH') return '3–6 weeks'
  if (level === 'MEDIUM') return '2–4 weeks'
  return '1–2 weeks'
}

export function confidenceFromStack(stack?: TechStack | null): string {
  if (!stack) return 'Moderate'
  if (stack.confidence === 'high') return 'High'
  if (stack.confidence === 'medium') return 'Medium'
  return 'Moderate'
}

export function recommendedActionLabel(
  recommendation: string,
  performance: number
): string {
  if (/rebuild/i.test(recommendation)) return 'Rebuild for performance'
  if (performance < 50) return 'Optimise or rebuild'
  if (/seo/i.test(recommendation)) return 'SEO & on-page improvements'
  return 'Optimise existing site'
}
