import { NextResponse } from 'next/server'

import { getUserIdFromRequest } from '../../../lib/getUserId'
import { getUserPlan, incrementUsage } from '../../../lib/getUserPlan'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

// Discover real business listings first, then inspect their websites. Organic
// search results were returning articles, directories and large brands that
// happened to rank for the search phrase.

const LOCATION_MAP = {
  sydney: 'Sydney, New South Wales, Australia',
  melbourne: 'Melbourne, Victoria, Australia',
  brisbane: 'Brisbane, Queensland, Australia',
  perth: 'Perth, Western Australia, Australia',
  adelaide: 'Adelaide, South Australia, Australia',
  canberra: 'Canberra, Australian Capital Territory, Australia',
  hobart: 'Hobart, Tasmania, Australia',
  darwin: 'Darwin, Northern Territory, Australia',
  'gold coast': 'Gold Coast, Queensland, Australia',
  newcastle: 'Newcastle, New South Wales, Australia',
  wollongong: 'Wollongong, New South Wales, Australia',
  geelong: 'Geelong, Victoria, Australia',
  'sunshine coast': 'Sunshine Coast, Queensland, Australia',
}

const SUBURB_MAP = {
  sydney: ['Parramatta', 'Liverpool', 'Penrith', 'Campbelltown', 'Blacktown'],
  melbourne: ['Dandenong', 'Werribee', 'Frankston', 'Sunshine'],
  brisbane: ['Logan', 'Ipswich', 'Caboolture', 'Beenleigh'],
  perth: ['Joondalup', 'Midland', 'Rockingham', 'Armadale'],
  adelaide: ['Mawson Lakes', 'Modbury', 'Noarlunga', 'Elizabeth'],
}

const EXCLUDED_DOMAINS = new Set([
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'google.com',
  'yellowpages.com.au',
  'truelocal.com.au',
  'hipages.com.au',
  'oneflare.com.au',
  'airtasker.com',
  'gumtree.com.au',
  'healthengine.com.au',
  'booking.com',
  'tripadvisor.com',
])

const DEFAULT_LOCATION = 'Sydney, New South Wales, Australia'
const MAP_PAGES = 2
const MAP_RESULTS_PER_PAGE = 20
const SEARCH_POOL_LIMIT = 50
const MAX_TO_SCAN = 30
const TARGET_RESULTS = 10
const SCAN_BATCH_SIZE = 4
const FETCH_TIMEOUT_MS = 12000

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectLocation(query = '') {
  const lower = query.toLowerCase()
  const locations = Object.keys(LOCATION_MAP).sort((a, b) => b.length - a.length)

  for (const locationKey of locations) {
    if (lower.includes(locationKey)) {
      return { locationKey, serpLocation: LOCATION_MAP[locationKey] }
    }
  }

  return { locationKey: 'sydney', serpLocation: DEFAULT_LOCATION }
}

function extractIndustry(query = '') {
  let cleaned = query.toLowerCase()
  const locations = Object.keys(LOCATION_MAP).sort((a, b) => b.length - a.length)
  for (const location of locations) cleaned = cleaned.replace(location, '')
  return cleaned.replace(/\s+/g, ' ').trim()
}

function buildSearchQueries(query, preferences = {}) {
  const { locationKey } = detectLocation(query)
  const industry = extractIndustry(query) || query.trim()
  const base = query.toLowerCase().includes(locationKey)
    ? query.trim()
    : `${query.trim()} ${locationKey}`
  const queries = [base]

  if (preferences.preferOuterMetro) {
    for (const suburb of (SUBURB_MAP[locationKey] || []).slice(0, 3)) {
      queries.push(`${industry} ${suburb}`)
    }
  }

  return [...new Set(queries)].filter(Boolean)
}

function extractDomain(url = '') {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
  }
}

function cleanWebsiteUrl(url = '') {
  try {
    const parsed = new URL(url)
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return url
  }
}

