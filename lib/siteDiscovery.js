const FETCH_TIMEOUT_MS = 10_000
const MAX_DOCUMENT_BYTES = 1_000_000
const MAX_SITEMAPS = 50
const MAX_SITEMAP_CANDIDATES = 500

const EXCLUDED_PATH_PATTERNS = [
  /\/wp-admin(?:\/|$)/i,
  /\/wp-login(?:\.php)?(?:\/|$)/i,
  /\/admin(?:\/|$)/i,
  /\/checkout(?:\/|$)/i,
  /\/cart(?:\/|$)/i,
  /\/api(?:\/|$)/i,
  /\/wp-json(?:\/|$)/i,
  /\/graphql(?:\/|$)/i,
  /\/xmlrpc\.php$/i,
  /\/oauth(?:\/|$)/i,
  /\/feed(?:\/|$)/i,
  /\/attachment(?:\/|$)/i,
  /\/(?:author|tag)\/[^/]+(?:\/|$)/i,
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

const REVIEW_TYPE_QUOTAS = [
  ['Homepage', 1],
  ['Services', 2],
  ['Property listing', 2],
  ['Property detail', 3],
  ['Contact', 1],
  ['About', 1],
  ['News or resources', 1],
  ['Article', 4],
  ['Careers', 1],
  ['Account', 1],
  ['Other', 3],
]

const DEEP_AUDIT_TYPE_PRIORITY = [
  'Homepage',
  'Services',
  'Property listing',
  'Contact',
  'About',
  'Property detail',
  'News or resources',
  'Article',
  'Careers',
  'Account',
  'Other',
]

function decodeXmlText(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

export function isPublicAuditUrl(
  inputUrl
) {
  try {
    const parsed =
      new URL(inputUrl)

    const hostname =
      parsed.hostname
        .toLowerCase()
        .replace(
          /^\[|\]$/g,
          ''
        )

    if (
      ![
        'http:',
        'https:',
      ].includes(
        parsed.protocol
      )
    ) {
      return false
    }

    if (
      !hostname ||
      parsed.username ||
      parsed.password
    ) {
      return false
    }

    if (
      hostname ===
        'localhost' ||
      hostname.endsWith(
        '.localhost'
      ) ||
      hostname.endsWith(
        '.local'
      ) ||
      hostname.endsWith(
        '.internal'
      )
    ) {
      return false
    }

    if (
      hostname === '::1' ||
      hostname ===
        '0:0:0:0:0:0:0:1' ||
      /^(?:fc|fd)[0-9a-f]{2}:/i.test(
        hostname
      ) ||
      /^fe[89ab][0-9a-f]:/i.test(
        hostname
      )
    ) {
      return false
    }

    const ipv4 =
      hostname.match(
        /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
      )

    if (ipv4) {
      const parts =
        ipv4
          .slice(1)
          .map(Number)

      if (
        parts.some(
          (part) =>
            part < 0 ||
            part > 255
        )
      ) {
        return false
      }

      const [a, b] =
        parts

      if (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (
          a === 169 &&
          b === 254
        ) ||
        (
          a === 172 &&
          b >= 16 &&
          b <= 31
        ) ||
        (
          a === 192 &&
          b === 168
        )
      ) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

export function normaliseDiscoveredUrl(
  inputUrl
) {
  if (
    !inputUrl ||
    typeof inputUrl !==
      'string'
  ) {
    return null
  }

  const trimmed =
    inputUrl.trim()

  if (!trimmed) {
    return null
  }

  const rawUrl =
    /^https?:\/\//i.test(
      trimmed
    )
      ? trimmed
      : `https://${trimmed}`

  try {
    const parsed =
      new URL(rawUrl)

    if (
      !isPublicAuditUrl(
        parsed.toString()
      )
    ) {
      return null
    }

    parsed.hash = ''
    parsed.search = ''

    parsed.hostname =
      parsed.hostname
        .toLowerCase()

    parsed.pathname =
      parsed.pathname
        .replace(
          /\/{2,}/g,
          '/'
        ) || '/'

    if (
      parsed.pathname !== '/'
    ) {
      parsed.pathname =
        parsed.pathname.replace(
          /\/+$/,
          ''
        )
    }

    return parsed.toString()
  } catch {
    return null
  }
}

function isSameOrigin(
  url,
  origin
) {
  try {
    return (
      new URL(url).origin ===
      origin
    )
  } catch {
    return false
  }
}

function hasExcludedExtension(
  pathname
) {
  const lower =
    pathname.toLowerCase()

  return EXCLUDED_EXTENSIONS.some(
    (extension) =>
      lower.endsWith(
        extension
      )
  )
}

function isExcludedPath(
  pathname
) {
  return EXCLUDED_PATH_PATTERNS.some(
    (pattern) =>
      pattern.test(
        pathname
      )
  )
}

function isLikelyPageUrl(
  url,
  origin
) {
  if (
    !url ||
    !origin ||
    !isSameOrigin(
      url,
      origin
    )
  ) {
    return false
  }

  try {
    const parsed =
      new URL(url)

    if (
      ![
        'http:',
        'https:',
      ].includes(
        parsed.protocol
      )
    ) {
      return false
    }

    if (
      parsed.pathname ===
      '/favicon.ico'
    ) {
      return false
    }

    if (
      hasExcludedExtension(
        parsed.pathname
      )
    ) {
      return false
    }

    if (
      isExcludedPath(
        parsed.pathname
      )
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function extractLinksFromHtml(
  html,
  pageUrl
) {
  const links = []

  const pattern =
    /<a\s+[^>]*href\s*=\s*["']([^"']+)["']/gi

  for (
    const match of
    html.matchAll(pattern)
  ) {
    const href =
      match[1]?.trim()

    if (
      !href ||
      href.startsWith('#') ||
      /^(?:mailto|tel|sms|javascript|data):/i.test(
        href
      )
    ) {
      continue
    }

    try {
      links.push(
        new URL(
          href,
          pageUrl
        ).toString()
      )
    } catch {
      // Ignore malformed links.
    }
  }

  return links
}

async function readResponseText(
  response,
  maxBytes =
    MAX_DOCUMENT_BYTES
) {
  if (!response.body) {
    return ''
  }

  const reader =
    response.body.getReader()

  const chunks = []
  let received = 0

  while (true) {
    const {
      done,
      value,
    } = await reader.read()

    if (done) break
    if (!value) continue

    const remaining =
      maxBytes - received

    if (
      remaining <= 0
    ) {
      await reader.cancel()
      break
    }

    const chunk =
      value.byteLength >
      remaining
        ? value.slice(
            0,
            remaining
          )
        : value

    chunks.push(chunk)

    received +=
      chunk.byteLength

    if (
      received >= maxBytes
    ) {
      await reader.cancel()
      break
    }
  }

  const combined =
    new Uint8Array(
      received
    )

  let offset = 0

  for (
    const chunk of chunks
  ) {
    combined.set(
      chunk,
      offset
    )

    offset +=
      chunk.byteLength
  }

  return new TextDecoder(
    'utf-8',
    {
      fatal: false,
    }
  ).decode(combined)
}

async function fetchText(
  url,
  accept
) {
  const controller =
    new AbortController()

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      FETCH_TIMEOUT_MS
    )

  try {
    const response =
      await fetch(url, {
        signal:
          controller.signal,

        headers: {
          'User-Agent':
            'JM-Sites-Audit/1.0 (+https://jmsites.dev)',

          Accept:
            accept,
        },

        redirect:
          'follow',

        cache:
          'no-store',
      })

    if (
      !response.ok ||
      !isPublicAuditUrl(
        response.url ||
          url
      )
    ) {
      return null
    }

    return await readResponseText(
      response
    )
  } catch {
    return null
  } finally {
    clearTimeout(
      timeout
    )
  }
}

function addCandidate(
  url,
  origin,
  candidates,
  seenPages
) {
  const normalised =
    normaliseDiscoveredUrl(
      url
    )

  if (
    !normalised ||
    !isLikelyPageUrl(
      normalised,
      origin
    ) ||
    seenPages.has(
      normalised
    )
  ) {
    return false
  }

  seenPages.add(
    normalised
  )

  candidates.push(
    normalised
  )

  return true
}

function sitemapPriority(
  url
) {
  const lower =
    url.toLowerCase()

  if (
    /(?:page|service|solution|property|project|development)-sitemap/.test(
      lower
    )
  ) {
    return 100
  }

  if (
    /(?:product|listing)-sitemap/.test(
      lower
    )
  ) {
    return 90
  }

  if (
    /(?:post|news|article|blog)-sitemap/.test(
      lower
    )
  ) {
    return 40
  }

  if (
    /(?:category|tag|author)-sitemap/.test(
      lower
    )
  ) {
    return 10
  }

  return 60
}

async function collectPagesFromSitemap(
  sitemapUrl,
  origin,
  candidates,
  seenPages,
  seenSitemaps,
  candidateLimit
) {
  if (
    seenSitemaps.has(
      sitemapUrl
    ) ||
    seenSitemaps.size >=
      MAX_SITEMAPS ||
    candidates.length >=
      candidateLimit
  ) {
    return
  }

  seenSitemaps.add(
    sitemapUrl
  )

  const xml =
    await fetchText(
      sitemapUrl,
      'application/xml,text/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5'
    )

  if (!xml) return

  const locs = [
    ...xml.matchAll(
      /<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi
    ),
  ]
    .map(
      (match) =>
        decodeXmlText(
          match[1]
        ).trim()
    )
    .filter(Boolean)

  const childSitemaps = []
  const pageUrls = []

  for (
    const loc of locs
  ) {
    try {
      const parsed =
        new URL(
          loc,
          origin
        )

      const path =
        parsed.pathname
          .toLowerCase()

      if (
        path.endsWith(
          '.xml'
        ) ||
        path.includes(
          'sitemap'
        )
      ) {
        const child =
          normaliseDiscoveredUrl(
            parsed.toString()
          )

        if (
          child &&
          isSameOrigin(
            child,
            origin
          )
        ) {
          childSitemaps.push(
            child
          )
        }
      } else {
        pageUrls.push(
          parsed.toString()
        )
      }
    } catch {
      // Ignore malformed sitemap entries.
    }
  }

  childSitemaps.sort(
    (a, b) =>
      sitemapPriority(b) -
      sitemapPriority(a)
  )

  for (
    const childSitemap of
    childSitemaps
  ) {
    if (
      candidates.length >=
      candidateLimit
    ) {
      break
    }

    await collectPagesFromSitemap(
      childSitemap,
      origin,
      candidates,
      seenPages,
      seenSitemaps,
      candidateLimit
    )
  }

  for (
    const pageUrl of
    pageUrls
  ) {
    if (
      candidates.length >=
      candidateLimit
    ) {
      break
    }

    addCandidate(
      pageUrl,
      origin,
      candidates,
      seenPages
    )
  }
}

async function collectHomepageLinks(
  homepage,
  origin,
  candidates,
  seenPages,
  candidateLimit
) {
  const html =
    await fetchText(
      homepage,
      'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'
    )

  if (!html) {
    return false
  }

  for (
    const link of
    extractLinksFromHtml(
      html,
      homepage
    )
  ) {
    if (
      candidates.length >=
      candidateLimit
    ) {
      break
    }

    addCandidate(
      link,
      origin,
      candidates,
      seenPages
    )
  }

  return true
}

async function fallbackCrawl(
  origin,
  candidates,
  seenPages,
  candidateLimit
) {
  const queue = [
    ...candidates,
  ]

  const queued =
    new Set(queue)

  const visited =
    new Set()

  while (
    queue.length > 0 &&
    candidates.length <
      candidateLimit
  ) {
    const currentUrl =
      queue.shift()

    if (
      !currentUrl ||
      visited.has(
        currentUrl
      )
    ) {
      continue
    }

    visited.add(
      currentUrl
    )

    const html =
      await fetchText(
        currentUrl,
        'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'
      )

    if (!html) {
      continue
    }

    for (
      const link of
      extractLinksFromHtml(
        html,
        currentUrl
      )
    ) {
      const normalised =
        normaliseDiscoveredUrl(
          link
        )

      if (
        !normalised ||
        !isLikelyPageUrl(
          normalised,
          origin
        )
      ) {
        continue
      }

      if (
        !seenPages.has(
          normalised
        )
      ) {
        addCandidate(
          normalised,
          origin,
          candidates,
          seenPages
        )
      }

      if (
        !visited.has(
          normalised
        ) &&
        !queued.has(
          normalised
        )
      ) {
        queued.add(
          normalised
        )

        queue.push(
          normalised
        )
      }

      if (
        candidates.length >=
        candidateLimit
      ) {
        break
      }
    }
  }
}

export function classifyPageType(
  pageUrl,
  origin
) {
  try {
    const parsed =
      new URL(pageUrl)

    const path =
      parsed.pathname
        .toLowerCase()
        .replace(
          /\/+$/,
          ''
        ) || '/'

    const depth =
      path
        .split('/')
        .filter(Boolean)
        .length

    if (
      parsed.origin ===
        origin &&
      path === '/'
    ) {
      return 'Homepage'
    }

    if (
      /\/(?:our-)?services?(?:\/|$)/.test(
        path
      ) ||
      /\/(?:solutions?|capabilities?)(?:\/|$)/.test(
        path
      )
    ) {
      return 'Services'
    }

    if (
      /\/(?:contact-us|contact|get-in-touch|enquire|quote|book)(?:\/|$)/.test(
        path
      )
    ) {
      return 'Contact'
    }

    if (
      /\/(?:about-us|about|company|who-we-are|our-story)(?:\/|$)/.test(
        path
      )
    ) {
      return 'About'
    }

    if (
      /\/(?:property-news|news|blog|articles?|insights?|resources?)(?:\/|$)/.test(
        path
      )
    ) {
      return depth > 1
        ? 'Article'
        : 'News or resources'
    }

    if (
      /\/(?:buy-properties|properties|property|projects?|developments?|listings?)(?:\/|$)/.test(
        path
      )
    ) {
      return depth > 1
        ? 'Property detail'
        : 'Property listing'
    }

    if (
      /\/(?:careers?|jobs?)(?:\/|$)/.test(
        path
      )
    ) {
      return 'Careers'
    }

    if (
      /\/(?:login|log-in|signin|sign-in|account|register)(?:\/|$)/.test(
        path
      )
    ) {
      return 'Account'
    }

    return 'Other'
  } catch {
    return 'Other'
  }
}

function pageImportanceScore(
  pageUrl,
  origin
) {
  const type =
    classifyPageType(
      pageUrl,
      origin
    )

  const typeScores = {
    Homepage: 1000,
    Services: 920,
    Contact: 900,
    About: 880,
    'Property listing': 860,
    'Property detail': 760,
    'News or resources': 650,
    Careers: 560,
    Account: 520,
    Article: 420,
    Other: 300,
  }

  try {
    const path =
      new URL(
        pageUrl
      ).pathname.toLowerCase()

    const depth =
      path
        .split('/')
        .filter(Boolean)
        .length

    let score =
      typeScores[type] || 0

    if (
      /(?:enquire|contact|book|request|quote)/.test(
        path
      )
    ) {
      score += 40
    }

    if (
      /(?:service|property|project|development)/.test(
        path
      )
    ) {
      score += 25
    }

    if (
      /(?:privacy|terms|cookie)/.test(
        path
      )
    ) {
      score -= 200
    }

    if (
      /\/page\/\d+/.test(
        path
      )
    ) {
      score -= 150
    }

    return (
      score -
      depth * 3
    )
  } catch {
    return 0
  }
}

function rankCandidates(
  candidates,
  origin
) {
  return candidates
    .map(
      (
        url,
        index
      ) => ({
        url,
        index,

        type:
          classifyPageType(
            url,
            origin
          ),

        score:
          pageImportanceScore(
            url,
            origin
          ),
      })
    )
    .sort(
      (a, b) =>
        b.score -
          a.score ||
        a.index -
          b.index
    )
}

function selectReviewPages(
  candidates,
  origin,
  maxPages
) {
  const ranked =
    rankCandidates(
      candidates,
      origin
    )

  const selected = []
  const seen = new Set()

  function add(entry) {
    if (
      !entry ||
      seen.has(
        entry.url
      ) ||
      selected.length >=
        maxPages
    ) {
      return
    }

    seen.add(
      entry.url
    )

    selected.push(
      entry.url
    )
  }

  for (
    const [
      type,
      quota,
    ] of
    REVIEW_TYPE_QUOTAS
  ) {
    let added = 0

    for (
      const entry of
      ranked
    ) {
      if (
        entry.type !==
          type ||
        seen.has(
          entry.url
        )
      ) {
        continue
      }

      add(entry)
      added += 1

      if (
        added >= quota ||
        selected.length >=
          maxPages
      ) {
        break
      }
    }

    if (
      selected.length >=
      maxPages
    ) {
      break
    }
  }

  for (
    const entry of ranked
  ) {
    if (
      selected.length >=
      maxPages
    ) {
      break
    }

    add(entry)
  }

  return selected
}

function recommendImportantPages(
  reviewPages,
  origin,
  limit = 5
) {
  const ranked =
    rankCandidates(
      reviewPages,
      origin
    )

  const selected = []
  const seen = new Set()

  for (
    const type of
    DEEP_AUDIT_TYPE_PRIORITY
  ) {
    const match =
      ranked.find(
        (entry) =>
          entry.type ===
            type &&
          !seen.has(
            entry.url
          )
      )

    if (!match) {
      continue
    }

    seen.add(
      match.url
    )

    selected.push(
      match.url
    )

    if (
      selected.length >=
      limit
    ) {
      return selected
    }
  }

  for (
    const entry of ranked
  ) {
    if (
      selected.length >=
      limit
    ) {
      break
    }

    if (
      seen.has(
        entry.url
      )
    ) {
      continue
    }

    seen.add(
      entry.url
    )

    selected.push(
      entry.url
    )
  }

  return selected
}

export async function discoverSitePages(
  inputUrl,
  {
    maxPages = 20,
  } = {}
) {
  const rootUrl =
    normaliseDiscoveredUrl(
      inputUrl
    )

  if (!rootUrl) {
    return {
      success: false,

      error:
        'Please provide a valid website URL.',

      discoveredPages: [],
      recommendedPages: [],
      discoveredCount: 0,
      reviewedPageCount: 0,
      source: 'none',
      url: '',
      origin: '',
    }
  }

  const safeMaxPages =
    Math.min(
      Math.max(
        Number(maxPages) ||
          20,
        1
      ),
      50
    )

  const candidateLimit =
    Math.max(
      safeMaxPages * 10,
      Math.min(
        MAX_SITEMAP_CANDIDATES,
        200
      )
    )

  const crawlLimit =
    Math.max(
      safeMaxPages * 3,
      40
    )

  const origin =
    new URL(
      rootUrl
    ).origin

  const homepage =
    `${origin}/`

  const candidates = [
    homepage,
  ]

  const seenPages =
    new Set(
      candidates
    )

  const seenSitemaps =
    new Set()

  const homepageFetched =
    await collectHomepageLinks(
      homepage,
      origin,
      candidates,
      seenPages,
      candidateLimit
    )

  const beforeSitemaps =
    candidates.length

  const sitemapCandidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap/sitemap.xml`,
    `${origin}/sitemap-index.xml`,
  ]

  for (
    const sitemapUrl of
    sitemapCandidates
  ) {
    if (
      candidates.length >=
      candidateLimit
    ) {
      break
    }

    await collectPagesFromSitemap(
      sitemapUrl,
      origin,
      candidates,
      seenPages,
      seenSitemaps,
      candidateLimit
    )
  }

  const sitemapAddedPages =
    candidates.length >
    beforeSitemaps

  let crawlUsed =
    homepageFetched

  if (
    !sitemapAddedPages &&
    candidates.length <
      crawlLimit
  ) {
    await fallbackCrawl(
      origin,
      candidates,
      seenPages,
      crawlLimit
    )

    crawlUsed = true
  }

  const reviewPages =
    selectReviewPages(
      candidates,
      origin,
      safeMaxPages
    )

  const source =
    sitemapAddedPages
      ? crawlUsed
        ? 'sitemap+homepage'
        : 'sitemap'
      : 'crawl'

  return {
    success: true,

    discoveredPages:
      reviewPages,

    recommendedPages:
      recommendImportantPages(
        reviewPages,
        origin,
        5
      ),

    discoveredCount:
      candidates.length,

    reviewedPageCount:
      reviewPages.length,

    discoveryLimited:
      candidates.length >=
      candidateLimit,

    source,

    url:
      rootUrl,

    origin,
  }
}