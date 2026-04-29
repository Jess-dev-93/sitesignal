import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { getUserIdFromRequest } from '../../../lib/getUserId'
import { getUserPlan, incrementUsage } from '../../../lib/getUserPlan'

const EXCLUDED_DOMAINS = [
  'yelp.com',
  'yellowpages.com.au',
  'yellowpages.com',
  'truelocal.com.au',
  'hipages.com.au',
  'hotfrog.com.au',
  'localsearch.com.au',
  'facebook.com',
  'linkedin.com',
  'instagram.com',
  'google.com',
  'wikipedia.org',
  'reddit.com',
  'oneflare.com.au',
  'serviceseeking.com.au',
  'airtasker.com',
  'gumtree.com.au',
  'healthengine.com.au',
  'booking.com',
  'tripadvisor.com',
  'zomato.com',
  'whitepages.com.au',
  'womo.com.au',
]

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
  sydney: [
    'Parramatta',
    'Blacktown',
    'Bankstown',
    'Liverpool',
    'Penrith',
    'Campbelltown',
    'Auburn',
    'Merrylands',
    'Fairfield',
    'Guildford',
  ],
  melbourne: [
    'Dandenong',
    'Sunshine',
    'Werribee',
    'Frankston',
    'Broadmeadows',
    'Footscray',
    'Preston',
    'Reservoir',
    'Craigieburn',
    'Melton',
  ],
  brisbane: [
    'Logan',
    'Ipswich',
    'Caboolture',
    'Chermside',
    'Sunnybank',
    'Redcliffe',
    'Beenleigh',
    'Springfield',
    'Coorparoo',
    'Wynnum',
  ],
  perth: [
    'Joondalup',
    'Midland',
    'Armadale',
    'Rockingham',
    'Morley',
    'Cannington',
    'Belmont',
    'Gosnells',
  ],
  adelaide: [
    'Elizabeth',
    'Mawson Lakes',
    'Prospect',
    'Glenelg',
    'Modbury',
    'Noarlunga',
    'Morphett Vale',
  ],
}

const DEFAULT_LOCATION = 'Sydney, New South Wales, Australia'
const SEARCH_POOL_LIMIT = 30
const MAX_TO_SCAN = 15
const TARGET_RESULTS = 8
const SCAN_BATCH_SIZE = 3
const FETCH_TIMEOUT_MS = 12000

// ===== SERP cost controls =====
const DEFAULT_EXPAND = false;          // default: do NOT suburb-expand
const MAX_EXPANDED_SUBURBS = 3;        // if expand=true, only use 3 suburbs
const INCLUDE_WEBSITE_VARIANT = false; // don't do "query website" by default

// ===== anti-repeat controls =====
const SEEN_TTL_DAYS = 30;              // don't re-return domains seen in last 30 days

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function detectLocation(query) {
  const lower = (query || '').toLowerCase()
  const sortedLocations = Object.keys(LOCATION_MAP).sort((a, b) => b.length - a.length)

  for (const location of sortedLocations) {
    if (lower.includes(location)) {
      return {
        locationKey: location,
        serpLocation: LOCATION_MAP[location],
      }
    }
  }

  return {
    locationKey: 'sydney',
    serpLocation: DEFAULT_LOCATION,
  }
}