function isExcludedWebsite(url = '') {
  const domain = extractDomain(url)
  if (!domain) return true
  return [...EXCLUDED_DOMAINS].some(
    (excluded) => domain === excluded || domain.endsWith(`.${excluded}`)
  )
}

function isClosedMapResult(result) {
  const state = `${result.open_state || ''} ${result.description || ''}`.toLowerCase()
  return state.includes('permanently closed')
}

async function fetchGoogleMapsPage(query, location, start = 0) {
  if (!process.env.SERPAPI_KEY) throw new Error('SERPAPI_KEY is not configured')

  const params = new URLSearchParams({
    api_key: process.env.SERPAPI_KEY,
    engine: 'google_maps',
    type: 'search',
    q: query,
    location,
    z: '12',
    gl: 'au',
    hl: 'en',
    start: String(start),
  })
  const response = await fetch(`https://serpapi.com/search.json?${params}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`SerpApi error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  if (data.error && !Array.isArray(data.local_results)) {
    throw new Error(`SerpApi: ${data.error}`)
  }
  return data.local_results || []
}

function mapPlaceToCandidate(place, query, serpLocation) {
  const website = cleanWebsiteUrl(place.website || '')
  const domain = extractDomain(website)
  if (!website || !domain || isExcludedWebsite(website) || isClosedMapResult(place)) return null

  return {
    title: place.title || 'Unknown Business',
    url: website,
    displayUrl: domain,
    domain,
    snippet: place.description || place.type || '',
    location: place.address || serpLocation,
    phone: place.phone || '',
    rating: Number.isFinite(Number(place.rating)) ? Number(place.rating) : null,
    reviews: Number.isFinite(Number(place.reviews)) ? Number(place.reviews) : 0,
    businessType: place.type || '',
    placeId: place.place_id || place.data_id || '',
    searchQuery: query,
    unclaimedListing: place.unclaimed_listing === true,
  }
}

async function searchBusinesses(query, preferences = {}) {
  const { serpLocation } = detectLocation(query)
  const searchQueries = buildSearchQueries(query, preferences)
  const allPlaces = []

  for (const searchQuery of searchQueries) {
    const pagesForQuery = searchQuery === searchQueries[0] ? MAP_PAGES : 1
    for (let pageIndex = 0; pageIndex < pagesForQuery; pageIndex += 1) {
      try {
        const places = await fetchGoogleMapsPage(
          searchQuery,
          serpLocation,
          pageIndex * MAP_RESULTS_PER_PAGE
        )
        allPlaces.push(...places)
      } catch (error) {
        console.warn(`Google Maps search failed for "${searchQuery}":`, error.message)
      }
      await delay(120)
    }
  }

  const seenDomains = new Set()
  const candidates = []
  for (const place of allPlaces) {
    const candidate = mapPlaceToCandidate(place, query, serpLocation)
    if (!candidate || seenDomains.has(candidate.domain)) continue
    seenDomains.add(candidate.domain)
    candidates.push(candidate)
    if (candidates.length >= SEARCH_POOL_LIMIT) break
  }
  return candidates
}

async function filterOutKnownLeads(
  candidates,
  userId,
  preferences = {}
) {
  if (
    !candidates.length ||
    !userId
  ) {
    return candidates
  }

  const domains =
    candidates
      .map(
        (candidate) =>
          candidate.domain
      )
      .filter(Boolean)

  if (!domains.length) {
    return candidates
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from('leads')
    .select(
      'domain, lead_status'
    )
    .eq(
      'user_id',
      userId
    )
    .in(
      'domain',
      domains
    )

  if (error) {
    console.error(
      'Known-lead filter failed:',
      error
    )

    return candidates
  }

  const existingLeads =
    data || []

  /*
   * When Only fresh prospects is selected,
   * remove every business already saved in Leads.
   */
  if (
    preferences
      .excludePreviouslyReviewed
  ) {
    const knownDomains =
      new Set(
        existingLeads.map(
          (lead) =>
            lead.domain
        )
      )

    return candidates.filter(
      (candidate) =>
        !knownDomains.has(
          candidate.domain
        )
    )
  }

  /*
   * Even when fresh-only is turned off,
   * never return businesses that have already
   * progressed through outreach.
   */
  const excludedStatuses =
    new Set([
      'Contacted',
      'Replied',
      'Meeting Booked',
      'Won',
      'Lost',
      'Do Not Contact',
    ])

  const workedDomains =
    new Set(
      existingLeads
        .filter(
          (lead) =>
            excludedStatuses.has(
              lead.lead_status
            )
        )
        .map(
          (lead) =>
            lead.domain
        )
    )

  return candidates.filter(
    (candidate) =>
      !workedDomains.has(
        candidate.domain
      )
  )
}

async function fetchWebsiteHtml(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    })
    return {
      ok: response.ok,
      status: response.status,
      html: await response.text(),
      finalUrl: response.url || url,
    }
  } catch (error) {
    return { ok: false, status: 0, html: '', finalUrl: url, error: error.message }
  }
}

