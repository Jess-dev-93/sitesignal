import {
  classifyPageType,
  discoverSitePages,
} from './siteDiscovery'

import {
  runPageAudit,
} from './pageAuditEngine'

import {
  detectTechStack,
} from './techStack'

const PAGE_FETCH_TIMEOUT_MS =
  12_000

const MAX_HTML_BYTES =
  900_000

const PAGE_FETCH_CONCURRENCY =
  4

const DEEP_AUDIT_CONCURRENCY =
  2

function unique(
  values
) {
  return Array.from(
    new Set(
      values.filter(
        Boolean
      )
    )
  )
}

function decodeHtml(
  value
) {
  return String(
    value || ''
  )
    .replace(
      /&amp;/gi,
      '&'
    )
    .replace(
      /&quot;/gi,
      '"'
    )
    .replace(
      /&#39;|&apos;/gi,
      "'"
    )
    .replace(
      /&lt;/gi,
      '<'
    )
    .replace(
      /&gt;/gi,
      '>'
    )
    .replace(
      /&nbsp;/gi,
      ' '
    )
    .replace(
      /&#(\d+);/g,
      (
        _,
        code
      ) =>
        String.fromCharCode(
          Number(code)
        )
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function stripTags(
  value
) {
  return decodeHtml(
    String(
      value || ''
    ).replace(
      /<[^>]*>/g,
      ' '
    )
  )
}

function getAttribute(
  tag,
  name
) {
  const pattern =
    new RegExp(
      `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      'i'
    )

  const match =
    String(
      tag || ''
    ).match(
      pattern
    )

  return match
    ? decodeHtml(
        match[1] ??
          match[2] ??
          match[3] ??
          ''
      )
    : null
}

function findMetaContent(
  html,
  attributeName,
  attributeValue
) {
  const tags =
    html.match(
      /<meta\b[^>]*>/gi
    ) || []

  const expected =
    attributeValue.toLowerCase()

  for (
    const tag of
    tags
  ) {
    if (
      (
        getAttribute(
          tag,
          attributeName
        ) || ''
      ).toLowerCase() ===
      expected
    ) {
      return (
        getAttribute(
          tag,
          'content'
        ) || ''
      )
    }
  }

  return ''
}

function findCanonical(
  html,
  pageUrl
) {
  const tags =
    html.match(
      /<link\b[^>]*>/gi
    ) || []

  for (
    const tag of
    tags
  ) {
    const rel =
      (
        getAttribute(
          tag,
          'rel'
        ) || ''
      )
        .toLowerCase()
        .split(
          /\s+/
        )

    if (
      !rel.includes(
        'canonical'
      )
    ) {
      continue
    }

    const href =
      getAttribute(
        tag,
        'href'
      ) || ''

    try {
      return href
        ? new URL(
            href,
            pageUrl
          ).toString()
        : ''
    } catch {
      return href
    }
  }

  return ''
}

function findStructuredDataTypes(
  html
) {
  const types = []

  const scripts =
    html.match(
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi
    ) || []

  scripts.forEach(
    (script) => {
      const matches =
        script.matchAll(
          /["']@type["']\s*:\s*["']([^"']+)["']/gi
        )

      for (
        const match of
        matches
      ) {
        types.push(
          decodeHtml(
            match[1]
          )
        )
      }
    }
  )

  return unique(
    types
  ).slice(
    0,
    12
  )
}

function extractLinkSignals(
  html,
  pageUrl,
  origin
) {
  const tags =
    html.match(
      /<a\b[^>]*>[\s\S]*?<\/a>/gi
    ) || []

  const internal =
    new Set()

  const external =
    new Set()

  const phone =
    new Set()

  const email =
    new Set()

  const labels = []

  let accountEntryPoint =
    false

  tags.forEach(
    (tag) => {
      const href =
        (
          getAttribute(
            tag,
            'href'
          ) || ''
        ).trim()

      const label =
        stripTags(
          tag
        ).slice(
          0,
          100
        )

      if (!href) {
        return
      }

      if (
        /^tel:/i.test(
          href
        )
      ) {
        phone.add(
          href
            .replace(
              /^tel:/i,
              ''
            )
            .trim()
        )

        if (label) {
          labels.push(
            label
          )
        }

        return
      }

      if (
        /^mailto:/i.test(
          href
        )
      ) {
        email.add(
          href
            .replace(
              /^mailto:/i,
              ''
            )
            .split(
              '?'
            )[0]
            .trim()
        )

        if (label) {
          labels.push(
            label
          )
        }

        return
      }

      if (
        /(?:login|log-in|signin|sign-in|account|register|sign-up|signup)/i.test(
          href
        )
      ) {
        accountEntryPoint =
          true
      }

      try {
        const absolute =
          new URL(
            href,
            pageUrl
          )

        if (
          ![
            'http:',
            'https:',
          ].includes(
            absolute.protocol
          )
        ) {
          return
        }

        absolute.hash =
          ''

        if (
          absolute.origin ===
          origin
        ) {
          internal.add(
            absolute.toString()
          )
        } else {
          external.add(
            absolute.toString()
          )
        }
      } catch {
        // Ignore malformed links.
      }

      if (
        label &&
        /\b(?:contact|enquire|inquire|book|call|get started|learn more|view|find|subscribe|register|apply|request|download|speak|talk|start)\b/i.test(
          label
        )
      ) {
        labels.push(
          label
        )
      }
    }
  )

  const buttonTags =
    html.match(
      /<button\b[^>]*>[\s\S]*?<\/button>/gi
    ) || []

  buttonTags.forEach(
    (tag) => {
      const label =
        stripTags(
          tag
        ).slice(
          0,
          100
        )

      if (label) {
        labels.push(
          label
        )
      }
    }
  )

  return {
    internalLinks:
      internal.size,

    externalLinks:
      external.size,

    phoneLinks:
      Array.from(
        phone
      ),

    emailLinks:
      Array.from(
        email
      ),

    ctaLabels:
      unique(
        labels
      ).slice(
        0,
        12
      ),

    accountEntryPoint,
  }
}

function extractFormSignals(
  html,
  pageUrl
) {
  const forms =
    html.match(
      /<form\b[^>]*>/gi
    ) || []

  const actions =
    forms
      .map(
        (form) =>
          getAttribute(
            form,
            'action'
          )
      )
      .filter(
        Boolean
      )
      .map(
        (action) => {
          try {
            return new URL(
              action,
              pageUrl
            ).toString()
          } catch {
            return action
          }
        }
      )

  return {
    formCount:
      forms.length,

    formActions:
      unique(
        actions
      ).slice(
        0,
        8
      ),

    newsletterPresent:
      /newsletter|subscribe|mailing[\s-]?list|email updates/i.test(
        html
      ) ||
      /list-manage\.com|mc-embedded-subscribe/i.test(
        html
      ),
  }
}

async function readLimitedHtml(
  response
) {
  if (
    !response.body
  ) {
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

    if (done) {
      break
    }

    if (!value) {
      continue
    }

    const remaining =
      MAX_HTML_BYTES -
      received

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

    chunks.push(
      chunk
    )

    received +=
      chunk.byteLength

    if (
      received >=
      MAX_HTML_BYTES
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

  chunks.forEach(
    (chunk) => {
      combined.set(
        chunk,
        offset
      )

      offset +=
        chunk.byteLength
    }
  )

  return new TextDecoder(
    'utf-8',
    {
      fatal: false,
    }
  ).decode(
    combined
  )
}

async function fetchPageSnapshot(
  pageUrl,
  origin
) {
  const controller =
    new AbortController()

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      PAGE_FETCH_TIMEOUT_MS
    )

  const startedAt =
    Date.now()

  try {
    const response =
      await fetch(
        pageUrl,
        {
          signal:
            controller.signal,

          headers: {
            'User-Agent':
              'JM-Sites-Audit/1.0 (+https://jmsites.dev)',

            Accept:
              'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          },

          redirect:
            'follow',

          cache:
            'no-store',
        }
      )

    const contentType =
      response.headers.get(
        'content-type'
      ) || ''

    const headers = {}

    response.headers.forEach(
      (
        value,
        key
      ) => {
        headers[key] =
          value
      }
    )

    if (
      !response.ok ||
      (
        contentType &&
        !/text\/html|application\/xhtml\+xml/i.test(
          contentType
        )
      )
    ) {
      return {
        url:
          pageUrl,

        finalUrl:
          response.url ||
          pageUrl,

        pageType:
          classifyPageType(
            pageUrl,
            origin
          ),

        status:
          'failed',

        httpStatus:
          response.status,

        fetchTimeMs:
          Date.now() -
          startedAt,

        error:
          !response.ok
            ? `HTTP ${response.status}`
            : `Unsupported content type: ${contentType}`,

        html: '',

        headers,
      }
    }

    const html =
      await readLimitedHtml(
        response
      )

    const titleMatch =
      html.match(
        /<title\b[^>]*>([\s\S]*?)<\/title>/i
      )

    const h1Matches =
      html.match(
        /<h1\b[^>]*>[\s\S]*?<\/h1>/gi
      ) || []

    const imageTags =
      html.match(
        /<img\b[^>]*>/gi
      ) || []

    const imagesMissingAlt =
      imageTags.filter(
        (tag) =>
          getAttribute(
            tag,
            'alt'
          ) === null
      ).length

    const canonicalValue =
      findCanonical(
        html,
        pageUrl
      )

    const robotsValue =
      findMetaContent(
        html,
        'name',
        'robots'
      )

    const htmlTag =
      html.match(
        /<html\b[^>]*>/i
      )?.[0] || ''

    const linkSignals =
      extractLinkSignals(
        html,
        pageUrl,
        origin
      )

    const formSignals =
      extractFormSignals(
        html,
        pageUrl
      )

    const structuredDataTypes =
      findStructuredDataTypes(
        html
      )

    return {
      url:
        pageUrl,

      finalUrl:
        response.url ||
        pageUrl,

      pageType:
        classifyPageType(
          pageUrl,
          origin
        ),

      status:
        'ok',

      httpStatus:
        response.status,

      fetchTimeMs:
        Date.now() -
        startedAt,

      error:
        null,

      title:
        titleMatch
          ? stripTags(
              titleMatch[1]
            )
          : '',

      metaDescription:
        findMetaContent(
          html,
          'name',
          'description'
        ),

      h1Count:
        h1Matches.length,

      h1Texts:
        h1Matches
          .map(
            stripTags
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            5
          ),

      canonicalPresent:
        Boolean(
          canonicalValue
        ),

      canonicalValue,

      robotsNoindex:
        /(?:^|,)\s*noindex\b/i.test(
          robotsValue
        ),

      langPresent:
        Boolean(
          getAttribute(
            htmlTag,
            'lang'
          )
        ),

      viewportPresent:
        Boolean(
          findMetaContent(
            html,
            'name',
            'viewport'
          )
        ),

      imageCount:
        imageTags.length,

      imagesMissingAlt,

      structuredDataPresent:
        structuredDataTypes.length >
        0,

      structuredDataTypes,

      ogPresent:
        Boolean(
          findMetaContent(
            html,
            'property',
            'og:title'
          )
        ),

      ...linkSignals,

      ...formSignals,

      html,

      headers,
    }
  } catch (error) {
    return {
      url:
        pageUrl,

      finalUrl:
        pageUrl,

      pageType:
        classifyPageType(
          pageUrl,
          origin
        ),

      status:
        'failed',

      httpStatus:
        null,

      fetchTimeMs:
        Date.now() -
        startedAt,

      error:
        error?.name ===
        'AbortError'
          ? `Fetch timed out after ${
              PAGE_FETCH_TIMEOUT_MS /
              1000
            } seconds`
          : error?.message ||
              'Page fetch failed',

      html: '',

      headers: {},
    }
  } finally {
    clearTimeout(
      timeout
    )
  }
}

function normalisePageMetrics(
  page
) {
  const successful =
    page.status ===
    'ok'

  const title =
    successful
      ? page.title || ''
      : ''

  const metaDescription =
    successful
      ? page.metaDescription ||
        ''
      : ''

  return {
    ...page,

    titleLength:
      title.trim().length,

    metaDescriptionLength:
      metaDescription
        .trim()
        .length,

    hasMissingTitle:
      successful &&
      title.trim().length ===
        0,

    hasMissingMetaDescription:
      successful &&
      metaDescription
        .trim()
        .length === 0,

    hasMissingH1:
      successful &&
      (
        !page.h1Count ||
        page.h1Count === 0
      ),

    hasMultipleH1:
      successful &&
      (
        page.h1Count ||
        0
      ) > 1,

    hasNoindex:
      successful &&
      page.robotsNoindex ===
        true,
  }
}

function percentage(
  count,
  total
) {
  return total > 0
    ? Math.round(
        (
          count /
          total
        ) * 100
      )
    : 0
}

function findDuplicatePageCount(
  pages,
  field
) {
  const groups =
    new Map()

  pages.forEach(
    (page) => {
      const value =
        String(
          page[field] ||
            ''
        )
          .trim()
          .toLowerCase()

      if (!value) {
        return
      }

      groups.set(
        value,
        (
          groups.get(
            value
          ) || 0
        ) + 1
      )
    }
  )

  return Array.from(
    groups.values()
  )
    .filter(
      (count) =>
        count > 1
    )
    .reduce(
      (
        sum,
        count
      ) =>
        sum + count,
      0
    )
}

function createIssue(
  key,
  label,
  count,
  total,
  severity,
  interpretation
) {
  return {
    key,

    label,

    count,

    percentage:
      percentage(
        count,
        total
      ),

    severity,

    interpretation,
  }
}

function buildIssueSummary(
  allPages
) {
  /*
   * Only successfully fetched pages
   * are included in technical and
   * SEO issue calculations.
   */

  const successfulPages =
    allPages.filter(
      (page) =>
        page.status ===
        'ok'
    )

  const total =
    successfulPages.length

  const issues = []

  const definitions = [
    [
      'missing-title',
      'Pages missing document titles',

      successfulPages.filter(
        (page) =>
          page.hasMissingTitle
      ).length,

      'high',

      'Document titles help users and search engines distinguish each page.',
    ],
    [
      'missing-meta-description',
      'Pages missing meta descriptions',

      successfulPages.filter(
        (page) =>
          page
            .hasMissingMetaDescription
      ).length,

      'medium',

      'Missing descriptions reduce control over the summary search engines may display.',
    ],
    [
      'missing-h1',
      'Pages missing an H1 heading',

      successfulPages.filter(
        (page) =>
          page.hasMissingH1
      ).length,

      'high',

      'A clear primary heading helps communicate the purpose of a page.',
    ],
    [
      'multiple-h1',
      'Pages with multiple H1 headings',

      successfulPages.filter(
        (page) =>
          page.hasMultipleH1
      ).length,

      'low',

      'Multiple H1s are not automatically an error, but the heading hierarchy is worth reviewing.',
    ],
    [
      'missing-canonical',
      'Pages without a detectable canonical tag',

      successfulPages.filter(
        (page) =>
          !page
            .canonicalPresent
      ).length,

      'medium',

      'Canonical declarations can help clarify preferred URLs where duplicate paths are possible.',
    ],
    [
      'missing-image-alt',
      'Pages containing images without alt attributes',

      successfulPages.filter(
        (page) =>
          page
            .imagesMissingAlt >
          0
      ).length,

      'high',

      'Images without alt attributes require review so informative images are described and decorative images are marked appropriately.',
    ],
    [
      'missing-language',
      'Pages without a detectable HTML language attribute',

      successfulPages.filter(
        (page) =>
          !page.langPresent
      ).length,

      'medium',

      'A document language helps assistive technology interpret and pronounce content.',
    ],
    [
      'missing-viewport',
      'Pages without a detectable viewport declaration',

      successfulPages.filter(
        (page) =>
          !page
            .viewportPresent
      ).length,

      'high',

      'A viewport declaration is an important baseline for responsive mobile rendering.',
    ],
  ]

  definitions.forEach(
    ([
      key,
      label,
      count,
      severity,
      interpretation,
    ]) => {
      if (count > 0) {
        issues.push(
          createIssue(
            key,
            label,
            count,
            total,
            severity,
            interpretation
          )
        )
      }
    }
  )

  const duplicateTitles =
    findDuplicatePageCount(
      successfulPages,
      'title'
    )

  if (
    duplicateTitles > 0
  ) {
    issues.push(
      createIssue(
        'duplicate-title',

        'Pages sharing duplicate document titles',

        duplicateTitles,

        total,

        'medium',

        'Repeated titles can make distinct pages harder to differentiate in search results and browser history.'
      )
    )
  }

  const duplicateDescriptions =
    findDuplicatePageCount(
      successfulPages,
      'metaDescription'
    )

  if (
    duplicateDescriptions >
    0
  ) {
    issues.push(
      createIssue(
        'duplicate-meta-description',

        'Pages sharing duplicate meta descriptions',

        duplicateDescriptions,

        total,

        'low',

        'Repeated descriptions reduce the opportunity to present each page distinctly in search results.'
      )
    )
  }

  const failedPages =
    allPages.filter(
      (page) =>
        page.status !==
        'ok'
    ).length

  if (
    failedPages > 0
  ) {
    issues.push(
      createIssue(
        'unavailable-page',

        'Discovered pages not available to the scanner',

        failedPages,

        allPages.length,

        'review',

        'Unavailable pages are reported as a scope limitation and are not counted as SEO failures.'
      )
    )
  }

  const weight = {
    high: 4,
    medium: 3,
    low: 2,
    review: 1,
  }

  return issues.sort(
    (
      a,
      b
    ) =>
      (
        weight[
          b.severity
        ] || 0
      ) -
        (
          weight[
            a.severity
          ] || 0
        ) ||
      b.count -
        a.count
  )
}

function average(
  values
) {
  const valid =
    values.filter(
      (value) =>
        typeof value ===
          'number' &&
        Number.isFinite(
          value
        )
    )

  return valid.length
    ? Math.round(
        valid.reduce(
          (
            sum,
            value
          ) =>
            sum + value,
          0
        ) /
          valid.length
      )
    : null
}

function summariseDeepAuditResults(
  deepResults
) {
  const successful =
    deepResults.filter(
      (result) =>
        result?.scores
          ?.mobile
    )

  const ranked = [
    ...successful,
  ].sort(
    (
      a,
      b
    ) =>
      a.scores.mobile
        .performance -
      b.scores.mobile
        .performance
  )

  const homepageWithDesktop =
    successful.find(
      (result) =>
        result.pageType ===
          'Homepage' &&
        result.scores
          .desktop
    )

  return {
    attemptedCount:
      deepResults.length,

    count:
      successful.length,

    failedCount:
      deepResults.length -
      successful.length,

    averageMobilePerformance:
      average(
        successful.map(
          (result) =>
            result.scores
              .mobile
              .performance
        )
      ),

    homepageDesktopPerformance:
      homepageWithDesktop
        ?.scores?.desktop
        ?.performance ??
      null,

    averageAccessibility:
      average(
        successful.map(
          (result) =>
            result.scores
              .mobile
              .accessibility
        )
      ),

    averageBestPractices:
      average(
        successful.map(
          (result) =>
            result.scores
              .mobile
              .bestPractices
        )
      ),

    averageSeo:
      average(
        successful.map(
          (result) =>
            result.scores
              .mobile
              .seo
        )
      ),

    highestPerformingPage:
      ranked[
        ranked.length -
          1
      ] || null,

    lowestPerformingPage:
      ranked[0] ||
      null,
  }
}

async function runWithLimit(
  items,
  limit,
  worker
) {
  const results =
    new Array(
      items.length
    )

  let index = 0

  async function runNext() {
    while (
      index <
      items.length
    ) {
      const currentIndex =
        index

      index += 1

      results[
        currentIndex
      ] =
        await worker(
          items[
            currentIndex
          ],

          currentIndex
        )
    }
  }

  const workers =
    Array.from(
      {
        length:
          Math.min(
            Math.max(
              1,
              limit
            ),

            items.length
          ),
      },

      () =>
        runNext()
    )

  await Promise.all(
    workers
  )

  return results
}

function buildStrengths(
  pages,
  techStack,
  deepSummary
) {
  const successful =
    pages.filter(
      (page) =>
        page.status ===
        'ok'
    )

  const total =
    successful.length

  const strengths = []

  if (
    total > 0 &&
    successful.every(
      (page) =>
        page.title
    )
  ) {
    strengths.push(
      `Document titles were detected on all ${total} successfully reviewed pages.`
    )
  }

  if (
    total > 0 &&
    successful.every(
      (page) =>
        page
          .viewportPresent
    )
  ) {
    strengths.push(
      `A mobile viewport declaration was detected on all ${total} successfully reviewed pages.`
    )
  }

  if (
    successful.some(
      (page) =>
        page
          .structuredDataPresent
    )
  ) {
    strengths.push(
      'Structured data was detected on at least one reviewed page.'
    )
  }

 if (techStack.signals.length > 0) {
  strengths.push(
    'Multiple public technology and integration signals were detected for further validation.'
  )
}

  if (
    deepSummary
      .averageBestPractices !==
      null &&
    deepSummary
      .averageBestPractices >=
      90
  ) {
    strengths.push(
      `Representative mobile Lighthouse Best Practices averaged ${deepSummary.averageBestPractices}/100.`
    )
  }

  return strengths.length
    ? strengths
    : [
        'The reviewed pages were reachable and provided enough public evidence for preliminary analysis.',
      ]
}

function buildJourneySummary(
  pages,
  techStack
) {
  const successful =
    pages.filter(
      (page) =>
        page.status ===
        'ok'
    )

  const pageTypes =
    unique(
      successful.map(
        (page) =>
          page.pageType
      )
    )

  const pagesWithForms =
    successful.filter(
      (page) =>
        page.formCount >
        0
    )

  const pagesWithPhoneLinks =
    successful.filter(
      (page) =>
        page.phoneLinks
          .length > 0
    )

  const pagesWithEmailLinks =
    successful.filter(
      (page) =>
        page.emailLinks
          .length > 0
    )

  const ctaLabels =
    unique(
      successful.flatMap(
        (page) =>
          page.ctaLabels
      )
    ).slice(
      0,
      16
    )

  const newsletterPresent =
    successful.some(
      (page) =>
        page
          .newsletterPresent
    )

  const accountEntryPoint =
    successful.some(
      (page) =>
        page
          .accountEntryPoint
    )

  const observations = []

  if (
    pageTypes.includes(
      'Services'
    )
  ) {
    observations.push(
      'A services pathway was found for visitors evaluating the organisation’s offering.'
    )
  }

  if (
    pageTypes.includes(
      'Property listing'
    ) ||
    pageTypes.includes(
      'Property detail'
    )
  ) {
    observations.push(
      'Property discovery pages were found as part of the public customer journey.'
    )
  }

  if (
    pageTypes.includes(
      'Contact'
    ) ||
    pagesWithForms.length >
      0
  ) {
    observations.push(
      'A direct enquiry pathway was found through a contact page or public form.'
    )
  }

  if (
    newsletterPresent
  ) {
    observations.push(
      'A newsletter pathway was detected for longer-term audience nurturing.'
    )
  }

  if (
    accountEntryPoint
  ) {
    observations.push(
      'A public account or sign-in entry point was detected and should be treated as a separate user journey.'
    )
  }

  const opportunities = [
    'Confirm that each priority audience can move from its likely landing page to a relevant next step without unnecessary detours.',

    'Use distinct calls to action for service enquiries, property enquiries and ongoing content engagement where those journeys serve different intentions.',

    'Validate form completion, confirmation and follow-up behaviour manually; public HTML cannot confirm CRM routing or response handling.',
  ]

  if (
    ctaLabels.length === 0
  ) {
    opportunities.unshift(
      'Review whether priority pages provide a clear, descriptive next action for visitors.'
    )
  }

  const recommendedEvents = [
    {
      event:
        'generate_lead',

      trigger:
        'Successful primary enquiry submission',

      purpose:
        'Measure completed lead-generation actions rather than form views alone.',
    },
    {
      event:
        'click_to_call',

      trigger:
        'Visitor selects a telephone link',

      purpose:
        'Measure phone intent from mobile and desktop journeys.',
    },
    {
      event:
        'email_click',

      trigger:
        'Visitor selects a public email link',

      purpose:
        'Measure email enquiry intent that occurs outside website forms.',
    },
  ]

  if (
    pageTypes.includes(
      'Property listing'
    ) ||
    pageTypes.includes(
      'Property detail'
    )
  ) {
    recommendedEvents.push(
      {
        event:
          'view_property',

        trigger:
          'Visitor opens an individual property or project page',

        purpose:
          'Identify the listings and locations attracting meaningful attention.',
      },

      {
        event:
          'property_enquiry',

        trigger:
          'Visitor submits or begins a property-specific enquiry',

        purpose:
          'Connect individual listings with enquiry outcomes.',
      }
    )
  }

  if (
    newsletterPresent
  ) {
    recommendedEvents.push({
      event:
        'sign_up',

      trigger:
        'Confirmed newsletter subscription',

      purpose:
        'Measure successful audience-nurture sign-ups.',
    })
  }

  return {
    pageTypes,

    formCount:
      pagesWithForms.reduce(
        (
          sum,
          page
        ) =>
          sum +
          page.formCount,

        0
      ),

    pagesWithForms:
      pagesWithForms.length,

    pagesWithPhoneLinks:
      pagesWithPhoneLinks.length,

    pagesWithEmailLinks:
      pagesWithEmailLinks.length,

    newsletterPresent,

    accountEntryPoint,

    ctaLabels,

    observations,

    opportunities,

    analyticsDetected:
      unique([
        ...techStack
          .analytics,

        ...techStack
          .tagManagers,

        ...techStack
          .marketing,
      ]),

    recommendedEvents,
  }
}

function buildSiteReport({
  discovery,
  pages,
  issueSummary,
  deepSummary,
  techStack,
  journeySummary,
}) {
  const successfulCount =
    pages.filter(
      (page) =>
        page.status ===
        'ok'
    ).length
    const selectedCount = pages.length

  const noindexCount =
    pages.filter(
      (page) =>
        page.status ===
          'ok' &&
        page.hasNoindex
    ).length

  const keyIssues =
    issueSummary
      .filter(
        (issue) =>
          issue.severity !==
          'review'
      )
      .slice(
        0,
        5
      )
      .map(
        (issue) =>
          `${issue.label}: ${issue.count} of ${successfulCount} successfully reviewed page${
            successfulCount ===
            1
              ? ''
              : 's'
          }.`
      )

  if (
    deepSummary
      .averageMobilePerformance !==
      null &&
    deepSummary
      .averageMobilePerformance <
      70
  ) {
    keyIssues.unshift(
      `Representative mobile Lighthouse performance averaged ${deepSummary.averageMobilePerformance}/100 across ${deepSummary.count} completed deep test${
        deepSummary.count ===
        1
          ? ''
          : 's'
      }.`
    )
  }

  if (
    keyIssues.length ===
    0
  ) {
    keyIssues.push(
      'No high-priority recurring issue was confirmed by the automated checks included in this run.'
    )
  }

  const businessImpact = []

  if (
    deepSummary
      .averageMobilePerformance !==
      null &&
    deepSummary
      .averageMobilePerformance <
      70
  ) {
    businessImpact.push(
      'Measured mobile performance constraints may delay access to content and interaction on the tested pages, particularly on slower devices or networks.'
    )
  }

  if (
    issueSummary.some(
      (issue) =>
        [
          'missing-title',
          'missing-meta-description',
          'duplicate-title',
        ].includes(
          issue.key
        )
    )
  ) {
    businessImpact.push(
      'Recurring metadata observations may reduce control over how distinct pages are understood and presented in search results.'
    )
  }

  if (
    issueSummary.some(
      (issue) =>
        [
          'missing-image-alt',
          'missing-language',
          'missing-viewport',
        ].includes(
          issue.key
        )
    )
  ) {
    businessImpact.push(
      'Accessibility observations may create barriers for some visitors and should be manually validated against the affected templates.'
    )
  }

  if (
    journeySummary.formCount >
    0
  ) {
    businessImpact.push(
      'Public enquiry paths are present; validating submission tracking and CRM follow-up would show which pages and campaigns contribute to completed enquiries.'
    )
  }

  const analyticsSignals =
    journeySummary
      .analyticsDetected

  const analyticsStatement =
    analyticsSignals.length
      ? `Public signals for ${analyticsSignals.join(
          ', '
        )} were detected. Their configuration, consent behaviour and conversion coverage require account-level validation.`
      : 'No directly identifiable analytics or tag-management signal was found in the reviewed public HTML. This does not prove that analytics is absent because tags may load through containers, consent states or server-side systems.'

  const recommendations = [
    'Validate and remediate the highest-priority recurring template findings, beginning with pages that support enquiries and property or service discovery.',

    'Trace the measured mobile performance findings to specific scripts, assets and third-party integrations before removing or deferring functionality.',

    'Define and test a measurement plan for completed enquiries, telephone clicks, email clicks and relevant content or property interactions.',

    'Review the principal visitor journeys manually on mobile, including landing, evaluation, enquiry, confirmation and follow-up states.',

    'Use post-change Lighthouse, analytics and conversion data to verify improvement rather than relying on implementation completion alone.',
  ]

  return {
    executiveSummary:
  `This preliminary external review found ${discovery.discoveredCount} public URL candidate${
    discovery.discoveredCount === 1 ? '' : 's'
  }, selected ${selectedCount} representative page${
    selectedCount === 1 ? '' : 's'
  } for review, successfully inspected ${successfulCount} and completed ${
    deepSummary.count
  } representative mobile Lighthouse test${
    deepSummary.count === 1 ? '' : 's'
  }. It combines sampled page-level technical and SEO observations with public technology, enquiry-path and measurement signals. Findings apply to the reviewed sample and should be validated with internal platform and analytics access before final scope is set.`,
  
    strengths:
      buildStrengths(
        pages,
        techStack,
        deepSummary
      ),

    keyIssues:
      keyIssues.slice(
        0,
        6
      ),

    businessImpact:
      businessImpact.length >
      0
        ? businessImpact.slice(
            0,
            5
          )
        : [
            'No material business impact can be concluded from the available automated evidence alone.',
          ],

    analyticsStatement,

    journeyObservations:
      journeySummary
        .observations,

    journeyOpportunities:
      journeySummary
        .opportunities,

    recommendations,

    roadmap: {
      immediate: [
        'Validate priority performance and accessibility findings on the affected templates.',

        'Confirm analytics ownership, consent behaviour and existing conversion events.',

        'Verify enquiry forms, confirmation states and CRM routing end to end.',
      ],

      nearTerm: [
        'Resolve confirmed recurring metadata, heading, canonical and image-alt patterns.',

        'Optimise high-impact scripts, assets and third-party integrations on priority pages.',

        'Clarify calls to action for the main service, property and content journeys.',
      ],

      ongoing: [
        'Monitor search visibility, landing-page engagement and completed conversion events.',

        'Compare performance and conversion behaviour before and after each material release.',

        'Use observed user behaviour to prioritise future pages, content and digital improvements.',
      ],
    },

    scopeNotes: [
      noindexCount > 0
        ? `${noindexCount} successfully reviewed page${
            noindexCount ===
            1
              ? ' was'
              : 's were'
          } marked noindex; intent should be confirmed before treating this as an issue.`
        : null,

      deepSummary
        .failedCount > 0
        ? `${deepSummary.failedCount} of ${deepSummary.attemptedCount} representative Lighthouse test${
            deepSummary
              .attemptedCount ===
            1
              ? ''
              : 's'
          } did not complete and were excluded from calculated averages.`
        : null,

      'Public technology detection confirms visible implementation signals only; it cannot verify configuration quality, data accuracy, consent compliance or CRM processing.',
    ].filter(
      Boolean
    ),
  }
}

export async function runFullSiteAudit(
  inputUrl,
  {
    maxPages = 20,
    maxDeepPages = 5,
  } = {}
) {
  const discovery =
    await discoverSitePages(
      inputUrl,
      {
        maxPages,
      }
    )

  if (
    !discovery.success
  ) {
    return {
      success:
        false,

      error:
        discovery.error ||
        'Website discovery failed.',
    }
  }

  const discoveredPages =
    discovery
      .discoveredPages ||
    []

  const snapshots =
    await runWithLimit(
      discoveredPages,

      PAGE_FETCH_CONCURRENCY,

      (pageUrl) =>
        fetchPageSnapshot(
          pageUrl,
          discovery.origin
        )
    )

  const normalisedSnapshots =
    snapshots.map(
      normalisePageMetrics
    )

  const successfulSnapshots =
    normalisedSnapshots.filter(
      (page) =>
        page.status ===
        'ok'
    )

  const homepageSnapshot =
    successfulSnapshots.find(
      (page) =>
        page.pageType ===
        'Homepage'
    ) ||
    successfulSnapshots[0]

  const combinedHtml =
    successfulSnapshots
      .map(
        (page) =>
          page.html
      )
      .join(
        '\n'
      )

  const techStack =
    detectTechStack(
      combinedHtml,

      homepageSnapshot
        ?.headers ||
        {}
    )

  const lightweightResults =
    normalisedSnapshots.map(
      (snapshot) => {
        const page = {
          ...snapshot,
        }

        delete page.html
        delete page.headers

        return page
      }
    )

  const issueSummary =
    buildIssueSummary(
      lightweightResults
    )

  const journeySummary =
    buildJourneySummary(
      lightweightResults,
      techStack
    )

  const deepTargets =
    (
      discovery
        .recommendedPages ||
      discoveredPages
    ).slice(
      0,
      maxDeepPages
    )

  const deepResults =
    await runWithLimit(
      deepTargets,

      DEEP_AUDIT_CONCURRENCY,

      async (
        targetUrl
      ) => {
        const pageType =
          classifyPageType(
            targetUrl,
            discovery.origin
          )

        try {
          const result =
            await runPageAudit(
              targetUrl,
              {
                /*
                 * Homepage receives real
                 * mobile and desktop tests.
                 * Other representative pages
                 * receive real mobile tests.
                 */
                quick:
                  pageType !==
                  'Homepage',

                generateAi:
                  false,
              }
            )

          return {
            url:
              targetUrl,

            pageType,

            pageTitle:
              result.pageTitle,

            scores:
              result.scores,

            error:
              null,
          }
        } catch (error) {
          return {
            url:
              targetUrl,

            pageType,

            pageTitle:
              '',

            scores:
              null,

            error:
              error?.message ||
              'Lighthouse test failed',
          }
        }
      }
    )

  const deepSummary =
    summariseDeepAuditResults(
      deepResults
    )

  const siteReport =
    buildSiteReport({
      discovery,

      pages:
        lightweightResults,

      issueSummary,

      deepSummary,

      techStack,

      journeySummary,
    })

  return {
    success:
      true,

    generatedAt:
      new Date()
        .toISOString(),

    discovery,

    lightweightResults,

    issueSummary,

    selectedDeepAuditPages:
      deepTargets,

    deepResults,

    deepSummary,

    techStack,

    journeySummary,

    siteReport,
  }
}