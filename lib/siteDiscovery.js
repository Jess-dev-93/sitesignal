const EXCLUDED_PATH_PATTERNS = [
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/admin/i,
  /\/login/i,
  /\/signin/i,
  /\/sign-in/i,
  /\/account/i,
  /\/cart/i,
  /\/checkout/i,
  /\/api\//i,
  /\/wp-json\//i,
  /\/graphql/i,
  /\/xmlrpc\.php/i,
  /\/oauth/i,
  /\/auth/i,
]

const EXCLUDED_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.avif',
  '.ico',
  '.bmp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
  '.rar',
  '.7z',
  '.mp3',
  '.mp4',
  '.mov',
  '.avi',
  '.css',
  '.js',
  '.json',
  '.xml',
  '.txt',
]

function normaliseUrl(inputUrl) {
  if (!inputUrl) return null

  const trimmed = inputUrl.trim()
  if (!trimmed) return null

  let rawUrl = trimmed
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`
  }

  try {
    const parsed = new URL(rawUrl)
    parsed.hash = ''
    parsed.search = ''

    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = '/'
    }

    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return null
  }
}

function isSameOrigin(url, origin) {
  try {
    const parsed = new URL(url)
    return parsed.origin === origin
  } catch {
    return false
  }
}

function hasExcludedExtension(pathname) {
  const lower = pathname.toLowerCase()
  return EXCLUDED_EXTENSIONS.some((extension) => lower.endsWith(extension))
}

function isExcludedPath(pathname) {
  return EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(pathname))
}

function isLikelyPageUrl(url, origin) {
  if (!url || !origin) return false

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false
  }

  if (!isSameOrigin(url, origin)) {
    return false
  }

  try {
    const parsed = new URL(url)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    if (parsed.pathname === '/favicon.ico') {
      return false
    }

    if (hasExcludedExtension(parsed.pathname)) {
      return false
    }

    if (isExcludedPath(parsed.pathname)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function extractLinksFromHtml(html, pageUrl) {
  const links = []
  const pattern = /<a\s+[^>]*href=["']([^"']+)["']/gi

  for (const match of html.matchAll(pattern)) {
    const href = match[1]?.trim()
    if (!href) continue

    if (href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue
    }

    try {
      const absoluteUrl = new URL(href, pageUrl).toString()
      links.push(absoluteUrl)
    } catch {
      // Skip malformed links
    }
  }

  return links
}

async function fetchText(url, headers = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SiteSignal-Discovery/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...headers,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.text()
  } catch {
    return null
  }
}

async function collectPagesFromSitemap(url, origin, discoveredPages, seenPages, seenSitemaps, maxPages) {
  if (seenSitemaps.has(url)) return
  seenSitemaps.add(url)

  const xml = await fetchText(url)
  if (!xml) return

  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)]
  const locs = matches
    .map((match) => match[1]?.trim())
    .filter(Boolean)

  for (const loc of locs) {
    if (discoveredPages.length >= maxPages) break

    const normalisedLoc = normaliseUrl(loc)
    if (!normalisedLoc) continue

    if (normalisedLoc.endsWith('.xml') || normalisedLoc.includes('/sitemap')) {
      if (seenSitemaps.size < maxPages * 2) {
        await collectPagesFromSitemap(
          normalisedLoc,
          origin,
          discoveredPages,
          seenPages,
          seenSitemaps,
          maxPages
        )
      }
      continue
    }

    if (!isLikelyPageUrl(normalisedLoc, origin)) continue
    if (seenPages.has(normalisedLoc)) continue

    discoveredPages.push(normalisedLoc)
    seenPages.add(normalisedLoc)
  }
}

async function fallbackCrawl(origin, startUrl, discoveredPages, seenPages, maxPages) {
  const queue = [startUrl].filter(Boolean)
  const visited = new Set()

  while (queue.length > 0 && discoveredPages.length < maxPages) {
    const currentUrl = queue.shift()
    if (!currentUrl || visited.has(currentUrl)) continue
    visited.add(currentUrl)

    const normalisedCurrent = normaliseUrl(currentUrl)
    if (!normalisedCurrent || !isLikelyPageUrl(normalisedCurrent, origin)) continue

    if (!seenPages.has(normalisedCurrent)) {
      discoveredPages.push(normalisedCurrent)
      seenPages.add(normalisedCurrent)
    }

    if (discoveredPages.length >= maxPages) break

    const html = await fetchText(normalisedCurrent)
    if (!html) continue

    const links = extractLinksFromHtml(html, normalisedCurrent)

    for (const link of links) {
      const normalisedLink = normaliseUrl(link)
      if (!normalisedLink || !isLikelyPageUrl(normalisedLink, origin)) continue
      if (seenPages.has(normalisedLink)) continue
      queue.push(normalisedLink)
    }
  }
}

function recommendImportantPages(discoveredPages, origin) {
  const pages = discoveredPages.filter(Boolean)
  if (pages.length === 0) {
    return [origin.endsWith('/') ? origin : `${origin}/`]
  }

  const scoredPages = pages.map((page) => {
    const parsed = new URL(page)
    const pathname = parsed.pathname.toLowerCase()

    let score = 0

    if (pathname === '/' || pathname === '') score += 100
    if (/(service|services|product|products|solution|solutions|offer|offers)/.test(pathname)) {
      score += 40
    }
    if (/(about|company|who-we-are|our-story|story)/.test(pathname)) {
      score += 35
    }
    if (/(contact|contact-us|get-in-touch|book|quote|request|enquire|appointment|start)/.test(pathname)) {
      score += 35
    }
    if (/(pricing|packages|plans|cost|estimate)/.test(pathname)) {
      score += 25
    }
    if (/(testimonial|testimonials|reviews|portfolio|work|case-study|case-studies)/.test(pathname)) {
      score += 20
    }
    if (pathname.includes('/blog')) {
      score += 15
    }

    return { page, score }
  })

  scoredPages.sort((a, b) => b.score - a.score || a.page.localeCompare(b.page))

  const recommended = []
  const seen = new Set()

  for (const entry of scoredPages) {
    if (recommended.length >= 5) break
    if (seen.has(entry.page)) continue
    seen.add(entry.page)
    recommended.push(entry.page)
  }

  if (recommended.length < 5) {
    for (const page of pages) {
      if (recommended.length >= 5) break
      if (seen.has(page)) continue
      seen.add(page)
      recommended.push(page)
    }
  }

  return recommended
}

export async function discoverSitePages(inputUrl, { maxPages = 20 } = {}) {
  const rootUrl = normaliseUrl(inputUrl)
  if (!rootUrl) {
    return {
      success: false,
      error: 'Please provide a valid website URL.',
      discoveredPages: [],
      recommendedPages: [],
      discoveredCount: 0,
      source: 'none',
      url: '',
      origin: '',
    }
  }

  const origin = new URL(rootUrl).origin
  const discoveredPages = []
  const seenPages = new Set()
  const seenSitemaps = new Set()
  const sitemapCandidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap/sitemap.xml`,
    `${origin}/sitemap-index.xml`,
  ]

  let source = 'crawl'

  for (const sitemapUrl of sitemapCandidates) {
    if (discoveredPages.length >= maxPages) break
    await collectPagesFromSitemap(
      sitemapUrl,
      origin,
      discoveredPages,
      seenPages,
      seenSitemaps,
      maxPages
    )
  }

  if (discoveredPages.length > 0) {
    source = 'sitemap'
  }

  if (discoveredPages.length < maxPages) {
    await fallbackCrawl(origin, rootUrl, discoveredPages, seenPages, maxPages)
    if (discoveredPages.length > 0 && source === 'sitemap') {
      source = 'sitemap+crawl'
    }
  }

  const trimmedPages = discoveredPages.slice(0, maxPages)
  const recommendedPages = recommendImportantPages(trimmedPages, origin)

  return {
    success: true,
    discoveredPages: trimmedPages,
    recommendedPages,
    discoveredCount: trimmedPages.length,
    source,
    url: rootUrl,
    origin,
  }
}