function detectWebsitePlatform(html = '', finalUrl = '') {
  const lower = html.toLowerCase()
  const url = finalUrl.toLowerCase()
  if (
    lower.includes('data-wf-page') ||
    lower.includes('data-wf-site') ||
    lower.includes('webflow.js') ||
    lower.includes('website-files.com') ||
    url.includes('webflow.io')
  ) return { platform: 'Webflow', confidence: 'high' }
  if (lower.includes('wixstatic.com') || lower.includes('wix-code-sdk')) {
    return { platform: 'Wix', confidence: 'high' }
  }
  if (lower.includes('wp-content') || lower.includes('wp-includes') || lower.includes('wp-json')) {
    return { platform: 'WordPress', confidence: 'high' }
  }
  if (lower.includes('static1.squarespace.com') || lower.includes('squarespace-cdn.com')) {
    return { platform: 'Squarespace', confidence: 'high' }
  }
  if (lower.includes('cdn.shopify.com') || lower.includes('shopify-section')) {
    return { platform: 'Shopify', confidence: 'high' }
  }
  if (lower.includes('weebly.com') || lower.includes('weeblycloud.com')) {
    return { platform: 'Weebly', confidence: 'high' }
  }
  return { platform: 'Custom / Unknown', confidence: 'low' }
}

function estimateBusinessSize(html, text, candidate) {
  const lowerHtml = html.toLowerCase()
  const lowerText = text.toLowerCase()
  const employeeCounts = [...lowerText.matchAll(
    /\b(\d{1,5})\+?\s+(?:employees|staff|team members|people)\b/g
  )]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite)
  const employeeCount = employeeCounts.length ? Math.max(...employeeCounts) : null

  if (employeeCount !== null && employeeCount >= 250) {
    return { size: 'enterprise', confidence: 'high', reason: `${employeeCount}+ employees mentioned` }
  }
  if (employeeCount !== null && employeeCount >= 20) {
    return { size: 'medium', confidence: 'high', reason: `${employeeCount}+ employees mentioned` }
  }
  if (employeeCount !== null && employeeCount <= 10) {
    return { size: 'small', confidence: 'high', reason: `${employeeCount} employees mentioned` }
  }

  const enterprisePatterns = [
    'investor relations', 'annual report', 'offices worldwide', 'global offices',
    'multinational', 'publicly listed', 'global workforce', 'locations across australia',
  ]
  const enterpriseMatches = enterprisePatterns.filter(
    (pattern) => lowerText.includes(pattern) || lowerHtml.includes(pattern)
  ).length
  if (enterpriseMatches >= 2) {
    return { size: 'enterprise', confidence: 'high', reason: 'Multiple enterprise signals found' }
  }

  const smallPatterns = [
    'owner operated', 'owner-operated', 'family owned and operated',
    'family-owned and operated', 'our small team', 'locally owned and operated',
  ]
  if (smallPatterns.some((pattern) => lowerText.includes(pattern))) {
    return { size: 'small', confidence: 'medium', reason: 'Small-business language found' }
  }

  const mediumPatterns = [
    'meet the team', 'our team', 'case studies', 'our clients', 'commercial clients',
    'multiple locations', 'join our team',
  ]
  const mediumMatches = mediumPatterns.filter(
    (pattern) => lowerText.includes(pattern) || lowerHtml.includes(pattern)
  ).length
  if (mediumMatches >= 2) {
    return { size: 'medium', confidence: 'medium', reason: 'Established-business signals found' }
  }

  if (candidate.reviews >= 25 && candidate.reviews <= 1200) {
    return {
      size: 'small-medium',
      confidence: 'low',
      reason: 'Active local business profile; exact team size needs review',
    }
  }
  return { size: 'unknown', confidence: 'low', reason: 'Not enough public evidence to estimate size' }
}

