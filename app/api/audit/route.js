import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getUserIdFromRequest } from '../../../lib/getUserId'
import { getUserPlan, incrementUsage } from '../../../lib/getUserPlan'
import { detectTechStackFromUrl } from '../../../lib/detectTechStackServer'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

function readCategoryScore(categories, key, fallback = 0) {
  const raw = categories?.[key]?.score

  if (raw === null || raw === undefined) {
    return fallback
  }

  return Math.round(raw * 100)
}

async function getLighthouseScores(url, { quick = false } = {}) {
  try {
    const apiKey = process.env.PAGESPEED_API_KEY

    if (!apiKey) {
      throw new Error('Missing PAGESPEED_API_KEY')
    }

    const categories =
      '&category=performance' +
      '&category=seo' +
      '&category=accessibility' +
      '&category=best-practices'

    const mobileUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&strategy=mobile${categories}&key=${apiKey}`

    const mobileRes = await fetch(mobileUrl, { cache: 'no-store' })
    const mobileData = await mobileRes.json()

    if (!mobileRes.ok || mobileData.error) {
      throw new Error(mobileData?.error?.message || 'Mobile PageSpeed request failed')
    }

    const mobileCategories = mobileData.lighthouseResult?.categories || {}
    console.log('📱 Mobile categories:', mobileCategories)

    const mobileScores = {
      performance: readCategoryScore(mobileCategories, 'performance', 0),
      seo: readCategoryScore(mobileCategories, 'seo', 0),
      accessibility: readCategoryScore(mobileCategories, 'accessibility', 0),
      bestPractices: readCategoryScore(mobileCategories, 'best-practices', 0),
    }

    let desktopScores = { ...mobileScores }

    if (!quick) {
      const desktopUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
        url
      )}&strategy=desktop${categories}&key=${apiKey}`

      const desktopRes = await fetch(desktopUrl, { cache: 'no-store' })
      const desktopData = await desktopRes.json()

      if (!desktopRes.ok || desktopData.error) {
        throw new Error(desktopData?.error?.message || 'Desktop PageSpeed request failed')
      }

      const desktopCategories = desktopData.lighthouseResult?.categories || {}
      console.log('🖥️ Desktop categories:', desktopCategories)

      desktopScores = {
        performance: readCategoryScore(
          desktopCategories,
          'performance',
          mobileScores.performance
        ),
        seo: readCategoryScore(desktopCategories, 'seo', mobileScores.seo),
        accessibility: readCategoryScore(
          desktopCategories,
          'accessibility',
          mobileScores.accessibility
        ),
        bestPractices: readCategoryScore(
          desktopCategories,
          'best-practices',
          mobileScores.bestPractices
        ),
      }
    }

    const audits = mobileData.lighthouseResult?.audits || {}

    const details = {
      loadTime: audits['interactive']?.displayValue || 'Unknown',
      firstContentfulPaint: audits['first-contentful-paint']?.displayValue || 'Unknown',
      hasMetaDescription: audits['meta-description']?.score === 1,
      imageOptimization: audits['uses-optimized-images']?.score === 1,
      isHttps: url.startsWith('https'),
      fontSizeOk: audits['font-size']?.score === 1,
      hasTitle: audits['document-title']?.score === 1,
      tapTargetsOk: audits['tap-targets']?.score === 1,
      totalByteWeight: audits['total-byte-weight']?.displayValue || 'Unknown',
    }

    const overallScore = Math.round(
      (mobileScores.performance +
        mobileScores.seo +
        mobileScores.accessibility +
        mobileScores.bestPractices) /
        4
    )

    return {
      mobile: mobileScores,
      desktop: desktopScores,
      details,
      overallScore,
    }
  } catch (error) {
    console.error('Lighthouse error:', error)
    throw new Error(`Could not scan website: ${error.message}`)
  }
}

