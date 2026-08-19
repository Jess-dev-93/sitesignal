import { discoverSitePages } from './siteDiscovery'
import { runPageAudit } from './pageAuditEngine'

function normalisePageMetrics(pages) {
  return pages.map((page) => ({
    ...page,
    titleLength: page.title ? page.title.trim().length : 0,
    metaDescriptionLength: page.metaDescription ? page.metaDescription.trim().length : 0,
    hasMissingTitle: !page.title || page.title.trim().length === 0,
    hasMissingMetaDescription: !page.metaDescription || page.metaDescription.trim().length === 0,
    hasMissingH1: !page.h1Count || page.h1Count === 0,
    hasMultipleH1: (page.h1Count || 0) > 1,
    hasNoindex: page.robotsNoindex === true,
  }))
}

function buildIssueSummary(pages) {
  const issues = []

  const missingTitles = pages.filter((page) => page.hasMissingTitle)
  const missingMeta = pages.filter((page) => page.hasMissingMetaDescription)
  const missingH1 = pages.filter((page) => page.hasMissingH1)
  const multipleH1 = pages.filter((page) => page.hasMultipleH1)
  const noindex = pages.filter((page) => page.hasNoindex)
  const missingCanonical = pages.filter((page) => page.canonicalPresent === false)
  const missingAlt = pages.filter((page) => page.imagesMissingAlt > 0)

  if (missingTitles.length > 0) {
    issues.push({
      label: 'Pages missing titles',
      count: missingTitles.length,
      percentage: Math.round((missingTitles.length / pages.length) * 100),
    })
  }

  if (missingMeta.length > 0) {
    issues.push({
      label: 'Pages missing meta descriptions',
      count: missingMeta.length,
      percentage: Math.round((missingMeta.length / pages.length) * 100),
    })
  }

  if (missingH1.length > 0) {
    issues.push({
      label: 'Pages missing H1',
      count: missingH1.length,
      percentage: Math.round((missingH1.length / pages.length) * 100),
    })
  }

  if (multipleH1.length > 0) {
    issues.push({
      label: 'Pages with multiple H1s',
      count: multipleH1.length,
      percentage: Math.round((multipleH1.length / pages.length) * 100),
    })
  }

  if (noindex.length > 0) {
    issues.push({
      label: 'Pages marked noindex',
      count: noindex.length,
      percentage: Math.round((noindex.length / pages.length) * 100),
    })
  }

  if (missingCanonical.length > 0) {
    issues.push({
      label: 'Pages missing canonical tags',
      count: missingCanonical.length,
      percentage: Math.round((missingCanonical.length / pages.length) * 100),
    })
  }

  if (missingAlt.length > 0) {
    issues.push({
      label: 'Pages missing image alt text',
      count: missingAlt.length,
      percentage: Math.round((missingAlt.length / pages.length) * 100),
    })
  }

  return issues
}

function selectDeepAuditPages(discoveredPages, lightweightPages) {
  const pages = lightweightPages.length > 0 ? lightweightPages : discoveredPages
  const homepage = pages.find((page) => page.url === page.origin || page.url.endsWith('/'))
  const servicePage = pages.find((page) => /service|services|product|products|solution|solutions|capability|capabilities/.test(page.url))
  const aboutPage = pages.find((page) => /about|company|who-we-are|our-story|story/.test(page.url))
  const contactPage = pages.find((page) => /contact|contact-us|get-in-touch|enquire|quote|book|appointment|request/.test(page.url))
  const otherPage = pages.find((page) => ![homepage?.url, servicePage?.url, aboutPage?.url, contactPage?.url].includes(page.url))

  return [homepage, servicePage, aboutPage, contactPage, otherPage]
    .filter(Boolean)
    .slice(0, 5)
    .map((page) => page.url)
}

function average(values) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function summariseDeepAuditResults(deepResults) {
  const pageResults = deepResults.filter(Boolean)
  return {
    count: pageResults.length,
    averageMobilePerformance: average(pageResults.map((result) => result.scores.mobile.performance)),
    averageDesktopPerformance: average(pageResults.map((result) => result.scores.desktop.performance)),
    averageAccessibility: average(pageResults.map((result) => result.scores.mobile.accessibility)),
    averageBestPractices: average(pageResults.map((result) => result.scores.mobile.bestPractices)),
    averageSeo: average(pageResults.map((result) => result.scores.mobile.seo)),
    highestPerformingPage: pageResults.sort((a, b) => b.scores.mobile.performance - a.scores.mobile.performance)[0] || null,
    lowestPerformingPage: pageResults.sort((a, b) => a.scores.mobile.performance - b.scores.mobile.performance)[0] || null,
  }
}

async function runWithLimit(items, limit, worker) {
  const results = []
  let index = 0

  async function runNext() {
    while (index < items.length) {
      const currentIndex = index
      index += 1
      results[currentIndex] = await worker(items[currentIndex], currentIndex)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    await runNext()
  })

  await Promise.all(workers)
  return results
}