function scanHtmlSignals(html, finalUrl, candidate) {
  const lowerHtml = html.toLowerCase()
  const text = stripHtml(html)
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = stripHtml(titleMatch?.[1] || '')
  const metaDescriptionMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  )
  const reverseMetaDescriptionMatch = html.match(
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i
  )
  const metaDescription =
    metaDescriptionMatch?.[1]?.trim() || reverseMetaDescriptionMatch?.[1]?.trim() || ''
  const platform = detectWebsitePlatform(html, finalUrl)
  const businessSize = estimateBusinessSize(html, text, candidate)

  return {
    hasTitle: title.length > 0,
    title,
    hasMetaDescription: metaDescription.length > 0,
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    hasContactPage: /href=["'][^"']*(contact|get-in-touch|contact-us)[^"']*["']/i.test(html),
    hasPhone: Boolean(candidate.phone),
    phoneSource: candidate.phone ? 'Google Maps business listing' : 'Not provided by business listing',
    hasEmail: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
    hasForm: /<form[\s>]/i.test(html),
    hasSocialLinks:
      lowerHtml.includes('facebook.com') ||
      lowerHtml.includes('instagram.com') ||
      lowerHtml.includes('linkedin.com'),
    outdatedSignal:
      lowerHtml.includes('font-awesome 4') ||
      lowerHtml.includes('jquery-1.') ||
      lowerHtml.includes('jquery 1.'),
    textLength: text.length,
    isHttps: finalUrl.startsWith('https://'),
    platform: platform.platform,
    platformConfidence: platform.confidence,
    businessSize: businessSize.size,
    businessSizeConfidence: businessSize.confidence,
    businessSizeReason: businessSize.reason,
    reviewCount: candidate.reviews,
  }
}

function scoreWebsiteFromSignals(signals) {
  let health = 100
  const problems = []
  if (!signals.isHttps) {
    health -= 20
    problems.push('No HTTPS protection')
  }
  if (!signals.hasTitle) {
    health -= 15
    problems.push('Homepage is missing a page title')
  }
  if (!signals.hasMetaDescription) {
    health -= 15
    problems.push('Homepage is missing a meta description')
  }
  if (!signals.hasViewport) {
    health -= 20
    problems.push('Mobile viewport is not configured')
  }
  if (!signals.hasContactPage) {
    health -= 8
    problems.push('No clear contact-page link found on the homepage')
  }
  if (signals.textLength < 300) {
    health -= 15
    problems.push('Very little readable homepage content')
  } else if (signals.textLength < 600) {
    health -= 7
    problems.push('Limited readable homepage content')
  }
  if (signals.outdatedSignal) {
    health -= 12
    problems.push('Older front-end technology detected')
  }
  return { health: clampScore(health), problems: problems.slice(0, 6) }
}

function matchesSelectedPlatform(platform, selectedPlatforms = []) {
  return (
    !Array.isArray(selectedPlatforms) ||
    selectedPlatforms.length === 0 ||
    selectedPlatforms.includes('any') ||
    selectedPlatforms.includes(platform)
  )
}

