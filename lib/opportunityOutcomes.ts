import type { ScoreInput } from './opportunityScore'

export type ReasonCategory = 'mobile' | 'seo' | 'accessibility' | 'performance' | 'general'

export type ReasonDetail = {
  issue: string
  outcome: string
  category: ReasonCategory
  badge: string
}

function categoryBadge(category: ReasonCategory): string {
  if (category === 'mobile' || category === 'performance') return 'Mobile issue'
  if (category === 'seo') return 'SEO issue'
  if (category === 'accessibility') return 'Accessibility issue'
  return 'Opportunity'
}

export function buildReasonDetails(
  scores: ScoreInput,
  reasons: string[]
): ReasonDetail[] {
  const details: ReasonDetail[] = []
  const m = scores.mobile

  if (m.performance < 70 || reasons.some((r) => /performance|slow|load/i.test(r))) {
    details.push({
      issue: 'Poor mobile performance',
      outcome: 'May be costing enquiries from mobile visitors who leave before the page loads.',
      category: 'mobile',
      badge: categoryBadge('mobile'),
    })
  }

  if (m.seo < 70 || reasons.some((r) => /seo|meta|google/i.test(r))) {
    details.push({
      issue: 'Missing or weak SEO fundamentals',
      outcome: 'Harder to find on Google — likely missing local search traffic and inbound leads.',
      category: 'seo',
      badge: categoryBadge('seo'),
    })
  }

  if (scores.details?.hasMetaDescription === false) {
    details.push({
      issue: 'Missing metadata',
      outcome: 'Google may show a weak snippet — fewer clicks from search results.',
      category: 'seo',
      badge: categoryBadge('seo'),
    })
  }

  if (m.accessibility < 70) {
    details.push({
      issue: 'Accessibility gaps',
      outcome: 'Some visitors struggle to use the site — trust and conversions can suffer.',
      category: 'accessibility',
      badge: categoryBadge('accessibility'),
    })
  }

  if (scores.details?.loadTime && scores.details.loadTime !== 'Unknown') {
    const already = details.some((d) => d.issue.includes('performance'))
    if (!already) {
      details.push({
        issue: `Slow load speed (${scores.details.loadTime})`,
        outcome: 'Visitors on mobile networks may abandon before seeing your offer.',
        category: 'performance',
        badge: categoryBadge('performance'),
      })
    }
  }

  reasons.forEach((reason) => {
    const lower = reason.toLowerCase()
    if (details.some((d) => d.issue.toLowerCase().includes(lower.slice(0, 14)))) return

    let category: ReasonCategory = 'general'
    let outcome = 'Likely affecting how visitors perceive and trust the business online.'

    if (/performance|slow|speed|load/i.test(reason)) {
      category = 'mobile'
      outcome = 'May be costing enquiries from visitors who leave before engaging.'
    } else if (/seo|meta|title|google|rank/i.test(reason)) {
      category = 'seo'
      outcome = 'May be reducing visibility in Google and inbound lead flow.'
    } else if (/accessib|font|tap|contrast/i.test(reason)) {
      category = 'accessibility'
      outcome = 'May frustrate users and reduce trust — especially on mobile.'
    }

    details.push({
      issue: reason,
      outcome,
      category,
      badge: categoryBadge(category),
    })
  })

  if (details.length === 0) {
    details.push({
      issue: 'Clear room to improve the website',
      outcome: 'A refresh could strengthen credibility and help convert more visitors into enquiries.',
      category: 'general',
      badge: 'Opportunity',
    })
  }

  return details.slice(0, 4)
}
