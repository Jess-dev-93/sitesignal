import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getUserIdFromRequest } from '../../../lib/getUserId'
import {
  getUserPlan,
  incrementUsage,
} from '../../../lib/getUserPlan'
import { detectTechStackFromUrl } from '../../../lib/detectTechStackServer'
import { normaliseAuditUrl } from '../../../lib/normaliseAuditUrl'
import { isPublicAuditUrl } from '../../../lib/siteDiscovery'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const LIGHTHOUSE_CATEGORIES =
  '&category=performance' +
  '&category=seo' +
  '&category=accessibility' +
  '&category=best-practices'

const CATEGORY_KEYS = [
  'performance',
  'seo',
  'accessibility',
  'best-practices',
]

const CATEGORY_LABELS = {
  performance: 'Performance',
  seo: 'SEO',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
}

/* =====================================================
   BASIC LIGHTHOUSE HELPERS
===================================================== */

function readCategoryScore(categories, key, fallback = 0) {
  const rawScore = categories?.[key]?.score

  if (rawScore === null || rawScore === undefined) {
    return fallback
  }

  return Math.round(rawScore * 100)
}

function readAuditPass(audits, key) {
  const audit = audits?.[key]

  if (
    !audit ||
    audit.score === null ||
    audit.score === undefined ||
    audit.scoreDisplayMode === 'notApplicable'
  ) {
    return null
  }

  return audit.score >= 0.9
}

function readCombinedAuditPass(audits, keys) {
  const availableAudits = keys
    .map((key) => audits?.[key])
    .filter(
      (audit) =>
        audit &&
        audit.score !== null &&
        audit.score !== undefined &&
        audit.scoreDisplayMode !== 'notApplicable'
    )

  if (availableAudits.length === 0) {
    return null
  }

  return availableAudits.every(
    (audit) => audit.score >= 0.9
  )
}

function formatAuditStatus(
  value,
  passedLabel,
  failedLabel
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 'Not available'
  }

  return value
    ? passedLabel
    : failedLabel
}

function cleanLighthouseText(value) {
  if (!value) return ''

  return String(value)
    .replace(
      /\[([^\]]+)\]\([^)]+\)/g,
      '$1'
    )
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeNumber(value) {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : null
}

/* =====================================================
   PAGESPEED REQUEST
===================================================== */

