export type OpportunityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type OpportunityScoreResult = {
  score: number
  level: OpportunityLevel
  reasons: string[]
  primaryIssue: string
  impact: string
  recommendation: string
}

type ScoreInput = {
  mobile: {
    performance: number
    seo: number
    accessibility: number
    bestPractices: number
  }
  overallScore?: number
  details?: {
    hasMetaDescription?: boolean
    isHttps?: boolean
    loadTime?: string
  }
}

export function normalizeScores(entry: {
  scores?: {
    mobile?: {
      performance?: number
      seo?: number
      accessibility?: number
      bestPractices?: number
    }
    overallScore?: number
    details?: ScoreInput['details']
  } | null
  performance?: number
  seo?: number
  accessibility?: number
  bestPractices?: number
  overallScore?: number
}): ScoreInput {
  const m = entry.scores?.mobile
  return {
    mobile: {
      performance: m?.performance ?? entry.performance ?? 0,
      seo: m?.seo ?? entry.seo ?? 0,
      accessibility: m?.accessibility ?? entry.accessibility ?? 0,
      bestPractices: m?.bestPractices ?? entry.bestPractices ?? 0,
    },
    overallScore: entry.scores?.overallScore ?? entry.overallScore,
    details: entry.scores?.details,
  }
}

function levelFromScore(score: number): OpportunityLevel {
  if (score >= 75) return 'HIGH'
  if (score >= 50) return 'MEDIUM'
  return 'LOW'
}

function humanIssue(scores: ScoreInput, keyIssues: string[] = []): string {
  if (keyIssues[0]) {
    const first = keyIssues[0]
    if (/performance/i.test(first)) return 'Slow mobile performance'
    if (/seo|meta/i.test(first)) return 'Weak SEO fundamentals'
    return first.length > 48 ? `${first.slice(0, 45)}…` : first
  }
  if (scores.mobile.performance < 50) return 'Slow mobile performance'
  if (scores.mobile.seo < 70) return 'Missing or weak SEO'
  if (!scores.details?.hasMetaDescription) return 'Missing metadata'
  return 'Website needs improvement'
}

export function computeOpportunityScore(
  scores: ScoreInput,
  keyIssues: string[] = []
): OpportunityScoreResult {
  const m = scores.mobile
  const overall =
    scores.overallScore ??
    Math.round((m.performance + m.seo + m.accessibility + m.bestPractices) / 4)

  const performanceBoost =
    m.performance < 50 ? 18 : m.performance < 70 ? 10 : m.performance < 85 ? 4 : 0
  const issueBoost = Math.min(30, keyIssues.length * 10)
  const score = Math.min(100, Math.max(0, Math.round(100 - overall + issueBoost + performanceBoost)))

  const reasons: string[] = []
  if (m.performance < 70) reasons.push('Poor mobile performance')
  if (m.seo < 70) reasons.push('Missing or weak SEO fundamentals')
  if (scores.details?.hasMetaDescription === false) reasons.push('Missing metadata')
  if (scores.details?.loadTime && scores.details.loadTime !== 'Unknown') {
    reasons.push(`Slow load speed (${scores.details.loadTime})`)
  }
  keyIssues.slice(0, 2).forEach((issue) => {
    const short = issue.length > 52 ? `${issue.slice(0, 49)}…` : issue
    if (!reasons.some((r) => r.toLowerCase().includes(short.slice(0, 12).toLowerCase()))) {
      reasons.push(short)
    }
  })
  if (reasons.length === 0) reasons.push('Clear room to improve the website')

  const primaryIssue = humanIssue(scores, keyIssues)
  const impact =
    m.performance < 50
      ? 'Potential lost enquiries from mobile visitors'
      : m.seo < 70
        ? 'Harder to find on Google — missed local search traffic'
        : 'Visitors may leave before converting'

  const recommendation =
    m.performance < 45
      ? 'Optimise or rebuild'
      : m.performance < 70
        ? 'Performance optimisation project'
        : scores.mobile.seo < 70
          ? 'SEO and on-page improvements'
          : 'Targeted website refresh'

  return {
    score,
    level: levelFromScore(score),
    reasons: reasons.slice(0, 4),
    primaryIssue,
    impact,
    recommendation,
  }
}

export function levelLabel(level: OpportunityLevel): string {
  if (level === 'HIGH') return 'High opportunity'
  if (level === 'MEDIUM') return 'Medium opportunity'
  return 'Low opportunity'
}