function matchesTargetBusinessSize(size, confidence, targetSize = 'small-medium') {
  if (!targetSize || targetSize === 'any') return true
  if (confidence === 'low' || size === 'unknown') return true
  if (targetSize === 'small-medium') {
    return size === 'small' || size === 'medium' || size === 'small-medium'
  }
  return size === targetSize
}

function calculateBusinessFit(candidate, signals) {
  let score = 35
  if (candidate.phone) score += 20
  if (candidate.location) score += 10
  if (candidate.rating !== null) score += 5
  if (candidate.reviews >= 5 && candidate.reviews <= 1000) score += 15
  if (candidate.reviews > 1000 && candidate.reviews <= 3000) score += 5
  if (candidate.reviews > 3000) score -= 10
  if (candidate.unclaimedListing) score -= 5
  if (signals.businessSize === 'enterprise' && signals.businessSizeConfidence !== 'low') score -= 45
  return clampScore(score)
}

function calculatePreferenceMatch(signals, health, preferences = {}) {
  let score = 50
  if (preferences.excludePolishedSites) score += health < 75 ? 20 : health >= 90 ? -20 : 0
  if (preferences.prioritizeContactMobileIssues) {
    if (!signals.hasViewport) score += 20
    if (!signals.hasContactPage) score += 10
  }
  if (preferences.preferLowReview && signals.reviewCount > 0 && signals.reviewCount < 150) {
    score += 10
  }
  return clampScore(score)
}

function buildContactReason(lead) {
  const issue = lead.problems?.[0]
  if (issue) {
    return `This is an active business with a public phone number and website. The scan found a specific issue worth checking before calling: ${issue.toLowerCase()}.`
  }
  return 'This is an active business with a public phone number. Its website needs a manual review before deciding whether there is a genuine reason to call.'
}

function classifyOpportunity(score) {
  if (score >= 70) return { temperature: 'HOT', recommendation: 'Strong opportunity' }
  if (score >= 50) return { temperature: 'WARM', recommendation: 'Worth reviewing' }
  return { temperature: 'COLD', recommendation: 'Weak opportunity' }
}

async function scanCandidate(candidate, preferences = {}) {
  const page = await fetchWebsiteHtml(candidate.url)
  if (!page.ok || !page.html) return { status: 'failed-fetch', lead: null }

  const finalUrl = cleanWebsiteUrl(page.finalUrl || candidate.url)
  const signals = scanHtmlSignals(page.html, finalUrl, candidate)
  if (!matchesSelectedPlatform(signals.platform, preferences.selectedPlatforms)) {
    return { status: 'platform-skip', lead: null }
  }
  if (!matchesTargetBusinessSize(
    signals.businessSize,
    signals.businessSizeConfidence,
    preferences.targetBusinessSize
  )) return { status: 'size-skip', lead: null }

  const website = scoreWebsiteFromSignals(signals)
  const websiteNeed = clampScore(100 - website.health)
  const businessFit = calculateBusinessFit(candidate, signals)
  const preferenceMatch = calculatePreferenceMatch(signals, website.health, preferences)
  const opportunityScore = clampScore(
    websiteNeed * 0.5 + businessFit * 0.4 + preferenceMatch * 0.1
  )
  const classification = classifyOpportunity(opportunityScore)
  const lead = {
    ...candidate,
    url: finalUrl,
    domain: extractDomain(finalUrl),
    scores: {
      overall: website.health,
      performance: null,
      seo: null,
      accessibility: null,
      bestPractices: null,
      isHttps: signals.isHttps,
      hasMetaDescription: signals.hasMetaDescription,
      hasViewport: signals.hasViewport,
      loadTime: null,
      scoredProperly: true,
      lightweight: true,
    },
    opportunityScore,
    leadTemp: classification.temperature,
    recommendation: classification.recommendation,
    problems: website.problems,
    quick_issues: website.problems,
    quick_health_score: website.health,
    platform: signals.platform,
    platformConfidence: signals.platformConfidence,
    estimatedBusinessSize: signals.businessSize,
    businessSizeConfidence: signals.businessSizeConfidence,
    businessSizeReason: signals.businessSizeReason,
    scoreBreakdown: { websiteNeed, businessFit, preferenceMatch },
    signals,
  }
  lead.contactReason = buildContactReason(lead)

  if (!candidate.phone || businessFit < 35) return { status: 'fit-skip', lead: null }
  if (preferences.excludePolishedSites && websiteNeed < 8) {
    return { status: 'healthy-skip', lead: null }
  }
  return { status: 'accepted', lead }
}