async function requestPageSpeed(
  url,
  strategy,
  apiKey
) {
  const endpoint =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(url)}` +
    `&strategy=${strategy}` +
    LIGHTHOUSE_CATEGORIES +
    `&key=${apiKey}`

  const maxAttempts = 2

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    console.log(
      `PageSpeed ${strategy} attempt ${attempt}/${maxAttempts}: ${url}`
    )

    const controller =
      new AbortController()

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        45000
      )

    try {
      const response =
        await fetch(
          endpoint,
          {
            signal:
              controller.signal,

            cache:
              'no-store',
          }
        )

      const data =
        await response.json()

      if (
        !response.ok ||
        data.error
      ) {
        console.warn(
          `PageSpeed ${strategy} failed:`,
          {
            status:
              response.status,

            statusText:
              response.statusText,

            error:
              data?.error ??
              null,
          }
        )

        if (
          attempt <
          maxAttempts
        ) {
          console.log(
            `Retrying ${strategy} PageSpeed scan in 2 seconds…`
          )

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                2000
              )
          )

          continue
        }

        throw new Error(
          `${strategy} Lighthouse returned error: ${
            data?.error
              ?.message ||
            `HTTP ${response.status}`
          }`
        )
      }

      if (
        !data
          .lighthouseResult
      ) {
        console.warn(
          `PageSpeed ${strategy} returned no lighthouseResult`
        )

        if (
          attempt <
          maxAttempts
        ) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                2000
              )
          )

          continue
        }

        throw new Error(
          `${strategy} PageSpeed response did not include Lighthouse results`
        )
      }

      console.log(
        `PageSpeed ${strategy} succeeded on attempt ${attempt}`
      )

      return data
    } catch (error) {
      if (
        attempt <
        maxAttempts
      ) {
        console.warn(
          `PageSpeed ${strategy} attempt ${attempt} threw:`,

          error?.message ||
            error
        )

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              2000
            )
        )

        continue
      }

      throw error
    } finally {
      clearTimeout(
        timeout
      )
    }
  }

  throw new Error(
    `${strategy} PageSpeed request failed after ${maxAttempts} attempts`
  )
}

/* =====================================================
   CATEGORY SCORES
===================================================== */

function extractCategoryScores(data) {
  const categories =
    data?.lighthouseResult?.categories || {}

  return {
    performance: readCategoryScore(
      categories,
      'performance',
      0
    ),

    seo: readCategoryScore(
      categories,
      'seo',
      0
    ),

    accessibility: readCategoryScore(
      categories,
      'accessibility',
      0
    ),

    bestPractices: readCategoryScore(
      categories,
      'best-practices',
      0
    ),
  }
}

/* =====================================================
   HEADLINE DETAILS
===================================================== */

function extractAuditDetails(data, url) {
  const audits =
    data?.lighthouseResult?.audits || {}

  return {
    loadTime:
      audits.interactive?.displayValue ||
      'Not available',

    firstContentfulPaint:
      audits['first-contentful-paint']
        ?.displayValue ||
      'Not available',

    largestContentfulPaint:
      audits['largest-contentful-paint']
        ?.displayValue ||
      'Not available',

    totalBlockingTime:
      audits['total-blocking-time']
        ?.displayValue ||
      'Not available',

    cumulativeLayoutShift:
      audits['cumulative-layout-shift']
        ?.displayValue ||
      'Not available',

    speedIndex:
      audits['speed-index']?.displayValue ||
      'Not available',

    totalByteWeight:
      audits['total-byte-weight']
        ?.displayValue ||
      'Not available',

    hasMetaDescription: readAuditPass(
      audits,
      'meta-description'
    ),

    hasTitle: readAuditPass(
      audits,
      'document-title'
    ),

    fontSizeOk: readAuditPass(
      audits,
      'font-size'
    ),

    tapTargetsOk: readAuditPass(
      audits,
      'tap-targets'
    ),

    imageOptimization:
      readCombinedAuditPass(
        audits,
        [
          'uses-optimized-images',
          'uses-responsive-images',
          'modern-image-formats',
        ]
      ),

    isHttps:
      new URL(url).protocol ===
      'https:',
  }
}

/* =====================================================
   EVIDENCE EXTRACTION
===================================================== */

function extractEvidenceItem(item) {
  if (
    !item ||
    typeof item !== 'object'
  ) {
    return null
  }

  const result = {}

  if (
    typeof item.url === 'string'
  ) {
    result.url = item.url
  }

  if (
    typeof item.source === 'string'
  ) {
    result.source = item.source
  }

  if (
    typeof item.label === 'string'
  ) {
    result.label = item.label
  }

  if (
    typeof item.selector === 'string'
  ) {
    result.selector = item.selector
  }

  if (
    typeof item.resourceType === 'string'
  ) {
    result.resourceType =
      item.resourceType
  }

  if (
    typeof item.transferSize === 'number'
  ) {
    result.transferSize =
      item.transferSize
  }

  if (
    typeof item.totalBytes === 'number'
  ) {
    result.totalBytes =
      item.totalBytes
  }

  if (
    typeof item.wastedBytes === 'number'
  ) {
    result.wastedBytes =
      item.wastedBytes
  }

  if (
    typeof item.wastedMs === 'number'
  ) {
    result.wastedMs =
      item.wastedMs
  }

  if (
    typeof item.duration === 'number'
  ) {
    result.duration =
      item.duration
  }

  if (item.node) {
    const node = {}

    if (
      typeof item.node.snippet ===
      'string'
    ) {
      node.snippet =
        cleanLighthouseText(
          item.node.snippet
        ).slice(0, 500)
    }

    if (
      typeof item.node.selector ===
      'string'
    ) {
      node.selector =
        item.node.selector.slice(
          0,
          500
        )
    }

    if (
      typeof item.node.nodeLabel ===
      'string'
    ) {
      node.nodeLabel =
        cleanLighthouseText(
          item.node.nodeLabel
        ).slice(0, 300)
    }

    if (
      Object.keys(node).length > 0
    ) {
      result.node = node
    }
  }

  return Object.keys(result).length > 0
    ? result
    : null
}

function calculateFindingPriority({
  category,
  score,
  weight,
  savingsMs,
  savingsBytes,
}) {
  /*
   * SiteSignal prioritisation.
   * This is NOT an official Lighthouse severity rating.
   */

  if (
    savingsMs !== null &&
    savingsMs >= 1000
  ) {
    return 'high'
  }

  if (
    savingsBytes !== null &&
    savingsBytes >= 500000
  ) {
    return 'high'
  }

  if (
    weight >= 10 &&
    score !== null &&
    score < 0.5
  ) {
    return 'high'
  }

  if (
    category === 'accessibility' &&
    score === 0
  ) {
    return 'high'
  }

  if (
    score !== null &&
    score < 0.5
  ) {
    return 'medium'
  }

  if (weight >= 3) {
    return 'medium'
  }

  if (
    savingsMs !== null &&
    savingsMs >= 250
  ) {
    return 'medium'
  }

  return 'low'
}

function buildEvidenceFinding(
  auditId,
  audit,
  auditRef,
  category
) {
  if (!audit) return null

  const scoreMode =
    audit.scoreDisplayMode || ''

  if (
    scoreMode === 'notApplicable' ||
    scoreMode === 'manual' ||
    scoreMode === 'informative'
  ) {
    return null
  }

  if (
    audit.score === null ||
    audit.score === undefined
  ) {
    return null
  }

  if (audit.score >= 0.9) {
    return null
  }

  const details =
    audit.details || {}

  const savingsMs =
    safeNumber(
      details.overallSavingsMs
    )

  const savingsBytes =
    safeNumber(
      details.overallSavingsBytes
    )

  const rawItems =
    Array.isArray(details.items)
      ? details.items
      : []

  const items =
    rawItems
      .slice(0, 8)
      .map(extractEvidenceItem)
      .filter(Boolean)

  const weight =
    typeof auditRef?.weight ===
    'number'
      ? auditRef.weight
      : 0

  const score =
    safeNumber(audit.score)

  return {
    id: auditId,

    category,

    categoryLabel:
      CATEGORY_LABELS[category] ||
      category,

    title:
      cleanLighthouseText(
        audit.title
      ) || auditId,

    description:
      cleanLighthouseText(
        audit.description
      ),

    score:
      score === null
        ? null
        : Math.round(
            score * 100
          ),

    rawScore:
      score,

    scoreDisplayMode:
      scoreMode,

    displayValue:
      audit.displayValue ||
      null,

    numericValue:
      safeNumber(
        audit.numericValue
      ),

    numericUnit:
      audit.numericUnit ||
      null,

    weight,

    group:
      auditRef?.group ||
      null,

    savingsMs,

    savingsBytes,

    affectedItemCount:
      rawItems.length,

    items,

    priority:
      calculateFindingPriority({
        category,
        score,
        weight,
        savingsMs,
        savingsBytes,
      }),
  }
}

function sortEvidenceFindings(
  a,
  b
) {
  const priorityWeight = {
    high: 3,
    medium: 2,
    low: 1,
  }

  const priorityDifference =
    (priorityWeight[b.priority] || 0) -
    (priorityWeight[a.priority] || 0)

  if (
    priorityDifference !== 0
  ) {
    return priorityDifference
  }

  const savingsDifference =
    (b.savingsMs || 0) -
    (a.savingsMs || 0)

  if (
    savingsDifference !== 0
  ) {
    return savingsDifference
  }

  const bytesDifference =
    (b.savingsBytes || 0) -
    (a.savingsBytes || 0)

  if (
    bytesDifference !== 0
  ) {
    return bytesDifference
  }

  const weightDifference =
    (b.weight || 0) -
    (a.weight || 0)

  if (
    weightDifference !== 0
  ) {
    return weightDifference
  }

  return (
    (a.rawScore ?? 1) -
    (b.rawScore ?? 1)
  )
}

function extractLighthouseEvidence(data) {
  const lighthouse =
    data?.lighthouseResult || {}

  const categories =
    lighthouse.categories || {}

  const audits =
    lighthouse.audits || {}

  /*
   * IMPORTANT:
   * These keys MUST match CATEGORY_KEYS exactly.
   */
  const categoryFindings = {
    performance: [],
    seo: [],
    accessibility: [],
    'best-practices': [],
  }

  const allFindings = []

  CATEGORY_KEYS.forEach(
    (categoryKey) => {
      const category =
        categories?.[categoryKey]

      const auditRefs =
        Array.isArray(
          category?.auditRefs
        )
          ? category.auditRefs
          : []

      auditRefs.forEach(
        (auditRef) => {
          const auditId =
            auditRef?.id

          if (!auditId) {
            return
          }

          const finding =
            buildEvidenceFinding(
              auditId,
              audits[auditId],
              auditRef,
              categoryKey
            )

          if (!finding) {
            return
          }

          if (
            !categoryFindings[
              categoryKey
            ]
          ) {
            console.warn(
              `Skipping unknown Lighthouse category: ${categoryKey}`
            )

            return
          }

          categoryFindings[
            categoryKey
          ].push(finding)

          allFindings.push(
            finding
          )
        }
      )

      if (
        categoryFindings[
          categoryKey
        ]
      ) {
        categoryFindings[
          categoryKey
        ].sort(
          sortEvidenceFindings
        )
      }
    }
  )

  const topFindings =
    [...allFindings]
      .sort(
        sortEvidenceFindings
      )
      .slice(0, 12)

  return {
    categories: {
      performance:
        categoryFindings.performance,

      seo:
        categoryFindings.seo,

      accessibility:
        categoryFindings.accessibility,

      bestPractices:
        categoryFindings[
          'best-practices'
        ],
    },

    topFindings,

    counts: {
      performance:
        categoryFindings
          .performance.length,

      seo:
        categoryFindings
          .seo.length,

      accessibility:
        categoryFindings
          .accessibility.length,

      bestPractices:
        categoryFindings[
          'best-practices'
        ].length,

      total:
        allFindings.length,
    },
  }
}

/* =====================================================
   LIGHTHOUSE SCAN
===================================================== */

async function getLighthouseScores(url) {
  try {
    const apiKey =
      process.env.PAGESPEED_API_KEY

    if (!apiKey) {
      throw new Error(
        'Missing PAGESPEED_API_KEY'
      )
    }

   
    /*
     * Run mobile and desktop together.
     *
     * This substantially reduces the total
     * waiting time for a complete page audit.
     */

    const [
      mobileData,
      desktopData,
    ] = await Promise.all([
      requestPageSpeed(
        url,
        'mobile',
        apiKey
      ),

      requestPageSpeed(
        url,
        'desktop',
        apiKey
      ),
    ])
    

    const mobileScores =
      extractCategoryScores(
        mobileData
      )

    const desktopScores =
      extractCategoryScores(
        desktopData
      )

    const mobileDetails =
      extractAuditDetails(
        mobileData,
        url
      )

    const desktopDetails =
      extractAuditDetails(
        desktopData,
        url
      )

    const mobileEvidence =
      extractLighthouseEvidence(
        mobileData
      )

    const desktopEvidence =
      extractLighthouseEvidence(
        desktopData
      )

    /*
     * SiteSignal composite indicator.
     * Not an official standalone Google score.
     */

    const overallScore =
      Math.round(
        (
          mobileScores.performance +
          mobileScores.seo +
          mobileScores.accessibility +
          mobileScores.bestPractices
        ) / 4
      )

    console.log(
      'Mobile Lighthouse scores:',
      mobileScores
    )

    console.log(
      'Desktop Lighthouse scores:',
      desktopScores
    )

    console.log(
      'Mobile evidence findings:',
      mobileEvidence.counts
    )

    console.log(
      'Desktop evidence findings:',
      desktopEvidence.counts
    )

    return {
      mobile:
        mobileScores,

      desktop:
        desktopScores,

      /*
       * Backwards compatible.
       *
       * Existing code can still read:
       * scores.details.firstContentfulPaint
       * scores.details.largestContentfulPaint
       * etc.
       */

      details: {
        ...mobileDetails,

        mobile:
          mobileDetails,

        desktop:
          desktopDetails,
      },

      evidence: {
        mobile:
          mobileEvidence,

        desktop:
          desktopEvidence,
      },

      overallScore,
    }
  } catch (error) {
    console.error(
      'Lighthouse error:',
      error
    )

    throw new Error(
      `Could not scan website: ${
        error?.message ||
        'Unknown Lighthouse error'
      }`
    )
  }
}

/* =====================================================
   FINDING TEXT HELPERS
===================================================== */

function formatFindingForReport(
  finding,
  deviceLabel
) {
  if (!finding) {
    return ''
  }

  const evidence = []

  if (
    finding.displayValue
  ) {
    evidence.push(
      finding.displayValue
    )
  }

  /*
   * Lighthouse display values can already
   * contain a time or byte estimate.
   *
   * Only add the separate saving when it
   * is not already represented.
   */

  if (
    finding.savingsMs !==
      null &&
    finding.savingsMs >
      0 &&
    !/\b(?:ms|milliseconds?|seconds?|sec|s)\b/i.test(
      finding.displayValue ||
        ''
    )
  ) {
    evidence.push(
      `estimated ${Math.round(
        finding.savingsMs
      )} ms potential saving`
    )
  }

  if (
    finding.savingsBytes !==
      null &&
    finding.savingsBytes >
      0 &&
    !/\b(?:KiB|MiB|KB|MB|bytes?)\b/i.test(
      finding.displayValue ||
        ''
    )
  ) {
    const kb =
      Math.round(
        finding.savingsBytes /
          1024
      )

    evidence.push(
      `approximately ${kb} KiB potential saving`
    )
  }

  if (
    finding
      .affectedItemCount >
    0
  ) {
    evidence.push(
      `${
        finding
          .affectedItemCount
      } affected ${
        finding
          .affectedItemCount ===
        1
          ? 'item'
          : 'items'
      }`
    )
  }

  const evidenceText =
    evidence.length > 0
      ? ` - ${evidence.join(
          '; '
        )}`
      : ''

  return (
    `${deviceLabel} ${finding.categoryLabel}: ` +
    `${finding.title}${evidenceText}`
  )
}

function getPriorityFindings(
  scores,
  limit = 5
) {
  const mobile =
    scores?.evidence?.mobile
      ?.topFindings || []

  const desktop =
    scores?.evidence?.desktop
      ?.topFindings || []

  const combined = [
    ...mobile.map(
      (finding) => ({
        ...finding,
        device: 'Mobile',
      })
    ),

    ...desktop.map(
      (finding) => ({
        ...finding,
        device: 'Desktop',
      })
    ),
  ]

  const unique = []
  const seen = new Set()

  for (
    const finding of combined
  ) {
    const key =
      `${finding.id}:${finding.category}`

    if (
      seen.has(key)
    ) {
      continue
    }

    seen.add(key)

    unique.push(
      finding
    )

    if (
      unique.length >=
      limit
    ) {
      break
    }
  }

  return unique
}

/* =====================================================
   ISSUE LIST
===================================================== */

function buildIssuesList(scores) {
  const issues = []

  const priorityFindings =
    getPriorityFindings(
      scores,
      5
    )

  priorityFindings.forEach(
    (finding) => {
      const formatted =
        formatFindingForReport(
          finding,
          finding.device
        )

      if (
        formatted
      ) {
        issues.push(
          formatted
        )
      }
    }
  )

  /*
   * Fall back to score-level findings only if
   * Lighthouse did not provide detailed failed audits.
   */

  if (
    issues.length === 0
  ) {
    if (
      scores.mobile
        .performance < 50
    ) {
      issues.push(
        `Mobile performance requires investigation (${scores.mobile.performance}/100)`
      )
    } else if (
      scores.mobile
        .performance < 70
    ) {
      issues.push(
        `Mobile performance has improvement opportunities (${scores.mobile.performance}/100)`
      )
    }

    if (
      scores.desktop
        .performance < 50
    ) {
      issues.push(
        `Desktop performance requires investigation (${scores.desktop.performance}/100)`
      )
    } else if (
      scores.desktop
        .performance < 70
    ) {
      issues.push(
        `Desktop performance has improvement opportunities (${scores.desktop.performance}/100)`
      )
    }
  }

  if (
    !scores.details.isHttps
  ) {
    issues.push(
      'The audited page was not delivered over HTTPS'
    )
  }

  if (
    scores.details
      .hasMetaDescription ===
    false
  ) {
    issues.push(
      'The audited page is missing a meta description'
    )
  }

  if (
    scores.details
      .hasTitle === false
  ) {
    issues.push(
      'The audited page is missing a document title'
    )
  }

  return Array.from(
    new Set(issues)
  ).slice(0, 5)
}

/* =====================================================
   RECOMMENDATION HELPERS
===================================================== */

function recommendationForFinding(
  finding
) {
  const id =
    finding?.id || ''

  const title =
    finding?.title ||
    'the Lighthouse finding'

      /*
   * Accessibility image-alt findings must be
   * handled before general image optimisation.
   */

  if (
    id ===
      'image-alt' ||
    id.includes(
      'alt-'
    ) ||
    id.includes(
      '-alt'
    )
  ) {
    return (
      `Review the images identified by "${title}". ` +
      'Add concise descriptive alt text to informative images ' +
      'and an empty alt attribute to images that are purely decorative, ' +
      'then check whether the same pattern occurs across repeated templates.'
    )
  }

  if (
    id.includes(
      'render-blocking'
    )
  ) {
    return (
      `Review the resources flagged under "${title}" and determine whether non-critical CSS or JavaScript can be deferred, inlined or loaded later.`
    )
  }

  if (
    id.includes(
      'unused-javascript'
    )
  ) {
    return (
      `Review the JavaScript identified by "${title}" and remove, split or defer code that is not required for the initial page experience.`
    )
  }

  if (
    id.includes(
      'unused-css'
    )
  ) {
    return (
      `Review the stylesheets identified by "${title}" and reduce CSS that is not required for the audited page.`
    )
  }

  if (
    id.includes('image') ||
    id.includes(
      'modern-image'
    )
  ) {
    return (
      `Review the images and resources identified by "${title}" for sizing, compression, responsive delivery and modern format opportunities.`
    )
  }

  if (
    id.includes(
      'largest-contentful-paint'
    ) ||
    id.includes('lcp')
  ) {
    return (
      `Identify the page's Largest Contentful Paint element and trace its image, font, network and rendering dependencies before choosing remediation work.`
    )
  }

  if (
    id.includes(
      'total-blocking-time'
    ) ||
    id.includes(
      'long-tasks'
    ) ||
    id.includes(
      'mainthread'
    )
  ) {
    return (
      `Review main-thread and JavaScript execution associated with "${title}", prioritising work that blocks interaction during initial load.`
    )
  }

  if (
    id.includes(
      'third-party'
    )
  ) {
    return (
      `Review the third-party resources identified by "${title}" and confirm which scripts are necessary, when they load and whether they can be delayed without affecting required functionality.`
    )
  }

  if (
    id ===
    'meta-description'
  ) {
    return (
      'Add or correct the page meta description and verify the same metadata pattern across representative search landing pages.'
    )
  }

  if (
    id ===
    'document-title'
  ) {
    return (
      'Add or correct the document title and verify title generation across representative page templates.'
    )
  }

  if (
    finding?.category ===
    'accessibility'
  ) {
    return (
      `Manually verify the elements flagged by "${title}" and remediate confirmed accessibility failures rather than relying on the automated result alone.`
    )
  }

  if (
    finding?.category ===
    'seo'
  ) {
    return (
      `Validate the "${title}" SEO finding on the audited page and check whether the same implementation occurs across related templates before making site-wide changes.`
    )
  }

  return (
    `Investigate the Lighthouse finding "${title}" using its affected resources or elements, validate the result manually, then prioritise remediation according to user impact and implementation effort.`
  )
}