function generateFallbackReport(url, scores, issuesList) {
  return {
    executiveSummary: `This website scored ${scores.overallScore}/100 overall. ${
      scores.overallScore < 50
        ? 'The site has significant issues that are likely hurting user trust, conversion, and Google visibility.'
        : 'The site has some areas that could be improved to better attract and convert visitors.'
    } A professional refresh would likely improve both user experience and business results.`,

    keyIssues:
      issuesList.length > 0
        ? issuesList
        : [
            'No critical issues were detected, but there are still opportunities to improve performance and visibility.',
            'The website appears functional overall, though some refinements could strengthen conversion and search performance.',
          ],

    businessImpact: [
      scores.mobile.performance < 50
        ? 'Slow load times can cause visitors to leave before the page fully loads, reducing enquiries and sales opportunities.'
        : 'Performance can still be improved to keep more visitors engaged and reduce drop-off.',
      scores.mobile.seo < 70
        ? `An SEO score of ${scores.mobile.seo}/100 suggests the site may be missing visibility opportunities on Google.`
        : 'SEO fundamentals are partly in place, though stronger optimisation could improve rankings further.',
      'A weak mobile experience can frustrate users and reduce trust, especially when most local visitors browse on their phones.',
    ],

    recommendations: [
      scores.mobile.performance < 70
        ? 'Improve page speed by compressing assets, reducing unnecessary scripts, and improving loading efficiency.'
        : 'Fine-tune performance further to maintain a fast and responsive user experience.',
      scores.mobile.seo < 70
        ? 'Strengthen SEO fundamentals by improving title tags, meta descriptions, page structure, and on-page clarity.'
        : 'Build on the existing SEO foundation with stronger local search optimisation and more targeted content.',
      'Improve mobile usability so text is easy to read, buttons are easy to tap, and the layout works well on smaller screens.',
      'Review accessibility and best-practice issues so the site feels more polished, credible, and usable for all visitors.',
    ],
  }
}

function buildIssuesList(scores) {
  const issuesList = []

  if (scores.mobile.performance < 50) {
    issuesList.push(`Very poor mobile performance (${scores.mobile.performance}/100)`)
  }
  if (scores.mobile.performance >= 50 && scores.mobile.performance < 70) {
    issuesList.push(`Below average mobile performance (${scores.mobile.performance}/100)`)
  }
  if (scores.mobile.seo < 70) {
    issuesList.push(`Weak SEO score (${scores.mobile.seo}/100)`)
  }
  if (scores.mobile.accessibility < 70) {
    issuesList.push(`Poor accessibility (${scores.mobile.accessibility}/100)`)
  }
  if (scores.mobile.bestPractices < 70) {
    issuesList.push(`Poor best practices (${scores.mobile.bestPractices}/100)`)
  }
  if (!scores.details.isHttps) {
    issuesList.push('No SSL certificate — site is not secure for visitors')
  }
  if (!scores.details.hasMetaDescription) {
    issuesList.push('Missing meta description — hurts Google rankings')
  }
  if (!scores.details.hasTitle) {
    issuesList.push('Missing page title tag — critical for SEO')
  }
  if (!scores.details.imageOptimization) {
    issuesList.push('Images not optimised — slowing the site down')
  }
  if (!scores.details.fontSizeOk) {
    issuesList.push('Text too small on mobile — poor user experience')
  }
  if (!scores.details.tapTargetsOk) {
    issuesList.push('Buttons too small for mobile users — causes frustration')
  }

  return issuesList
}