async function scanCandidates(candidates, preferences = {}) {
  const accepted = []
  const queue = candidates.slice(0, MAX_TO_SCAN)
  const stats = {
    candidatesTried: 0,
    scannedCount: 0,
    failedFetchCount: 0,
    skippedHealthyCount: 0,
    skippedPlatformCount: 0,
    skippedBusinessSizeCount: 0,
    skippedBusinessFitCount: 0,
    returnedCount: 0,
  }

  for (let index = 0; index < queue.length; index += SCAN_BATCH_SIZE) {
    const batch = queue.slice(index, index + SCAN_BATCH_SIZE)
    const results = await Promise.all(batch.map((candidate) => scanCandidate(candidate, preferences)))
    stats.candidatesTried += batch.length
    for (const result of results) {
      if (result.status === 'failed-fetch') stats.failedFetchCount += 1
      else {
        stats.scannedCount += 1
        if (result.status === 'healthy-skip') stats.skippedHealthyCount += 1
        if (result.status === 'platform-skip') stats.skippedPlatformCount += 1
        if (result.status === 'size-skip') stats.skippedBusinessSizeCount += 1
        if (result.status === 'fit-skip') stats.skippedBusinessFitCount += 1
      }
      if (result.lead) accepted.push(result.lead)
    }
    if (accepted.length >= TARGET_RESULTS) break
    await delay(100)
  }

  const leads = accepted
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, TARGET_RESULTS)
  stats.returnedCount = leads.length
  return { leads, stats }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const query = String(body.query || '').trim()
    const preferences = body.preferences || {}
    if (!query) {
      return NextResponse.json({ error: 'Please provide a search query' }, { status: 400 })
    }

    const userId = getUserIdFromRequest(request)
    if (userId) {
      const planData = await getUserPlan(userId)
      if (planData.searchLimitReached) {
        return NextResponse.json(
          {
            error: `You have used all ${planData.searchLimit} opportunity searches this month.`,
            limitReached: true,
            limitType: 'search',
            used: planData.searchCount,
            limit: planData.searchLimit,
            plan: planData.plan,
          },
          { status: 403 }
        )
      }
    }

    const { serpLocation, locationKey } = detectLocation(query)
    const discovered = await searchBusinesses(query, preferences)
   const candidates =
  await filterOutKnownLeads(
    discovered,
    userId,
    preferences
  )
    const scanned = await scanCandidates(candidates, preferences)
    const hotLeads = scanned.leads.filter((lead) => lead.leadTemp === 'HOT')
    const warmLeads = scanned.leads.filter((lead) => lead.leadTemp === 'WARM')
    if (userId) await incrementUsage(userId, 'search')

    return NextResponse.json({
      success: true,
      query,
      location: serpLocation,
      totalFound: scanned.leads.length,
      hotLeads: hotLeads.length,
      warmLeads: warmLeads.length,
      leads: scanned.leads,
      stats: { locationKey, candidatesFound: candidates.length, ...scanned.stats },
      message:
        scanned.leads.length > 0
          ? 'Businesses qualified from real map listings, callable contact details and verified website evidence.'
          : 'No callable website opportunities matched this search. Try a more specific industry or a nearby suburb.',
    })
  } catch (error) {
    console.error('Prospect finder error:', error)
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}