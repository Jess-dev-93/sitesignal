// app/api/audit/route.js
// UPDATED TO USE GEMINI INSTEAD OF OPENAI
// ─────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Set up Gemini with our API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// ─────────────────────────────────────────────────────────
// HELPER FUNCTION 1
// Calls Google PageSpeed Insights API
// Returns scores for performance, SEO, accessibility etc
// ─────────────────────────────────────────────────────────
async function getLighthouseScores(url) {
  try {
    const apiKey = process.env.PAGESPEED_API_KEY
    
    // We run TWO scans - one for mobile, one for desktop
    const mobileUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${apiKey}`
    const desktopUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&key=${apiKey}`

    // Run both at the same time to save time
    const [mobileRes, desktopRes] = await Promise.all([
      fetch(mobileUrl),
      fetch(desktopUrl)
    ])

    const mobileData = await mobileRes.json()
    const desktopData = await desktopRes.json()

    // Check if Google returned an error
    if (mobileData.error) {
      throw new Error(mobileData.error.message)
    }

    // Pull out the scores we care about
    // Google gives scores as 0-1 decimals, we x100 to make them percentages
    const mobileScores = {
      performance: Math.round((mobileData.lighthouseResult?.categories?.performance?.score || 0) * 100),
      seo: Math.round((mobileData.lighthouseResult?.categories?.seo?.score || 0) * 100),
      accessibility: Math.round((mobileData.lighthouseResult?.categories?.accessibility?.score || 0) * 100),
      bestPractices: Math.round((mobileData.lighthouseResult?.categories?.['best-practices']?.score || 0) * 100),
    }

    const desktopScores = {
      performance: Math.round((desktopData.lighthouseResult?.categories?.performance?.score || 0) * 100),
      seo: Math.round((desktopData.lighthouseResult?.categories?.seo?.score || 0) * 100),
      accessibility: Math.round((desktopData.lighthouseResult?.categories?.accessibility?.score || 0) * 100),
      bestPractices: Math.round((desktopData.lighthouseResult?.categories?.['best-practices']?.score || 0) * 100),
    }

    // Pull out specific audit details (the individual issues Google found)
    const audits = mobileData.lighthouseResult?.audits || {}
    
    const details = {
      // Page load time
      loadTime: audits['interactive']?.displayValue || 'Unknown',
      
      // First thing the user sees loads by this time
      firstContentfulPaint: audits['first-contentful-paint']?.displayValue || 'Unknown',
      
      // Does the page have a meta description?
      hasMetaDescription: audits['meta-description']?.score === 1,
      
      // Are images the right size?
      imageOptimization: audits['uses-optimized-images']?.score === 1,
      
      // Does it use HTTPS?
      isHttps: url.startsWith('https'),
      
      // Is the text readable on mobile?
      fontSizeOk: audits['font-size']?.score === 1,
      
      // Does the page have a proper title tag?
      hasTitle: audits['document-title']?.score === 1,
      
      // Are tap targets (buttons etc) big enough on mobile?
      tapTargetsOk: audits['tap-targets']?.score === 1,
      
      // Page size
      totalByteWeight: audits['total-byte-weight']?.displayValue || 'Unknown',
    }

    // Calculate one overall score (average of all 4 categories)
    const overallMobile = Math.round(
      (mobileScores.performance + mobileScores.seo + 
       mobileScores.accessibility + mobileScores.bestPractices) / 4
    )

    return {
      mobile: mobileScores,
      desktop: desktopScores,
      details,
      overallScore: overallMobile,
    }

  } catch (error) {
    console.error('Lighthouse error:', error)
    throw new Error(`Could not scan website: ${error.message}`)
  }
}

