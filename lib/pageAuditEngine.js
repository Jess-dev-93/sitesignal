import {
  GoogleGenAI,
} from '@google/genai'

import {
  detectTechStackFromUrl,
} from './detectTechStackServer'

const ai =
  new GoogleGenAI({
    apiKey:
      process.env
        .GEMINI_API_KEY,
  })

const PAGESPEED_TIMEOUT_MS =
  45_000

const PAGESPEED_MAX_ATTEMPTS =
  2

const LIGHTHOUSE_CATEGORIES =
  '&category=performance' +
  '&category=seo' +
  '&category=accessibility' +
  '&category=best-practices'

const CATEGORY_LABELS = {
  performance:
    'Performance',

  seo:
    'SEO',

  accessibility:
    'Accessibility',

  'best-practices':
    'Best Practices',
}

function readCategoryScore(
  categories,
  key,
  fallback = null
) {
  const raw =
    categories?.[key]?.score

  return (
    typeof raw ===
      'number' &&
    Number.isFinite(raw)
  )
    ? Math.round(
        raw * 100
      )
    : fallback
}

function safeNumber(
  value
) {
  return (
    typeof value ===
      'number' &&
    Number.isFinite(
      value
    )
  )
    ? value
    : null
}

function cleanLighthouseText(
  value
) {
  return String(
    value || ''
  )
    .replace(
      /\[([^\]]+)\]\([^)]+\)/g,
      '$1'
    )
    .replace(
      /`([^`]+)`/g,
      '$1'
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function extractEvidenceItem(
  item
) {
  if (
    !item ||
    typeof item !==
      'object'
  ) {
    return null
  }

  const result = {}

  ;[
    'url',
    'source',
    'label',
    'selector',
    'resourceType',
  ].forEach(
    (key) => {
      if (
        typeof item[key] ===
        'string'
      ) {
        result[key] =
          item[key]
      }
    }
  )

  ;[
    'transferSize',
    'totalBytes',
    'wastedBytes',
    'wastedMs',
    'duration',
  ].forEach(
    (key) => {
      if (
        typeof item[key] ===
          'number' &&
        Number.isFinite(
          item[key]
        )
      ) {
        result[key] =
          item[key]
      }
    }
  )

  if (item.node) {
    const node = {}

    if (
      typeof item.node
        .selector ===
      'string'
    ) {
      node.selector =
        item.node.selector.slice(
          0,
          500
        )
    }

    if (
      typeof item.node
        .nodeLabel ===
      'string'
    ) {
      node.nodeLabel =
        cleanLighthouseText(
          item.node.nodeLabel
        ).slice(
          0,
          300
        )
    }

    if (
      typeof item.node
        .snippet ===
      'string'
    ) {
      node.snippet =
        cleanLighthouseText(
          item.node.snippet
        ).slice(
          0,
          500
        )
    }

    if (
      Object.keys(
        node
      ).length > 0
    ) {
      result.node =
        node
    }
  }

  return (
    Object.keys(
      result
    ).length > 0
  )
    ? result
    : null
}

function calculatePriority({
  category,
  score,
  weight,
  savingsMs,
  savingsBytes,
}) {
  /*
   * These are internal report
   * classifications.
   *
   * They are not official
   * Lighthouse severity ratings.
   */

  if (
    savingsMs !== null &&
    savingsMs >= 1000
  ) {
    return 'high'
  }

  if (
    savingsBytes !== null &&
    savingsBytes >=
      500_000
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
    category ===
      'accessibility' &&
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

  if (
    weight >= 3 ||
    (
      savingsMs !== null &&
      savingsMs >= 250
    )
  ) {
    return 'medium'
  }

  return 'low'
}

function sortFindings(
  a,
  b
) {
  const priorityWeight = {
    high: 3,
    medium: 2,
    low: 1,
  }

  return (
    (
      priorityWeight[
        b.priority
      ] || 0
    ) -
      (
        priorityWeight[
          a.priority
        ] || 0
      ) ||
    (
      b.savingsMs || 0
    ) -
      (
        a.savingsMs || 0
      ) ||
    (
      b.savingsBytes || 0
    ) -
      (
        a.savingsBytes || 0
      ) ||
    (
      b.weight || 0
    ) -
      (
        a.weight || 0
      ) ||
    (
      a.rawScore ?? 1
    ) -
      (
        b.rawScore ?? 1
      )
  )
}

function extractLighthouseEvidence(
  data
) {
  const lighthouse =
    data?.lighthouseResult ||
    {}

  const categories =
    lighthouse.categories ||
    {}

  const audits =
    lighthouse.audits ||
    {}

  const allFindings = []

  Object.keys(
    CATEGORY_LABELS
  ).forEach(
    (categoryKey) => {
      const auditRefs =
        Array.isArray(
          categories?.[
            categoryKey
          ]?.auditRefs
        )
          ? categories[
              categoryKey
            ].auditRefs
          : []

      auditRefs.forEach(
        (auditRef) => {
          const audit =
            audits[
              auditRef?.id
            ]

          const scoreMode =
            audit
              ?.scoreDisplayMode ||
            ''

          if (
            !audit ||
            !auditRef?.id ||
            [
              'notApplicable',
              'manual',
              'informative',
            ].includes(
              scoreMode
            ) ||
            typeof audit.score !==
              'number' ||
            audit.score >= 0.9
          ) {
            return
          }

          const rawItems =
            Array.isArray(
              audit.details
                ?.items
            )
              ? audit.details
                  .items
              : []

          const savingsMs =
            safeNumber(
              audit.details
                ?.overallSavingsMs
            )

          const savingsBytes =
            safeNumber(
              audit.details
                ?.overallSavingsBytes
            )

          const weight =
            typeof auditRef
              .weight ===
            'number'
              ? auditRef.weight
              : 0

          const rawScore =
            safeNumber(
              audit.score
            )

          allFindings.push({
            id:
              auditRef.id,

            category:
              categoryKey,

            categoryLabel:
              CATEGORY_LABELS[
                categoryKey
              ],

            title:
              cleanLighthouseText(
                audit.title
              ) ||
              auditRef.id,

            description:
              cleanLighthouseText(
                audit.description
              ),

            score:
              rawScore === null
                ? null
                : Math.round(
                    rawScore *
                      100
                  ),

            rawScore,

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

            savingsMs,

            savingsBytes,

            affectedItemCount:
              rawItems.length,

            items:
              rawItems
                .slice(
                  0,
                  5
                )
                .map(
                  extractEvidenceItem
                )
                .filter(
                  Boolean
                ),

            priority:
              calculatePriority({
                category:
                  categoryKey,

                score:
                  rawScore,

                weight,

                savingsMs,

                savingsBytes,
              }),
          })
        }
      )
    }
  )

  return {
    topFindings:
      allFindings
        .sort(
          sortFindings
        )
        .slice(
          0,
          10
        ),

    totalFindings:
      allFindings.length,
  }
}

function readAuditPass(
  audits,
  key
) {
  const audit =
    audits?.[key]

  if (
    !audit ||
    typeof audit.score !==
      'number' ||
    audit
      .scoreDisplayMode ===
      'notApplicable'
  ) {
    return null
  }

  return (
    audit.score >=
    0.9
  )
}

function extractScores(
  data
) {
  const categories =
    data
      ?.lighthouseResult
      ?.categories ||
    {}

  return {
    performance:
      readCategoryScore(
        categories,
        'performance',
        0
      ),

    seo:
      readCategoryScore(
        categories,
        'seo',
        0
      ),

    accessibility:
      readCategoryScore(
        categories,
        'accessibility',
        0
      ),

    bestPractices:
      readCategoryScore(
        categories,
        'best-practices',
        0
      ),
  }
}

function extractDetails(
  data,
  url
) {
  const audits =
    data
      ?.lighthouseResult
      ?.audits ||
    {}

  return {
    interactive:
      audits.interactive
        ?.displayValue ||
      'Not available',

    firstContentfulPaint:
      audits[
        'first-contentful-paint'
      ]?.displayValue ||
      'Not available',

    largestContentfulPaint:
      audits[
        'largest-contentful-paint'
      ]?.displayValue ||
      'Not available',

    totalBlockingTime:
      audits[
        'total-blocking-time'
      ]?.displayValue ||
      'Not available',

    cumulativeLayoutShift:
      audits[
        'cumulative-layout-shift'
      ]?.displayValue ||
      'Not available',

    speedIndex:
      audits[
        'speed-index'
      ]?.displayValue ||
      'Not available',

    totalByteWeight:
      audits[
        'total-byte-weight'
      ]?.displayValue ||
      'Not available',

    hasMetaDescription:
      readAuditPass(
        audits,
        'meta-description'
      ),

    hasTitle:
      readAuditPass(
        audits,
        'document-title'
      ),

    fontSizeOk:
      readAuditPass(
        audits,
        'font-size'
      ),

    tapTargetsOk:
      readAuditPass(
        audits,
        'tap-targets'
      ),

    isHttps:
      new URL(
        url
      ).protocol ===
      'https:',
  }
}

function shouldRetryPageSpeed(
  status
) {
  return (
    status === 408 ||
    status === 429 ||
    status >= 500
  )
}

async function requestPageSpeed(
  url,
  strategy
) {
  const apiKey =
    process.env
      .PAGESPEED_API_KEY

  if (!apiKey) {
    throw new Error(
      'Missing PAGESPEED_API_KEY'
    )
  }

  const endpoint =
    'https://www.googleapis.com/pagespeedonline/v5/runPagespeed' +
    `?url=${encodeURIComponent(
      url
    )}` +
    `&strategy=${strategy}` +
    LIGHTHOUSE_CATEGORIES +
    `&key=${apiKey}`

  for (
    let attempt = 1;
    attempt <=
    PAGESPEED_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const controller =
      new AbortController()

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        PAGESPEED_TIMEOUT_MS
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
        await response
          .json()
          .catch(
            () => null
          )

      if (
        !response.ok ||
        data?.error ||
        !data?.lighthouseResult
      ) {
        const message =
          data
            ?.error
            ?.message ||
          (
            !data
              ?.lighthouseResult &&
            response.ok
              ? 'PageSpeed returned no Lighthouse result'
              : `PageSpeed returned HTTP ${response.status}`
          )

        if (
          attempt <
            PAGESPEED_MAX_ATTEMPTS &&
          shouldRetryPageSpeed(
            response.status
          )
        ) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1200
              )
          )

          continue
        }

        throw new Error(
          message
        )
      }

      return data
    } catch (error) {
      const timedOut =
        error?.name ===
        'AbortError'

      if (
        attempt <
          PAGESPEED_MAX_ATTEMPTS &&
        timedOut
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1200
            )
        )

        continue
      }

      throw new Error(
        timedOut
          ? `${strategy} PageSpeed request timed out after ${
              PAGESPEED_TIMEOUT_MS /
              1000
            } seconds`
          : error?.message ||
              `${strategy} PageSpeed request failed`
      )
    } finally {
      clearTimeout(
        timeout
      )
    }
  }

  throw new Error(
    `${strategy} PageSpeed request failed`
  )
}

export async function getLighthouseScores(
  url,
  {
    quick = false,
  } = {}
) {
  const mobileData =
    await requestPageSpeed(
      url,
      'mobile'
    )

  const mobile =
    extractScores(
      mobileData
    )

  const mobileDetails =
    extractDetails(
      mobileData,
      url
    )

  const mobileEvidence =
    extractLighthouseEvidence(
      mobileData
    )

  /*
   * A quick representative-page test
   * performs only a real mobile run.
   *
   * Desktop remains null instead of
   * copying the mobile scores.
   */

  let desktop = null
  let desktopDetails =
    null
  let desktopEvidence =
    null

  if (!quick) {
    const desktopData =
      await requestPageSpeed(
        url,
        'desktop'
      )

    desktop =
      extractScores(
        desktopData
      )

    desktopDetails =
      extractDetails(
        desktopData,
        url
      )

    desktopEvidence =
      extractLighthouseEvidence(
        desktopData
      )
  }

  const overallScore =
    Math.round(
      (
        mobile.performance +
        mobile.seo +
        mobile.accessibility +
        mobile.bestPractices
      ) / 4
    )

  return {
    mobile,

    desktop,

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
}

function formatFinding(
  finding
) {
  const evidence = []

  if (
    finding.displayValue
  ) {
    evidence.push(
      finding.displayValue
    )
  }

  if (
    finding.savingsMs >
      0 &&
    !/\b(?:ms|seconds?|sec|s)\b/i.test(
      finding.displayValue ||
        ''
    )
  ) {
    evidence.push(
      `approximately ${Math.round(
        finding.savingsMs
      )} ms potential saving`
    )
  }

  if (
    finding.savingsBytes >
      0 &&
    !/\b(?:kib|mib|kb|mb|bytes?)\b/i.test(
      finding.displayValue ||
        ''
    )
  ) {
    evidence.push(
      `approximately ${Math.round(
        finding.savingsBytes /
          1024
      )} KiB potential saving`
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
      } affected item${
        finding
          .affectedItemCount ===
        1
          ? ''
          : 's'
      }`
    )
  }

  return (
    `${finding.categoryLabel}: ` +
    `${finding.title}` +
    (
      evidence.length
        ? ` - ${evidence.join(
            '; '
          )}`
        : ''
    )
  )
}