/* =====================================================
   FALLBACK REPORT
===================================================== */

function generateFallbackReport(
  url,
  scores,
  issues
) {
  const priorityFindings =
    getPriorityFindings(
      scores,
      5
    )

  const recommendations =
    priorityFindings
      .map(
        recommendationForFinding
      )
      .filter(Boolean)

  if (
    scores.mobile
      .performance < 70 &&
    recommendations.length === 0
  ) {
    recommendations.push(
      'Review the mobile Lighthouse diagnostics and identify the largest measurable rendering, asset-delivery and JavaScript costs before selecting remediation work.'
    )
  }

  if (
    scores.desktop
      .performance < 70
  ) {
    recommendations.push(
      'Compare mobile and desktop findings to distinguish shared page costs from device-specific performance constraints.'
    )
  }

  if (
    scores.mobile
      .accessibility < 100
  ) {
    recommendations.push(
      'Complete manual accessibility validation for the automated accessibility failures before treating them as confirmed site-wide issues.'
    )
  }

  recommendations.push(
    'Repeat the assessment across representative project, content and conversion pages before drawing site-wide conclusions.'
  )

  const uniqueRecommendations =
    Array.from(
      new Set(
        recommendations
      )
    ).slice(0, 5)

  const businessImpact = []

  if (
    scores.mobile
      .performance < 70
  ) {
    businessImpact.push(
      'Performance constraints on the audited mobile page may delay access to meaningful content or interactions, particularly on slower devices or networks.'
    )
  }

  if (
    scores.desktop
      .performance < 70
  ) {
    businessImpact.push(
      'Desktop performance findings suggest that some page-level asset, rendering or execution costs may also affect less constrained devices.'
    )
  }

  if (
    scores.mobile
      .accessibility < 100
  ) {
    businessImpact.push(
      'Automated accessibility failures may indicate barriers for some users; the findings should be manually validated before remediation scope is set.'
    )
  }

  if (
    scores.mobile.seo < 100
  ) {
    businessImpact.push(
      'Technical SEO findings on the audited page may affect how search engines interpret or present that page; recurrence across related templates should be checked.'
    )
  }

  if (
    businessImpact.length === 0
  ) {
    businessImpact.push(
      'The automated checks did not identify a major concern in the categories reviewed during this run.'
    )

    businessImpact.push(
      'Representative page and manual testing are still required before drawing conclusions about the wider website.'
    )
  }

  return {
    executiveSummary:
      `This preliminary Lighthouse review of ${url} produced a SiteSignal composite indicator of ${scores.overallScore}/100. ` +
      `Mobile performance measured ${scores.mobile.performance}/100 and desktop performance measured ${scores.desktop.performance}/100. ` +
      'The individual Lighthouse evidence provides the more useful basis for investigation; results apply to the audited page and should be validated before broader remediation decisions are made.',

    keyIssues:
      issues.length > 0
        ? issues
        : [
            'No critical issue was confirmed by the automated checks included in this preliminary audit.',
            'Additional page-level and manual testing is required before making site-wide recommendations.',
          ],

    businessImpact:
      businessImpact.slice(
        0,
        4
      ),

    recommendations:
      uniqueRecommendations,
  }
}