export async function runFullSiteAudit(inputUrl, { maxPages = 20, maxDeepPages = 5 } = {}) {
  const discovery = await discoverSitePages(inputUrl, { maxPages })
  const discoveredPages = discovery.discoveredPages || []

  const lightweightPages = normalisePageMetrics(
    discoveredPages.map((pageUrl) => ({
      url: pageUrl,
      title: '',
      metaDescription: '',
      h1Count: 0,
      canonicalPresent: false,
      canonicalValue: '',
      robotsNoindex: false,
      langPresent: false,
      viewportPresent: false,
      imageCount: 0,
      imagesMissingAlt: 0,
      structuredDataPresent: false,
      ogPresent: false,
      internalLinks: 0,
      status: 'pending',
      origin: new URL(pageUrl).origin,
    }))
  )

  const pageFetchResults = await runWithLimit(lightweightPages, 3, async (page) => {
    try {
      const response = await fetch(page.url, { cache: 'no-store' })
      const html = await response.text()
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const metaDescriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
      const h1Matches = html.match(/<h1\b[^>]*>/gi) || []
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)
      const noindexMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)
      const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i)
      const viewportMatch = html.match(/<meta[^>]+name=["']viewport["']/i)
      const ogMatch = html.match(/<meta[^>]+property=["']og:([^"]+)["']/i)
      const structuredDataMatches = html.match(/<script[^>]+type=["']application\/ld\+json["']/gi) || []
      const imageMatches = html.match(/<img\b[^>]*>/gi) || []
      const imagesMissingAlt = imageMatches.filter((match) => !/alt=["'][^"']*["']/i.test(match)).length
      const internalLinkMatches = html.match(/<a\s+[^>]*href=["']([^"']+)["']/gi) || []
      const internalLinkCount = internalLinkMatches.filter((match) => {
        const href = match.match(/href=["']([^"']+)["']/i)?.[1] || ''
        return href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')
      }).length

      return {
        ...page,
        status: response.ok ? 'ok' : 'failed',
        title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '',
        metaDescription: metaDescriptionMatch ? metaDescriptionMatch[1].trim() : '',
        h1Count: h1Matches.length,
        canonicalPresent: Boolean(canonicalMatch),
        canonicalValue: canonicalMatch ? canonicalMatch[1] : '',
        robotsNoindex: Boolean(noindexMatch && /noindex/i.test(noindexMatch[1] || '')),
        langPresent: Boolean(langMatch),
        viewportPresent: Boolean(viewportMatch),
        imageCount: imageMatches.length,
        imagesMissingAlt,
        structuredDataPresent: structuredDataMatches.length > 0,
        ogPresent: Boolean(ogMatch),
        internalLinks: internalLinkCount,
      }
    } catch {
      return {
        ...page,
        status: 'failed',
        title: '',
        metaDescription: '',
        h1Count: 0,
        canonicalPresent: false,
        canonicalValue: '',
        robotsNoindex: false,
        langPresent: false,
        viewportPresent: false,
        imageCount: 0,
        imagesMissingAlt: 0,
        structuredDataPresent: false,
        ogPresent: false,
        internalLinks: 0,
      }
    }
  })

  const lightweightResults = normalisePageMetrics(pageFetchResults)
  const issueSummary = buildIssueSummary(lightweightResults)

  const candidateUrls = selectDeepAuditPages(discoveredPages, lightweightResults)
  const deepTargets = candidateUrls.slice(0, maxDeepPages)

  const deepResults = []
  for (const targetUrl of deepTargets) {
    try {
      const result = await runPageAudit(targetUrl, { quick: true, generateAi: false })
      deepResults.push({
        url: targetUrl,
        pageTitle: result.pageTitle,
        scores: result.scores,
      })
    } catch {
      deepResults.push({ url: targetUrl, pageTitle: '', scores: null })
    }
  }

  const deepSummary = summariseDeepAuditResults(deepResults)
  const siteReport = {
    executiveSummary: `This site has ${discovery.discoveredCount} discovered pages and ${deepSummary.count} representative deep-audit pages. The audit focuses on the most important pages and highlights recurring technical and SEO issues that are affecting the broader site.`,
    keyIssues: issueSummary.slice(0, 4).map((issue) => `${issue.label} affecting ${issue.count} of ${discoveredPages.length} pages`),
    businessImpact: [
      'Repeated technical and SEO issues can reduce trust, hamper rankings, and make it harder for visitors to convert.',
      'The representative deep-audit pages show where performance and accessibility improvements will have the biggest site-wide impact.',
    ],
    recommendations: [
      'Prioritise fixes on the most important pages first, especially the homepage, service page, about page, and contact page.',
      'Address recurring SEO and technical issues such as missing titles, descriptions, H1s, and canonical tags across the site.',
      'Improve the highest-impact pages for mobile performance, accessibility, and best-practice compliance.',
    ],
  }

  return {
    success: true,
    discovery,
    lightweightResults,
    issueSummary,
    selectedDeepAuditPages: deepTargets,
    deepResults,
    deepSummary,
    siteReport,
  }
}