async function generateAIReport(url, scores) {
  const issuesList = buildIssuesList(scores)

  const prompt = `
You are a professional web developer writing a website audit report for a potential client.

WEBSITE: ${url}
OVERALL SCORE: ${scores.overallScore}/100
MOBILE PERFORMANCE: ${scores.mobile.performance}/100
DESKTOP PERFORMANCE: ${scores.desktop.performance}/100
SEO: ${scores.mobile.seo}/100
ACCESSIBILITY: ${scores.mobile.accessibility}/100
BEST PRACTICES: ${scores.mobile.bestPractices}/100
LOAD TIME: ${scores.details.loadTime}
FIRST CONTENTFUL PAINT: ${scores.details.firstContentfulPaint}
SSL CERTIFICATE: ${scores.details.isHttps ? 'Yes' : 'No'}
META DESCRIPTION: ${scores.details.hasMetaDescription ? 'Present' : 'Missing'}
PAGE TITLE: ${scores.details.hasTitle ? 'Present' : 'Missing'}
IMAGES OPTIMISED: ${scores.details.imageOptimization ? 'Yes' : 'No'}
FONT SIZE OK: ${scores.details.fontSizeOk ? 'Yes' : 'No'}
TAP TARGETS OK: ${scores.details.tapTargetsOk ? 'Yes' : 'No'}

ISSUES FOUND:
${issuesList.length > 0 ? issuesList.map((i) => `- ${i}`).join('\n') : '- No major issues found'}

You MUST respond with ONLY valid JSON. No markdown. No code blocks. No explanation. Just the raw JSON object.

Return exactly this structure:
{
  "executiveSummary": "2-3 sentences summarising the overall health of the website in plain English.",
  "keyIssues": ["issue 1", "issue 2", "issue 3"],
  "businessImpact": ["impact 1", "impact 2", "impact 3"],
  "recommendations": ["rec 1", "rec 2", "rec 3"]
}

Rules:
- Write for a business owner, no technical jargon
- keyIssues: 3 to 5 items
- businessImpact: 2 to 4 items
- recommendations: 3 to 5 items ordered by priority
- Every item must be a plain string
- Return ONLY the JSON object
`

  const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite']

  for (const model of models) {
    try {
      console.log(`🤖 Trying model: ${model}`)

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      })

      console.log(`✅ Success with model: ${model}`)

      const text = response.text.trim()
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      let parsed
      try {
        parsed = JSON.parse(cleaned)
      } catch (parseErr) {
        console.warn(`⚠️ JSON parse failed for ${model}:`, parseErr.message)
        if (model !== models[models.length - 1]) {
          await new Promise((r) => setTimeout(r, 2000))
          continue
        }
        return generateFallbackReport(url, scores, issuesList)
      }

      const requiredKeys = ['executiveSummary', 'keyIssues', 'businessImpact', 'recommendations']
      const missingKeys = requiredKeys.filter((k) => !parsed[k])

      if (missingKeys.length > 0) {
        console.warn(`⚠️ Missing keys: ${missingKeys.join(', ')}`)
        return generateFallbackReport(url, scores, issuesList)
      }

      if (
        !Array.isArray(parsed.keyIssues) ||
        !Array.isArray(parsed.businessImpact) ||
        !Array.isArray(parsed.recommendations)
      ) {
        console.warn('⚠️ Wrong field types')
        return generateFallbackReport(url, scores, issuesList)
      }

      return parsed
    } catch (error) {
      console.log(`⚠️ Model ${model} failed:`, error.message)
      if (model === models[models.length - 1]) {
        return generateFallbackReport(url, scores, issuesList)
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  return generateFallbackReport(url, scores, issuesList)
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { url, scanMode = 'full' } = body
    const isQuickScan = scanMode === 'quick'

    if (!url) {
      return NextResponse.json({ error: 'Please provide a URL' }, { status: 400 })
    }

    const userId = getUserIdFromRequest(request)

    if (userId) {
      const planData = await getUserPlan(userId)

      if (planData.auditLimitReached) {
        console.log(
          `🚫 Audit limit reached for userId: ${userId} (${planData.auditCount}/${planData.auditLimit})`
        )
        return NextResponse.json(
          {
            error: `You have used all ${planData.auditLimit} free audits this month. Upgrade to Pro for unlimited audits.`,
            limitReached: true,
            limitType: 'audit',
            used: planData.auditCount,
            limit: planData.auditLimit,
            plan: planData.plan,
          },
          { status: 403 }
        )
      }
    }

    let cleanUrl = url.trim()

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }

    try {
      new URL(cleanUrl)
    } catch {
      return NextResponse.json(
        { error: 'That does not look like a valid URL. Try: example.com.au' },
        { status: 400 }
      )
    }

    console.log(`🔍 Starting ${isQuickScan ? 'quick scan' : 'full audit'} for: ${cleanUrl}`)

    const [scores, stackResult] = await Promise.all([
      getLighthouseScores(cleanUrl, { quick: isQuickScan }),
      detectTechStackFromUrl(cleanUrl),
    ])
    const techStack = stackResult.stack
    const pageTitle = stackResult.pageTitle
    const aiReport = isQuickScan
      ? generateFallbackReport(cleanUrl, scores, buildIssuesList(scores))
      : await generateAIReport(cleanUrl, scores)

    if (userId) {
      await incrementUsage(userId, 'audit')
      console.log(`📊 Audit usage incremented for userId: ${userId}`)
    }

    console.log(`✅ Audit complete! Overall score: ${scores.overallScore}/100`)

    return NextResponse.json({
      success: true,
      url: cleanUrl,
      pageTitle,
      scores,
      techStack,
      aiReport,
      scanMode: isQuickScan ? 'quick' : 'full',
      scannedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Audit error:', error)
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}