/* =====================================================
   AI REPORT VALIDATION
===================================================== */

function validateAIReport(value) {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null
  }

  const executiveSummary =
    typeof value.executiveSummary ===
    'string'
      ? value.executiveSummary.trim()
      : ''

  const keyIssues =
    Array.isArray(
      value.keyIssues
    )
      ? value.keyIssues
          .filter(
            (item) =>
              typeof item ===
              'string'
          )
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean)
          .slice(0, 5)
      : []

  const businessImpact =
    Array.isArray(
      value.businessImpact
    )
      ? value.businessImpact
          .filter(
            (item) =>
              typeof item ===
              'string'
          )
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean)
          .slice(0, 4)
      : []

  const recommendations =
    Array.isArray(
      value.recommendations
    )
      ? value.recommendations
          .filter(
            (item) =>
              typeof item ===
              'string'
          )
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean)
          .slice(0, 5)
      : []

  if (
    !executiveSummary ||
    keyIssues.length === 0 ||
    businessImpact.length ===
      0 ||
    recommendations.length ===
      0
  ) {
    return null
  }

  return {
    executiveSummary,
    keyIssues,
    businessImpact,
    recommendations,
  }
}

/* =====================================================
   AI REPORT
===================================================== */

async function generateAIReport(
  url,
  scores
) {
  const issues =
    buildIssuesList(scores)

  const priorityFindings =
    getPriorityFindings(
      scores,
      8
    )

  const evidenceText =
    priorityFindings.length > 0
      ? priorityFindings
          .map(
            (
              finding,
              index
            ) => {
              return [
                `${index + 1}. ${finding.device} — ${finding.categoryLabel}`,
                `   Audit: ${finding.title}`,
                `   Priority: ${finding.priority}`,
                `   Score: ${
                  finding.score ??
                  'Not available'
                }`,
                `   Display value: ${
                  finding.displayValue ||
                  'Not available'
                }`,
                `   Potential savings: ${
                  finding.savingsMs !==
                    null
                    ? `${Math.round(
                        finding.savingsMs
                      )} ms`
                    : 'Not available'
                }, ${
                  finding.savingsBytes !==
                    null
                    ? `${Math.round(
                        finding.savingsBytes /
                          1024
                      )} KiB`
                    : 'Not available'
                }`,
                `   Affected items: ${finding.affectedItemCount}`,
              ].join('\n')
            }
          )
          .join('\n\n')
      : 'No individual failed Lighthouse audits were available for prioritisation.'

  const prompt = `
You are preparing a cautious, evidence-led website audit summary for a professional technical audience.

This is a preliminary automated review of one public page. It is not a complete website audit. Results may be affected by third-party scripts, consent tools, experimentation, geography, network conditions and temporary production behaviour.

AUDITED PAGE: ${url}

SITESIGNAL COMPOSITE INDICATOR:
${scores.overallScore}/100

Important:
This is a SiteSignal-derived indicator calculated from the four mobile Lighthouse category scores. It is NOT an official standalone Google Lighthouse score.

MOBILE LIGHTHOUSE:
- Performance: ${scores.mobile.performance}/100
- SEO: ${scores.mobile.seo}/100
- Accessibility: ${scores.mobile.accessibility}/100
- Best Practices: ${scores.mobile.bestPractices}/100

DESKTOP LIGHTHOUSE:
- Performance: ${scores.desktop.performance}/100
- SEO: ${scores.desktop.seo}/100
- Accessibility: ${scores.desktop.accessibility}/100
- Best Practices: ${scores.desktop.bestPractices}/100

MOBILE CORE DIAGNOSTICS:
- First Contentful Paint: ${scores.details.firstContentfulPaint}
- Largest Contentful Paint: ${scores.details.largestContentfulPaint}
- Total Blocking Time: ${scores.details.totalBlockingTime}
- Cumulative Layout Shift: ${scores.details.cumulativeLayoutShift}
- Speed Index: ${scores.details.speedIndex}
- Total Byte Weight: ${scores.details.totalByteWeight}

DESKTOP CORE DIAGNOSTICS:
- First Contentful Paint: ${scores.details.desktop?.firstContentfulPaint}
- Largest Contentful Paint: ${scores.details.desktop?.largestContentfulPaint}
- Total Blocking Time: ${scores.details.desktop?.totalBlockingTime}
- Cumulative Layout Shift: ${scores.details.desktop?.cumulativeLayoutShift}
- Speed Index: ${scores.details.desktop?.speedIndex}
- Total Byte Weight: ${scores.details.desktop?.totalByteWeight}

IMPLEMENTATION CHECKS:
- HTTPS: ${
    scores.details.isHttps
      ? 'Passed'
      : 'Failed'
  }
- Meta description: ${formatAuditStatus(
    scores.details.hasMetaDescription,
    'Passed',
    'Failed'
  )}
- Document title: ${formatAuditStatus(
    scores.details.hasTitle,
    'Passed',
    'Failed'
  )}

PRIORITISED LIGHTHOUSE EVIDENCE:
${evidenceText}

CONFIRMED AUTOMATED FINDINGS:
${
  issues.length > 0
    ? issues
        .map(
          (issue) =>
            `- ${issue}`
        )
        .join('\n')
    : '- No confirmed major issue from the available checks'
}

Return only valid JSON with exactly this structure:

{
  "executiveSummary": "2-3 cautious, evidence-led sentences.",
  "keyIssues": ["finding 1", "finding 2"],
  "businessImpact": ["potential impact 1", "potential impact 2"],
  "recommendations": ["priority action 1", "priority action 2"]
}

Rules:
- Base the report ONLY on the supplied Lighthouse scores, diagnostics and prioritised evidence.
- Never invent a cause that is not shown by the supplied evidence.
- Never describe the entire website as poor, weak, outdated or in need of a refresh.
- Never recommend a rebuild unless the supplied evidence proves one is necessary.
- Never claim that an issue definitely causes lost revenue, rankings, trust or conversions.
- Distinguish measured evidence from possible business implications.
- Prefer specific Lighthouse audit names and measured values over generic category-score commentary.
- Do not claim that SiteSignal priority is an official Lighthouse severity rating.
- Use proportionate language such as "may", "can", "worth validating", "preliminary" and "the audited page".
- Treat unavailable audits as unknown, not failed.
- Mention third-party scripts or consent tooling only as a possible influence unless a specific supplied audit identifies them.
- Accessibility findings from Lighthouse remain automated findings and should be manually verified.
- Recommendations must be diagnostic, specific and ordered by priority.
- keyIssues must contain 2 to 5 strings.
- businessImpact must contain 2 to 4 strings.
- recommendations must contain 3 to 5 strings.
- Return only the raw JSON object.
`

  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
  ]

  for (
    const model of models
  ) {
    try {
      console.log(
        `Trying audit model: ${model}`
      )

      const response =
        await ai.models.generateContent(
          {
            model,
            contents: prompt,
            config: {
              responseMimeType:
                'application/json',
            },
          }
        )

      const text =
        response?.text?.trim() ||
        ''

      const cleaned =
        text
          .replace(
            /^```json\s*/i,
            ''
          )
          .replace(
            /^```\s*/i,
            ''
          )
          .replace(
            /\s*```$/i,
            ''
          )
          .trim()

      const parsed =
        JSON.parse(cleaned)

      const validated =
        validateAIReport(
          parsed
        )

      if (
        !validated
      ) {
        throw new Error(
          'AI report did not match the required structure'
        )
      }

      console.log(
        `Audit report generated with: ${model}`
      )

      return validated
    } catch (error) {
      console.warn(
        `Audit model ${model} failed:`,
        error?.message ||
          error
      )

      if (
        model !==
        models[
          models.length - 1
        ]
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1500
            )
        )
      }
    }
  }

  return generateFallbackReport(
    url,
    scores,
    issues
  )
}

/* =====================================================
   API ROUTE
===================================================== */

export async function POST(
  request
) {
  try {
    const body =
      await request.json()

    const {
      url,
      scanMode = 'quick',
    } = body

    if (
      !url ||
      typeof url !== 'string'
    ) {
      return NextResponse.json(
        {
          error:
            'Please provide a website URL.',
        },
        {
          status: 400,
        }
      )
    }

    const cleanUrl =
      normaliseAuditUrl(
        url
      )

        if (
      !cleanUrl ||
      !isPublicAuditUrl(
        cleanUrl
      )
    ) {
      return NextResponse.json(
        {
          error:
            'That does not look like a valid URL. Try: example.com.au',
        },
        {
          status: 400,
        }
      )
    }

    const isQuickScan =
      scanMode === 'quick'

    const userId =
      getUserIdFromRequest(
        request
      )

    if (
      userId
    ) {
      const planData =
        await getUserPlan(
          userId
        )

      if (
        planData.auditLimitReached
      ) {
        console.log(
          `Audit limit reached for userId: ${userId} (${planData.auditCount}/${planData.auditLimit})`
        )

        return NextResponse.json(
          {
            error:
              `You have used all ${planData.auditLimit} free audits this month. ` +
              'Upgrade to Pro for unlimited audits.',

            limitReached:
              true,

            limitType:
              'audit',

            used:
              planData.auditCount,

            limit:
              planData.auditLimit,

            plan:
              planData.plan,
          },
          {
            status: 403,
          }
        )
      }
    }

    console.log(
      `Starting ${
        isQuickScan
          ? 'quick audit'
          : 'full single-page audit'
      } for: ${cleanUrl}`
    )

    const [
      scores,
      stackResult,
    ] = await Promise.all([
      getLighthouseScores(
        cleanUrl
      ),

      detectTechStackFromUrl(
        cleanUrl
      ),
    ])

    const techStack =
      stackResult?.stack ||
      null

    const pageTitle =
      stackResult?.pageTitle ||
      null

    const issues =
      buildIssuesList(
        scores
      )

    const aiReport =
      isQuickScan
        ? generateFallbackReport(
            cleanUrl,
            scores,
            issues
          )
        : await generateAIReport(
            cleanUrl,
            scores
          )

    if (
      userId
    ) {
      await incrementUsage(
        userId,
        'audit'
      )

      console.log(
        `Audit usage incremented for userId: ${userId}`
      )
    }

    console.log(
      `Audit complete. SiteSignal composite indicator: ${scores.overallScore}/100`
    )

    return NextResponse.json({
      success: true,

      url:
        cleanUrl,

      pageTitle,

      scores,

      techStack,

      aiReport,

      scanMode:
        isQuickScan
          ? 'quick'
          : 'full',

      scannedAt:
        new Date().toISOString(),
    })
  } catch (error) {
    console.error(
      'Audit error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Something went wrong. Please try again.',
      },
      {
        status: 500,
      }
    )
  }
}