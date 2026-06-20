import type { OpportunityLevel } from './opportunityScore'

export function estimateClientValue(level: OpportunityLevel): {
  label: string
  symbols: string
  range: string
} {
  if (level === 'HIGH') {
    return {
      label: 'High potential client value',
      symbols: '$$$',
      range: '$3k – $12k+ project',
    }
  }
  if (level === 'MEDIUM') {
    return {
      label: 'Solid potential client value',
      symbols: '$$',
      range: '$1.5k – $6k project',
    }
  }
  return {
    label: 'Quick-win opportunity',
    symbols: '$',
    range: '$500 – $2.5k project',
  }
}