function normalizeReviewCount(reviewTextOrNumber) {
  if (typeof reviewTextOrNumber === 'number') return reviewTextOrNumber;
  if (!reviewTextOrNumber) return 0;

  const cleaned = String(reviewTextOrNumber).replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function suburbLooksOuterMetro(suburb = '') {
  const outerKeywords = [
    'parramatta',
    'blacktown',
    'penrith',
    'campbelltown',
    'liverpool',
    'bankstown',
    'mount druitt',
    'fairfield',
    'auburn',
    'granville',
  ];

  const s = String(suburb).toLowerCase();
  return outerKeywords.some((k) => s.includes(k));
}

function looksPolishedSite(lead) {
  const score = lead.quick_health_score || 0;
  const issues = Array.isArray(lead.quick_issues) ? lead.quick_issues : [];

  // Very rough heuristic
  if (score >= 80 && issues.length <= 1) return true;
  return false;
}

function computeLeadScore(lead, preferences = {}) {
  let score = 0;

  const reviewCount = normalizeReviewCount(lead.review_count || lead.reviews || 0);
  const issues = Array.isArray(lead.quick_issues) ? lead.quick_issues : [];
  const health = lead.quick_health_score || 0;
  const suburb = lead.suburb || '';

  // Base weakness
  score += Math.max(0, 100 - health) * 0.35;
  score += Math.min(issues.length * 6, 30);

  // Preference: low review
  if (preferences.preferLowReview) {
    if (reviewCount <= 20) score += 12;
    else if (reviewCount <= 50) score += 6;
    else score -= 6;
  }

  // Preference: outer metro
  if (preferences.preferOuterMetro && suburbLooksOuterMetro(suburb)) {
    score += 10;
  }

  // Preference: exclude polished
  if (preferences.excludePolishedSites && looksPolishedSite(lead)) {
    score -= 15;
  }

  // Preference: contact/mobile issues
  if (preferences.prioritizeContactMobileIssues) {
    const issueText = issues.join(' ').toLowerCase();
    if (issueText.includes('contact')) score += 8;
    if (issueText.includes('phone')) score += 6;
    if (issueText.includes('email')) score += 6;
    if (issueText.includes('mobile')) score += 8;
    if (issueText.includes('viewport')) score += 8;
  }

  return Math.round(score);
}

function classifyTemperature(score) {
  if (score >= 45) return 'hot';
  if (score >= 25) return 'warm';
  return 'new';
}

function mapLeadToPreferenceScoreShape(lead) {
  return {
    review_count: lead?.signals?.reviewHeavySignal ? 150 : 10,
    quick_issues: lead?.problems || [],
    quick_health_score: lead?.scores?.overall ?? 100,
    suburb: lead?.title || '',
  }
}

function extractIndustry(query) {
  const lower = (query || '').toLowerCase()
  const locations = Object.keys(LOCATION_MAP).sort((a, b) => b.length - a.length)

  let cleaned = lower
  for (const loc of locations) {
    cleaned = cleaned.replace(loc, '')
  }

  return cleaned.replace(/\s+/g, ' ').trim()
}

function buildBaseQuery(userInput) {
  const { locationKey } = detectLocation(userInput)
  const lower = userInput.toLowerCase()

  if (lower.includes(locationKey)) return userInput.trim()
  return `${userInput.trim()} ${locationKey}`
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
  }
}

function isExcludedUrl(url) {
  const lower = (url || '').toLowerCase()
  if (!lower.startsWith('http')) return true
  if (lower.includes('/search?') || lower.includes('?q=')) return true
  return EXCLUDED_DOMAINS.some((domain) => lower.includes(domain))
}

function isLikelyArticleOrListPage(url, title = '', snippet = '') {
  const lowerUrl = (url || '').toLowerCase()
  const lowerTitle = (title || '').toLowerCase()
  const lowerSnippet = (snippet || '').toLowerCase()

  const badUrlPatterns = [
    '/blog/',
    '/news/',
    '/travel/',
    '/guide/',
    '/guides/',
    '/featured/',
    '/category/',
    '/tag/',
    '/author/',
    '/magazine/',
    '/articles/',
    '/article/',
    '/food-and-drink/',
    '/best-',
    '/top-',
    '/things-to-do/',
  ]

  const badTextPatterns = [
    'best ',
    'top ',
    'guide to',
    'things to do',
    'where to eat',
    'round up',
    'roundup',
    'our favourite',
    'must visit',
    'travel guide',
  ]

  if (badUrlPatterns.some((pattern) => lowerUrl.includes(pattern))) return true
  if (badTextPatterns.some((pattern) => lowerTitle.includes(pattern))) return true
  if (badTextPatterns.some((pattern) => lowerSnippet.includes(pattern))) return true

  return false
}

function isLikelyBusinessWebsite(url) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname || '/'

    if (path === '/' || path === '') return true

    const cleanPath = path.replace(/\/+$/, '')
    const segments = cleanPath.split('/').filter(Boolean)

    return segments.length <= 1
  } catch {
    return false
  }
}