// ─────────────────────────────────────────────────────────
// HELPER FUNCTION 2
// Takes all the scores and asks GPT-4 to write a
// professional audit report in plain English
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// HELPER FUNCTION 2 (GEMINI VERSION)
// Takes all the scores and asks Gemini to write a
// professional audit report in plain English
// ─────────────────────────────────────────────────────────
async function generateAIReport(url, scores) {
  
  // Build list of issues found
  const issuesList = []
  
  if (scores.mobile.performance < 50) issuesList.push(`Very poor mobile performance score (${scores.mobile.performance}/100)`)
  if (scores.mobile.performance >= 50 && scores.mobile.performance < 70) issuesList.push(`Below average mobile performance (${scores.mobile.performance}/100)`)
  if (scores.mobile.seo < 70) issuesList.push(`Weak SEO score (${scores.mobile.seo}/100) - hard to find on Google`)
  if (scores.mobile.accessibility < 70) issuesList.push(`Poor accessibility score (${scores.mobile.accessibility}/100)`)
  if (scores.mobile.bestPractices < 70) issuesList.push(`Poor best practices score (${scores.mobile.bestPractices}/100)`)
  if (!scores.details.isHttps) issuesList.push('No SSL certificate (uses HTTP not HTTPS - unsafe for visitors)')
  if (!scores.details.hasMetaDescription) issuesList.push('Missing meta description (hurts Google rankings)')
  if (!scores.details.hasTitle) issuesList.push('Missing or poor page title tag')
  if (!scores.details.imageOptimization) issuesList.push('Images are not optimized (slowing the site down)')
  if (!scores.details.fontSizeOk) issuesList.push('Text too small to read on mobile')
  if (!scores.details.tapTargetsOk) issuesList.push('Buttons/links too small for mobile users')

  // The prompt we send to Gemini
  const prompt = `
You are a professional web developer writing a website audit report for a potential client.
Your goal is to clearly explain problems with their website in simple terms, make them feel 
the urgency of fixing these issues, and end with encouragement to get help.

WEBSITE AUDITED: ${url}

SCORES:
- Overall Score: ${scores.overallScore}/100
- Mobile Performance: ${scores.mobile.performance}/100
- Desktop Performance: ${scores.desktop.performance}/100  
- SEO Score: ${scores.mobile.seo}/100
- Accessibility: ${scores.mobile.accessibility}/100
- Best Practices: ${scores.mobile.bestPractices}/100

TECHNICAL DETAILS:
- Page Load Time: ${scores.details.loadTime}
- First Content Visible: ${scores.details.firstContentfulPaint}
- Has SSL (HTTPS): ${scores.details.isHttps ? 'Yes ✅' : 'No ❌'}
- Has Meta Description: ${scores.details.hasMetaDescription ? 'Yes ✅' : 'No ❌'}
- Has Proper Title Tag: ${scores.details.hasTitle ? 'Yes ✅' : 'No ❌'}
- Images Optimized: ${scores.details.imageOptimization ? 'Yes ✅' : 'No ❌'}
- Mobile Text Readable: ${scores.details.fontSizeOk ? 'Yes ✅' : 'No ❌'}
- Total Page Size: ${scores.details.totalByteWeight}

ISSUES FOUND:
${issuesList.length > 0 ? issuesList.map(i => `- ${i}`).join('\n') : '- No major issues found - great website!'}

Write a professional audit report with these exact sections:

**SUMMARY**
2-3 sentences explaining the overall health of the website honestly but kindly.

**CRITICAL ISSUES**
List the most urgent problems only if score is under 50 or major issues exist.
Explain WHY each one is costing them customers or money in plain language.
Use real statistics where helpful (e.g. "53% of users leave if a page takes over 3 seconds to load").

**AREAS TO IMPROVE**
Medium priority items (scores between 50-70). Explain impact in simple terms.

**WHAT IS WORKING**
Be positive about what they have done right. Everyone likes hearing good news.

**THE BOTTOM LINE**
1 paragraph explaining these issues are likely costing them real customers every day.
Be honest and urgent but friendly - not pushy.

Rules:
- Write like you are talking to a business owner NOT a developer
- No technical jargon - if you must use a term, explain it in simple words
- Keep it friendly and professional
- Maximum 600 words total
`

  // Get the Gemini model
  // gemini-1.5-flash is FREE and very fast and smart
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  // Send the prompt and get the response
  const result = await model.generateContent(prompt)
  const response = await result.response
  
  return response.text()
}

// ─────────────────────────────────────────────────────────
// MAIN API HANDLER
// This runs when the frontend calls /api/audit
// ─────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    // Get the URL from the request body
    const body = await request.json()
    const { url } = body

    // ── Validation ──────────────────────────────────────
    // Make sure a URL was actually provided
    if (!url) {
      return NextResponse.json(
        { error: 'Please provide a URL' },
        { status: 400 }
      )
    }

    // Make sure it looks like a real URL
    // Add https:// if they forgot it
    let cleanUrl = url.trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }

    // Quick URL validity check
    try {
      new URL(cleanUrl)
    } catch {
      return NextResponse.json(
        { error: 'That does not look like a valid URL. Try: example.com.au' },
        { status: 400 }
      )
    }

    // ── Run The Scan ─────────────────────────────────────
    console.log(`🔍 Starting audit for: ${cleanUrl}`)
    
    // Step 1: Get Lighthouse scores from Google
    console.log('📊 Getting Lighthouse scores...')
    const scores = await getLighthouseScores(cleanUrl)
    
    // Step 2: Generate AI report using the scores
    console.log('🤖 Generating AI report...')
    const aiReport = await generateAIReport(cleanUrl, scores)

    // Step 3: Send everything back to the frontend
    console.log(`✅ Audit complete! Score: ${scores.overallScore}/100`)
    
    return NextResponse.json({
      success: true,
      url: cleanUrl,
      scores,
      aiReport,
      scannedAt: new Date().toISOString(),
    })

  } catch (error) {
    // If anything goes wrong, return a clean error message
    console.error('Audit error:', error)
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}