export function buildIssuesList(
  scores
) {
  const findings =
    scores?.evidence
      ?.mobile
      ?.topFindings ||
    []

  const issues =
    findings
      .slice(
        0,
        5
      )
      .map(
        formatFinding
      )

  if (
    issues.length === 0 &&
    scores?.mobile
      ?.performance < 70
  ) {
    issues.push(
      `Mobile performance warrants investigation (${scores.mobile.performance}/100)`
    )
  }

  return issues
}

export function generateFallbackReport(
  url,
  scores,
  issuesList =
    buildIssuesList(
      scores
    )
) {
  const businessImpact = []

  if (
    scores.mobile
      .performance < 70
  ) {
    businessImpact.push(
      'Measured mobile performance constraints may delay access to content or interaction on the audited page, particularly on slower devices or networks.'
    )
  }

  if (
    scores.mobile
      .accessibility < 100
  ) {
    businessImpact.push(
      'Automated accessibility findings may indicate barriers for some visitors and require manual validation before remediation scope is set.'
    )
  }

  if (
    scores.mobile.seo <
    100
  ) {
    businessImpact.push(
      'Technical SEO observations may affect how search engines interpret or present the audited page; recurrence across related templates should be checked.'
    )
  }

  return {
    executiveSummary:
      `This preliminary automated review applies to ${url}. ` +
      `Mobile Lighthouse measured ${scores.mobile.performance}/100 for performance, ` +
      `${scores.mobile.seo}/100 for SEO, ` +
      `${scores.mobile.accessibility}/100 for accessibility and ` +
      `${scores.mobile.bestPractices}/100 for Best Practices. ` +
      'Individual findings and representative-page testing provide the appropriate basis for further investigation.',

    keyIssues:
      issuesList.length > 0
        ? issuesList
        : [
            'No major automated failure was identified in the available checks for this run.',
          ],

    businessImpact:
      businessImpact.length >
      0
        ? businessImpact
        : [
            'No material business impact can be concluded from the available automated checks alone.',
          ],

    recommendations: [
      'Validate the highest-priority Lighthouse findings against the affected resources and page elements.',
      'Repeat testing across representative content, service and conversion pages before defining site-wide work.',
      'Use analytics and conversion-event data, where available, to connect technical priorities with actual user behaviour.',
    ],
  }
}