function scoreCandidateQuality(result) {
  let score = 0
  const url = result.link || ''
  const title = result.title || ''
  const snippet = result.snippet || ''

  if (isLikelyBusinessWebsite(url)) score += 30
  if (!isLikelyArticleOrListPage(url, title, snippet)) score += 30

  const lowerTitle = title.toLowerCase()
  const lowerSnippet = snippet.toLowerCase()

  if (
    lowerTitle.includes('24/7') ||
    lowerTitle.includes('local') ||
    lowerTitle.includes('emergency')
  ) {
    score += 8
  }

  if (
    lowerSnippet.includes('contact') ||
    lowerSnippet.includes('services') ||
    lowerSnippet.includes('about us')
  ) {
    score += 10
  }

  if (/\b\d{3,}\+?\s*reviews?\b/i.test(title)) {
    score -= 15
  }

  return score
}

function buildExpandedQueries(query, options = {}) {
  const {
    expand = DEFAULT_EXPAND,
    maxSuburbs = MAX_EXPANDED_SUBURBS,
    includeWebsiteVariant = INCLUDE_WEBSITE_VARIANT,
  } = options;

  const { locationKey } = detectLocation(query);
  const industry = extractIndustry(query);
  const baseQuery = buildBaseQuery(query);

  // Cheapest mode: exactly ONE query
  if (!expand) {
    return [baseQuery];
  }

  const suburbs = SUBURB_MAP[locationKey] || [];
  const queries = [];

  if (suburbs.length > 0 && industry) {
    for (const suburb of suburbs.slice(0, maxSuburbs)) {
      queries.push(`${industry} ${suburb}`);
      if (includeWebsiteVariant) queries.push(`${industry} ${suburb} website`);
    }
  }

  queries.push(baseQuery);
  if (includeWebsiteVariant) queries.push(`${baseQuery} website`);

  return [...new Set(queries)].filter(Boolean);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value))
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/* ─────────────────────────────────────────────
   SERP SEARCH
───────────────────────────────────────────── */
async function fetchSerpPage(query, serpLocation, start = 0) {
  const params = new URLSearchParams({
    api_key: process.env.SERPAPI_KEY,
    engine: 'google',
    q: query,
    location: serpLocation,
    gl: 'au',
    hl: 'en',
    google_domain: 'google.com.au',
    num: '10',
    start: String(start),
  })

  const response = await fetch(`https://serpapi.com/search.json?${params}`)

  if (!response.ok) {
    throw new Error(`SerpApi error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`SerpApi: ${data.error}`)
  }

  return data.organic_results || []
}

async function searchWebsites(query, options = {}) {
  const { serpLocation } = detectLocation(query);

  const expandedQueries = buildExpandedQueries(query, options);
  const allResults = [];

  console.log('🌏 Detected location:', serpLocation);
  console.log('🧭 Queries used:', expandedQueries);

  for (const q of expandedQueries) {
    try {
      console.log(`🔎 Searching "${q}"`);
      const results = await fetchSerpPage(q, serpLocation, 0);
      allResults.push(...results);
      await delay(120); // tiny pacing helps avoid burst limits
    } catch (error) {
      console.log(`⚠️ SERP fetch failed for "${q}": ${error.message}`);
    }
  }

  console.log(`📋 Raw combined results: ${allResults.length}`);

  const filtered = allResults.filter((result) => {
    const url = result.link || '';
    if (isExcludedUrl(url)) return false;
    if (isLikelyArticleOrListPage(url, result.title, result.snippet)) return false;
    return true;
  });

  console.log(`✅ After filtering: ${filtered.length}`);

  const seenDomains = new Set();
  const uniqueSites = [];

  const sortedCandidates = filtered
    .map((result) => ({
      ...result,
      candidateQuality: scoreCandidateQuality(result),
    }))
    .sort((a, b) => b.candidateQuality - a.candidateQuality);

  for (const result of sortedCandidates) {
    const domain = extractDomain(result.link || '');
    if (!domain || seenDomains.has(domain)) continue;

    seenDomains.add(domain);

    uniqueSites.push({
      url: result.link,
      title: result.title || 'Unknown Business',
      snippet: result.snippet || '',
      displayUrl: result.displayed_link || result.link,
      domain,
      candidateQuality: result.candidateQuality,
    });

    if (uniqueSites.length >= SEARCH_POOL_LIMIT) break;
  }

  console.log(`🧹 After dedupe: ${uniqueSites.length}`);

  return uniqueSites;
}
/* ─────────────────────────────────────────────
   FILTER OUT PREVIOUSLY WORKED LEADS
───────────────────────────────────────────── */
async function filterOutWorkedLeads(sites) {
  if (!sites.length) return []

  const domains = sites.map((site) => site.domain).filter(Boolean)

  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('domain, lead_status')
    .in('domain', domains)

  if (error) {
    console.error('❌ Supabase filter error:', error)
    return sites
  }

  const skipStatuses = new Set(['Contacted', 'Won', 'Lost'])
  const workedDomains = new Set(
    (data || [])
      .filter((row) => skipStatuses.has(row.lead_status))
      .map((row) => row.domain)
  )

  const filteredSites = sites.filter((site) => !workedDomains.has(site.domain))

  console.log(`🚫 Skipped worked leads: ${sites.length - filteredSites.length}`)
  console.log(`✅ Remaining candidates: ${filteredSites.length}`)

  return filteredSites
}

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function filterOutRecentlySeenLeads(sites, ttlDays = SEEN_TTL_DAYS) {
  if (!sites.length) return [];

  const domains = sites.map((s) => s.domain);
  const cutoff = daysAgoIso(ttlDays);

  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('domain, last_seen_at')
    .in('domain', domains);

  if (error) {
    console.error('❌ Supabase recently-seen filter error:', error);
    return sites;
  }

  const recentlySeen = new Set(
    (data || [])
      .filter((row) => row.last_seen_at && row.last_seen_at > cutoff)
      .map((row) => row.domain)
  );

  const filteredSites = sites.filter((s) => !recentlySeen.has(s.domain));

  console.log(`🕒 Skipped recently seen (TTL ${ttlDays}d): ${sites.length - filteredSites.length}`);
  return filteredSites;
}

/* ─────────────────────────────────────────────
   LIGHTWEIGHT WEBSITE SCAN
───────────────────────────────────────────── */
async function fetchWebsiteHtml(url) {
  const started = Date.now()

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

    const elapsedMs = Date.now() - started
    const html = await response.text()

    return {
      ok: response.ok,
      status: response.status,
      html,
      elapsedMs,
      finalUrl: response.url || url,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      html: '',
      elapsedMs: Date.now() - started,
      finalUrl: url,
      error: error.message,
    }
  }
}

function scanHtmlSignals(url, html, elapsedMs, finalUrl) {
  const lowerHtml = html.toLowerCase()
  const text = stripHtml(html)
  const textLength = text.length

  const hasTitle = /<title[^>]*>(.*?)<\/title>/i.test(html)

  const metaDescriptionMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  )
  const metaDescription = metaDescriptionMatch?.[1]?.trim() || ''
  const hasMetaDescription = metaDescription.length > 0

  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html)
  const hasContactPage =
    /href=["'][^"']*(contact|get-in-touch|contact-us)[^"']*["']/i.test(html)

  const hasPhone =
    /(\+?61|0)[2-9]\d{8}|04\d{8}|\(?0\d\)?[\s-]?\d{4}[\s-]?\d{4}/.test(text)

  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
  const hasForm = /<form[\s>]/i.test(html)

  const hasSocialLinks =
    lowerHtml.includes('facebook.com') ||
    lowerHtml.includes('instagram.com') ||
    lowerHtml.includes('linkedin.com')

  const cheapSiteSignal =
    lowerHtml.includes('wix.com') ||
    lowerHtml.includes('squarespace') ||
    lowerHtml.includes('weebly.com') ||
    lowerHtml.includes('coming soon')

  const outdatedSignal =
    lowerHtml.includes('font-awesome 4') ||
    lowerHtml.includes('jquery-1.') ||
    lowerHtml.includes('jquery 1.')

  const reviewHeavySignal =
    /\b\d{3,}\+?\s*reviews?\b/i.test(text)

  return {
    hasTitle,
    hasMetaDescription,
    hasViewport,
    hasContactPage,
    hasPhone,
    hasEmail,
    hasForm,
    hasSocialLinks,
    cheapSiteSignal,
    outdatedSignal,
    reviewHeavySignal,
    textLength,
    elapsedMs,
    isHttps: (finalUrl || url).startsWith('https://'),
  }
}

function scoreWebsiteFromSignals(signals) {
  let health = 100
  const problems = []

  if (!signals.isHttps) {
    health -= 15
    problems.push('🔓 No SSL')
  }

  if (!signals.hasTitle) {
    health -= 10
    problems.push('🏷️ Missing page title')
  }

  if (!signals.hasMetaDescription) {
    health -= 12
    problems.push('📝 Missing meta description')
  }

  if (!signals.hasViewport) {
    health -= 15
    problems.push('📱 Mobile viewport issues')
  }

  if (!signals.hasContactPage) {
    health -= 8
    problems.push('📞 No clear contact page')
  }

  if (!signals.hasPhone) {
    health -= 8
    problems.push('☎️ No phone number found')
  }

  if (!signals.hasEmail) {
    health -= 6
    problems.push('✉️ No email found')
  }

  if (!signals.hasForm) {
    health -= 5
    problems.push('🧾 No contact form found')
  }

  if (!signals.hasSocialLinks) {
    health -= 3
    problems.push('🔗 No social links found')
  }

  if (signals.textLength < 500) {
    health -= 18
    problems.push('📄 Thin homepage copy')
  } else if (signals.textLength < 1000) {
    health -= 10
    problems.push('📄 Limited homepage copy')
  }

  if (signals.elapsedMs > 7000) {
    health -= 18
    problems.push('🐌 Slow homepage response')
  } else if (signals.elapsedMs > 4000) {
    health -= 10
    problems.push('⏳ Slower response time')
  }

  if (signals.cheapSiteSignal) {
    health -= 10
    problems.push('🧩 Builder / placeholder signal')
  }

  if (signals.outdatedSignal) {
    health -= 10
    problems.push('🕰️ Older tech signal')
  }

  if (signals.reviewHeavySignal) {
    health += 8
  }

  health = clampScore(health)

  let opportunityScore = 100 - health
  opportunityScore = clampScore(opportunityScore)

  let leadTemp = 'COLD'
  if (opportunityScore >= 45) leadTemp = 'HOT'
  else if (opportunityScore >= 25) leadTemp = 'WARM'

  let estimatedValue = '\$800 - \$1,500'
  if (opportunityScore >= 45) estimatedValue = '\$3,000 - \$8,000'
  else if (opportunityScore >= 25) estimatedValue = '\$1,500 - \$3,000'

  return {
    health,
    opportunityScore,
    leadTemp,
    estimatedValue,
    problems: problems.slice(0, 6),
  }
}

function isWorthReturningLead(lead) {
  const health = lead?.scores?.overall ?? 100
  const opp = lead?.opportunityScore ?? 0

  // loosen thresholds so you actually get leads
  if (opp >= 10) return true
  if (health <= 90) return true
  return false
}

async function lightweightScan(site) {
  const page = await fetchWebsiteHtml(site.url)

  if (!page.ok || !page.html) {
    console.log(`⚠️ Failed to fetch ${site.url} (${page.status || page.error || 'unknown'})`)
    return {
      status: 'failed-fetch',
      lead: null,
    }
  }

  const signals = scanHtmlSignals(site.url, page.html, page.elapsedMs, page.finalUrl)
  const scored = scoreWebsiteFromSignals(signals)

  const lead = {
    title: site.title,
    url: page.finalUrl || site.url,
    displayUrl: site.displayUrl,
    snippet: site.snippet,
    domain: extractDomain(page.finalUrl || site.url),
    scores: {
      overall: scored.health,
      performance: null,
      seo: null,
      accessibility: null,
      bestPractices: null,
      isHttps: signals.isHttps,
      hasMetaDescription: signals.hasMetaDescription,
      hasViewport: signals.hasViewport,
      loadTime: `${page.elapsedMs} ms`,
      scoredProperly: true,
      lightweight: true,
    },
    opportunityScore: scored.opportunityScore,
    problems: scored.problems,
    leadTemp: scored.leadTemp,
    estimatedValue: scored.estimatedValue,
    candidateQuality: site.candidateQuality,
    isGoodLead: scored.leadTemp === 'HOT' || scored.leadTemp === 'WARM',
    signals: {
      hasTitle: signals.hasTitle,
      hasMetaDescription: signals.hasMetaDescription,
      hasViewport: signals.hasViewport,
      hasContactPage: signals.hasContactPage,
      hasPhone: signals.hasPhone,
      hasEmail: signals.hasEmail,
      hasForm: signals.hasForm,
      hasSocialLinks: signals.hasSocialLinks,
      cheapSiteSignal: signals.cheapSiteSignal,
      outdatedSignal: signals.outdatedSignal,
      reviewHeavySignal: signals.reviewHeavySignal,
      textLength: signals.textLength,
      responseTimeMs: signals.elapsedMs,
    },
  }

  if (!isWorthReturningLead(lead)) {
    console.log(
  `🧼 Skipping healthy lead: ${lead.domain} (health ${lead.scores.overall}, opp ${lead.opportunityScore})`
)
    return {
      status: 'healthy-skip',
      lead: null,
    }
  }

  return {
    status: 'accepted',
    lead,
  }
}

/* ─────────────────────────────────────────────
   SAVE TO SUPABASE
───────────────────────────────────────────── */
async function saveLeadToSupabase(lead, query) {
  const { serpLocation } = detectLocation(query)
  const industry = extractIndustry(query)

  const payload = {
    domain: lead.domain,
    business_name: lead.title,
    website_url: lead.url,
    display_url: lead.displayUrl,
    snippet: lead.snippet,
    query_found: query,
    industry: industry || query,
    location: serpLocation,

    website_health_score: lead.scores.overall,
    opportunity_score: lead.opportunityScore,
    performance: lead.scores.performance,
    seo: lead.scores.seo,
    accessibility: lead.scores.accessibility,
    best_practices: lead.scores.bestPractices,

    is_https: lead.scores.isHttps,
    has_meta_description: lead.scores.hasMetaDescription,
    has_viewport: lead.scores.hasViewport,
    load_time: lead.scores.loadTime,

    lead_temp: lead.leadTemp,
    estimated_value: lead.estimatedValue,
    last_seen_at: new Date().toISOString(),
  }

  const { data: existingLead } = await supabaseAdmin
    .from('leads')
    .select(
      'id, notes, lead_status, contact_name, contact_email, contact_phone, response_summary, follow_up_at, outreach_last_sent_at'
    )
    .eq('domain', lead.domain)
    .maybeSingle()

  if (existingLead) {
    payload.notes = existingLead.notes ?? ''
    payload.lead_status = existingLead.lead_status ?? 'New'
    payload.contact_name = existingLead.contact_name ?? null
    payload.contact_email = existingLead.contact_email ?? null
    payload.contact_phone = existingLead.contact_phone ?? null
    payload.response_summary = existingLead.response_summary ?? null
    payload.follow_up_at = existingLead.follow_up_at ?? null
    payload.outreach_last_sent_at = existingLead.outreach_last_sent_at ?? null
  }

  const { error } = await supabaseAdmin
    .from('leads')
    .upsert(payload, { onConflict: 'domain' })

  if (error) {
    console.error('❌ Supabase upsert error:', error)
  } else {
    console.log(`💾 Saved lead: ${lead.domain}`)
  }
}

/* ─────────────────────────────────────────────
   SCAN PIPELINE
───────────────────────────────────────────── */
async function scanCandidates(candidates, query) {
  const acceptedResults = []
  const queue = candidates.slice(0, MAX_TO_SCAN)

  let candidatesTried = 0
  let scannedCount = 0
  let failedFetchCount = 0
  let skippedHealthyCount = 0

  for (let i = 0; i < queue.length; i += SCAN_BATCH_SIZE) {
    const batch = queue.slice(i, i + SCAN_BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(async (site) => {
        candidatesTried += 1

        const result = await lightweightScan(site)

        if (result.status === 'failed-fetch') {
          failedFetchCount += 1
          return null
        }

        if (result.status === 'healthy-skip') {
          scannedCount += 1
          skippedHealthyCount += 1
          return null
        }

        if (result.status === 'accepted' && result.lead) {
          scannedCount += 1
          await saveLeadToSupabase(result.lead, query)
          return result.lead
        }

        return null
      })
    )

    for (const result of batchResults) {
      if (result) acceptedResults.push(result)
    }

    if (acceptedResults.length >= TARGET_RESULTS) break
    await delay(150)
  }

  return {
    leads: acceptedResults,
    stats: {
      candidatesTried,
      scannedCount,
      failedFetchCount,
      skippedHealthyCount,
      returnedCount: acceptedResults.length,
    },
  }
}

/* ─────────────────────────────────────────────
   MAIN POST HANDLER
───────────────────────────────────────────── */
export async function POST(request) {
  try {
    const body = await request.json()
    const { query, preferences = {} } = body;

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Please provide a search query' },
        { status: 400 }
      )
    }

    // ── Usage limit check ─────────────────────────
    const userId = getUserIdFromRequest(request)

    if (userId) {
      const planData = await getUserPlan(userId)

      if (planData.searchLimitReached) {
        console.log(`🚫 Search limit reached for userId: ${userId} (${planData.searchCount}/${planData.searchLimit})`)
        return NextResponse.json(
          {
            error: `You have used all ${planData.searchLimit} free lead searches this month. Upgrade to Pro for unlimited searches.`,
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

    console.log(`\n🚀 Starting lead search for: "${query}"`)
    const { serpLocation, locationKey } = detectLocation(query)
    console.log(`📍 Using location: ${serpLocation}`)

    const searchPool = await searchWebsites(query, {
  expand: false,
  maxSuburbs: 0,
  includeWebsiteVariant: false,
});

    if (searchPool.length === 0) {
      // Still increment — they used the search even if no results
      if (userId) await incrementUsage(userId, 'search')

      return NextResponse.json({
        success: true,
        query,
        location: serpLocation,
        totalFound: 0,
        hotLeads: 0,
        warmLeads: 0,
        leads: [],
        stats: {
          locationKey,
          candidatesFound: 0,
          candidatesTried: 0,
          scannedCount: 0,
          failedFetchCount: 0,
          skippedHealthyCount: 0,
          returnedCount: 0,
        },
        message: 'No websites found. Try a different search term.',
      })
    }

    let freshCandidates = await filterOutWorkedLeads(searchPool);
freshCandidates = await filterOutRecentlySeenLeads(freshCandidates, SEEN_TTL_DAYS);

    if (freshCandidates.length === 0) {
      if (userId) await incrementUsage(userId, 'search')

      return NextResponse.json({
        success: true,
        query,
        location: serpLocation,
        totalFound: 0,
        hotLeads: 0,
        warmLeads: 0,
        leads: [],
        stats: {
          locationKey,
          candidatesFound: 0,
          candidatesTried: 0,
          scannedCount: 0,
          failedFetchCount: 0,
          skippedHealthyCount: 0,
          returnedCount: 0,
        },
        message:
          'No fresh leads found. Try a different search term or update your lead statuses.',
      })
    }

    const scanned = await scanCandidates(freshCandidates, query)

    const preferenceRankedResults = scanned.leads.map((lead) => {
      const preferenceShape = mapLeadToPreferenceScoreShape(lead)
      const preferenceBoost = computeLeadScore(preferenceShape, preferences)

      const adjustedOpportunityScore = clampScore(
        Math.round((lead.opportunityScore || 0) + preferenceBoost * 0.35)
      )

      let adjustedLeadTemp = 'COLD'
      if (adjustedOpportunityScore >= 45) adjustedLeadTemp = 'HOT'
      else if (adjustedOpportunityScore >= 25) adjustedLeadTemp = 'WARM'

      return {
        ...lead,
        opportunityScore: adjustedOpportunityScore,
        leadTemp: adjustedLeadTemp,
        preferenceBoost,
        quick_issues: lead.problems || [],
        quick_health_score: lead.scores?.overall ?? 100,
        suburb: lead.title || '',
      }
    })

    const sortedResults = preferenceRankedResults
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, TARGET_RESULTS)

    const hotLeads = sortedResults.filter((r) => r.leadTemp === 'HOT')
    const warmLeads = sortedResults.filter((r) => r.leadTemp === 'WARM')

    // ── Increment usage AFTER successful search ───
    if (userId) {
      await incrementUsage(userId, 'search')
      console.log(`📊 Search usage incremented for userId: ${userId}`)
    }

    return NextResponse.json({
      success: true,
      query,
      location: serpLocation,
      totalFound: sortedResults.length,
      hotLeads: hotLeads.length,
      warmLeads: warmLeads.length,
      leads: sortedResults,
      stats: {
        locationKey,
        candidatesFound: freshCandidates.length,
        ...scanned.stats,
      },
      message:
        sortedResults.length > 0
          ? 'Leads found using single-query lightweight discovery.'
          : 'No viable leads found from the current candidate pool.',
    })
  } catch (error) {
    console.error('❌ Lead finder error:', error)
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}