function validateAIReport(
  value
) {
  if (
    !value ||
    typeof value !==
      'object'
  ) {
    return null
  }

  const executiveSummary =
    typeof value
      .executiveSummary ===
    'string'
      ? value
          .executiveSummary
          .trim()
      : ''

  const readList = (
    key,
    limit
  ) =>
    Array.isArray(
      value[key]
    )
      ? value[key]
          .filter(
            (item) =>
              typeof item ===
              'string'
          )
          .map(
            (item) =>
              item.trim()
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            limit
          )
      : []

  const keyIssues =
    readList(
      'keyIssues',
      5
    )

  const businessImpact =
    readList(
      'businessImpact',
      4
    )

  const recommendations =
    readList(
      'recommendations',
      5
    )

  if (
    !executiveSummary ||
    !keyIssues.length ||
    !businessImpact.length ||
    !recommendations.length
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

export async function generateAIReport(
  url,
  scores
) {
  if (
    !process.env
      .GEMINI_API_KEY
  ) {
    return generateFallbackReport(
      url,
      scores
    )
  }

  const fallback =
    generateFallbackReport(
      url,
      scores
    )

  const prompt = `
Prepare a cautious, evidence-led summary of a preliminary automated review of one public page.

Page: ${url}

Mobile Lighthouse scores:
${JSON.stringify(scores.mobile)}

Desktop Lighthouse scores:
${JSON.stringify(scores.desktop)}

Measured findings:
${JSON.stringify(buildIssuesList(scores))}

Return only valid JSON with this structure:

{
  "executiveSummary": "2-3 sentences",
  "keyIssues": ["2-5 measured findings"],
  "businessImpact": ["2-4 possible, proportionate implications"],
  "recommendations": ["3-5 validation-led actions"]
}

Rules:

- Do not invent causes.
- Do not claim confirmed lost revenue.
- Do not claim confirmed lost rankings.
- Do not claim confirmed lost conversions.
- Do not recommend a rebuild from scores alone.
- Distinguish measured evidence from possible implications.
- Use cautious wording such as "may", "can" and "requires validation".
- Return only the JSON object.
`

  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
  ]

  for (
    const model of
    models
  ) {
    try {
      const response =
        await ai.models
          .generateContent({
            model,

            contents:
              prompt,

            config: {
              responseMimeType:
                'application/json',
            },
          })

      const parsed =
        JSON.parse(
          String(
            response?.text ||
              ''
          ).trim()
        )

      const validated =
        validateAIReport(
          parsed
        )

      if (validated) {
        return validated
      }
    } catch (error) {
      console.warn(
        `Audit model ${model} failed:`,

        error?.message ||
          error
      )
    }
  }

  return fallback
}

export async function runPageAudit(
  url,
  {
    quick = false,
    generateAi = true,
  } = {}
) {
  const [
    scores,
    stackResult,
  ] =
    await Promise.all([
      getLighthouseScores(
        url,
        {
          quick,
        }
      ),

      detectTechStackFromUrl(
        url
      ),
    ])

  return {
    scores,

    techStack:
      stackResult.stack,

    pageTitle:
      stackResult.pageTitle,

    aiReport:
      generateAi
        ? await generateAIReport(
            url,
            scores
          )
        : null,
  }
}