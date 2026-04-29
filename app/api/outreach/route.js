import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { getUserIdFromRequest } from '../../../lib/getUserId'

function extractDomain(url = '') {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

function mapLeadToExistingLeadSchema(lead, userId) {
  const websiteUrl = lead.website_url || lead.url || ''
  const domain = lead.domain || extractDomain(websiteUrl)
  const metadata = lead.metadata || {}

  return {
    user_id: userId,
    domain,
    business_name: lead.business_name || lead.title || 'Unknown Business',
    website_url: websiteUrl,
    display_url: lead.display_url || metadata.displayUrl || websiteUrl,
    snippet: lead.snippet || metadata.snippet || '',
    query_found: lead.search_query || lead.industry || '',
    industry: lead.industry || lead.search_query || '',
    location: lead.location || metadata.location || '',
    website_health_score:
      lead.quick_health_score ??
      lead.website_health_score ??
      metadata?.scores?.overall ??
      0,
    opportunity_score: lead.opportunity_score ?? lead.opportunityScore ?? 0,
    performance: lead.performance ?? metadata?.scores?.performance ?? null,
    seo: lead.seo ?? metadata?.scores?.seo ?? null,
    accessibility: lead.accessibility ?? metadata?.scores?.accessibility ?? null,
    best_practices: lead.best_practices ?? metadata?.scores?.bestPractices ?? null,
    is_https: lead.is_https ?? metadata?.scores?.isHttps ?? true,
    has_meta_description:
      lead.has_meta_description ?? metadata?.scores?.hasMetaDescription ?? false,
    has_viewport: lead.has_viewport ?? metadata?.scores?.hasViewport ?? false,
    load_time: lead.load_time ?? metadata?.scores?.loadTime ?? null,
    lead_temp: (lead.lead_temperature || lead.leadTemp || 'NEW').toUpperCase(),
    estimated_value:
      lead.estimated_value || metadata?.estimatedValue || '\$1,500 - \$3,000',
    last_seen_at: new Date().toISOString(),
  }
}

function buildIssueList(lead) {
  if (Array.isArray(lead.quick_issues) && lead.quick_issues.length) {
    return lead.quick_issues
  }
  const issues = []
  if (lead.has_meta_description === false)
    issues.push('missing meta description — hurts Google click-through rates')
  if (lead.has_viewport === false)
    issues.push('mobile viewport issues — site may not display correctly on phones')
  if (lead.metadata?.signals?.hasPhone === false)
    issues.push('no phone number visible on the site')
  if (lead.metadata?.signals?.hasEmail === false)
    issues.push('no email address found on the site')
  if (lead.metadata?.signals?.hasForm === false)
    issues.push('no contact form found')
  return issues
}

function scoreLabel(score) {
  if (score == null) return '—'
  if (score >= 90) return '✅  (excellent)'
  if (score >= 70) return '✅  (good)'
  if (score >= 50) return '⚠️  (needs work)'
  return '❌  (poor)'
}

function buildFallbackOutreach(lead, profile = {}, clientContact = {}) {
  const businessName = lead.business_name || 'your business'
  const location = lead.location || 'your area'
  const issues = buildIssueList(lead)
  const topIssue = issues.length ? issues[0] : 'a few areas affecting usability and enquiries'

  const senderName = profile.yourName || 'Jess'
  const senderCompany = profile.yourCompany || ''
  const clientName = clientContact.contactName || ''
  const greeting = clientName ? `Hi ${clientName}` : 'Hi'
  const companyLine = senderCompany ? `\n${senderCompany}` : ''

  return {
    call_script: `${greeting} — is this ${businessName}?\n\nMy name's ${senderName} — I'm a web developer. I had a quick look at your website and noticed a couple of things that might be affecting how customers find you online.\n\nI've actually put together a short free audit report — would it be alright if I sent that through to you? It just highlights what I found and what's worth fixing. No strings attached.\n\n[If yes] — Perfect. What's the best email?\n\n[If they want more info] — I build websites for local businesses in ${location} — fast, mobile-friendly sites that show up on Google and actually convert visitors into enquiries.\n\nThanks so much — I'll get that over to you now.`,

    email_subject: `Free website audit for ${businessName}`,

    email_body: `${greeting},\n\nI put together a quick audit of ${businessName}'s website using Google Lighthouse — the same tool Google uses to evaluate sites.\n\nI noticed a couple of things that may be affecting how many enquiries you're getting — particularly ${topIssue}.\n\nI've attached the full PDF report with the findings and recommendations.\n\nI'm ${senderName}${senderCompany ? ` — I run ${senderCompany}` : ''} and I specialise in fast, mobile-first websites for local Australian businesses. Would a quick 15-minute call be worth it?\n\nBest,\n${senderName}${companyLine}`,

    follow_up_body: `${greeting},\n\nJust following up on the audit report I sent through earlier this week for ${businessName}'s website.\n\nDid you get a chance to take a look? Happy to talk through any of the findings if it would be useful — even just a quick 10-minute call.\n\nBest,\n${senderName}${companyLine}`,

    dm_body: `Hi! I sent through a free audit for ${businessName}'s website — did it land okay? Happy to chat through what I found if useful.`,
  }
}

async function generateWithGemini(lead, auditContext = null, profile = {}, clientContact = {}) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return buildFallbackOutreach(lead, profile, clientContact)

  // ── Sender details ─────────────────────────────────────────────────────
  const senderName = (profile.yourName && profile.yourName.trim()) ? profile.yourName.trim() : null
  const senderCompany = (profile.yourCompany && profile.yourCompany.trim()) ? profile.yourCompany.trim() : null
  const senderTitle = (profile.yourTitle && profile.yourTitle.trim()) ? profile.yourTitle.trim() : 'web developer'
  const senderLocation = (profile.yourLocation && profile.yourLocation.trim()) ? profile.yourLocation.trim() : null
  const senderSpecialty = (profile.yourSpecialty && profile.yourSpecialty.trim()) ? profile.yourSpecialty.trim() : 'fast, mobile-first websites for local Australian businesses'

  if (!senderName) {
    console.warn('⚠️ No sender name in profile — fill in your profile for personalised output')
  }

  // ── Client contact ─────────────────────────────────────────────────────
  const clientName = (clientContact.contactName && clientContact.contactName.trim()) ? clientContact.contactName.trim() : null
  const clientPhone = (clientContact.contactPhone && clientContact.contactPhone.trim()) ? clientContact.contactPhone.trim() : null
  const clientNotes = (clientContact.notes && clientContact.notes.trim()) ? clientContact.notes.trim() : null

  const greeting = clientName ? `Hi ${clientName}` : 'Hi'

  // ── Business details ───────────────────────────────────────────────────
  const businessName = lead.business_name || lead.title || 'the business'
  const businessDomain = lead.domain || extractDomain(lead.website_url || '')
  const businessLocation = lead.location || 'Australia'
  const businessIndustry = lead.industry || 'local business'
  const issues = buildIssueList(lead)

  // ── Audit scores block ─────────────────────────────────────────────────
  let auditScoresBlock = ''
  let auditIssuesBlock = ''
  let hasRealAuditData = false

  if (auditContext) {
    hasRealAuditData = true
    const perf = auditContext.performance
    const seo = auditContext.seo
    const a11y = auditContext.accessibility
    const bp = auditContext.bestPractices

    auditScoresBlock = `
━━━━━━━━━━━━━━━━━━━━━━
YOUR SITE AUDIT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━
Performance:      ${perf ?? '—'}/100      ${scoreLabel(perf)}
SEO:              ${seo ?? '—'}/100      ${scoreLabel(seo)}
Accessibility:    ${a11y ?? '—'}/100      ${scoreLabel(a11y)}
Best Practices:   ${bp ?? '—'}/100      ${scoreLabel(bp)}`

    const keyIssues = Array.isArray(auditContext.keyIssues) ? auditContext.keyIssues : []
    const executiveSummary = auditContext.executiveSummary || ''
    const businessImpact = Array.isArray(auditContext.businessImpact)
      ? auditContext.businessImpact.join(' ')
      : (auditContext.businessImpact || '')

    auditIssuesBlock = `
Executive summary: ${executiveSummary}
Key issues: ${keyIssues.join('; ') || 'See scores above'}
Business impact: ${businessImpact}`
  }

  // ── Signature ──────────────────────────────────────────────────────────
  const signatureLines = [
    senderName || 'Jess',
    senderCompany || null,
    senderLocation || null,
  ].filter(Boolean).join('\n')

  const prompt = `
You are writing outreach copy for a freelance web developer contacting a local business about their website.

CRITICAL RULES — read these first and follow them exactly:
- Use the EXACT sender name provided. Do NOT invent a name. Do NOT use placeholder names like "Alex" or "John".
- Use the EXACT business name provided. Do NOT invent or shorten it.
- Do NOT write [Your Name], [Business Name], [Location] or ANY placeholder text anywhere in the output.
- If a field says "NOT PROVIDED" — omit it naturally. Do not make something up.
- Write as a real human — warm, direct, natural. Not a template. Not marketing copy.
- The PDF audit report has ALREADY been sent with the cold email. The follow-up assumes this.

═══════════════════════════════════════════
SENDER (the web developer — use EXACTLY as written)
═══════════════════════════════════════════
Full name:    ${senderName || 'NOT PROVIDED — write in first person only, no name'}
Company:      ${senderCompany || 'NOT PROVIDED — do not mention a company'}
Title:        ${senderTitle}
Location:     ${senderLocation || 'NOT PROVIDED — do not mention a specific location'}
Specialty:    ${senderSpecialty}

═══════════════════════════════════════════
TARGET BUSINESS
═══════════════════════════════════════════
Business name:  ${businessName}
Domain:         ${businessDomain}
Industry:       ${businessIndustry}
Location:       ${businessLocation}
Contact name:   ${clientName || 'NOT PROVIDED — use a generic greeting like "Hi,"'}
Contact phone:  ${clientPhone || 'NOT PROVIDED'}
Notes:          ${clientNotes || 'None'}

═══════════════════════════════════════════
AUDIT DATA
═══════════════════════════════════════════
Real audit data available: ${hasRealAuditData ? 'YES — use the specific scores and issues below' : 'NO — use general observations only'}
${auditScoresBlock}
${auditIssuesBlock}
${!hasRealAuditData && issues.length ? `Estimated issues: ${issues.join('; ')}` : ''}

═══════════════════════════════════════════
WHAT TO WRITE
═══════════════════════════════════════════

── 1. CALL SCRIPT ──────────────────────────────────────────────────────────────

Write a SHORT, punchy cold call script. This is a real phone call — not a presentation.

The ONLY goal of this call is to get permission to send the free audit report.
Do NOT try to sell anything. Do NOT explain everything. Keep it under 90 seconds.

Structure (follow this order):
LINE 1: "Hi [contact name if known / "there"] — is this [business name]?"
LINE 2: "My name's [sender first name] — I'm a [title]."
LINE 3: ONE sentence about what you noticed on their site — mention 1 specific issue or score
LINE 4: "I've put together a short free audit report — would it be alright if I sent that through?"
LINE 5 (if yes): "Perfect — what's the best email for you?"
LINE 6 (if they ask who you are): ONE sentence about what you do — no more
LINE 7: Warm close — 1 sentence

Rules:
- Maximum 120 words total
- Short sentences. Natural pauses between lines.
- Sound like a human, not a script
- Reference ONE real finding (score or issue) — not a list
- Do NOT mention pricing, services, or your portfolio on this call

── 2. COLD EMAIL ───────────────────────────────────────────────────────────────

Write a structured cold email in this EXACT format:

Subject line: short, specific, references the business or a real finding

Body:
${greeting},

[1–2 sentence opener — mention you ran an audit on their specific domain using Google Lighthouse]

${hasRealAuditData ? auditScoresBlock : '[Brief 1-sentence summary of what you observed]'}

[1–2 sentences interpreting the scores — what's good, what needs work, commercial impact in plain English]

━━━━━━━━━━━━━━━━━━━━━━
THE MAIN ISSUES
━━━━━━━━━━━━━━━━━━━━━━

[List 2–4 specific issues as numbered items. Each issue must have:
  - A bold heading in CAPS (e.g. "1. LOAD SPEED")
  - A bullet explaining the problem in plain English
  - A bullet explaining the business impact
  - A bullet saying the fix]

Full details are in the attached PDF report.

━━━━━━━━━━━━━━━━━━━━━━
WHY I'M REACHING OUT
━━━━━━━━━━━━━━━━━━━━━━

[2–3 sentences: who you are, what you specialise in, why you're contacting them specifically — personal and warm, not a pitch]

What I can help with:
✅ [specific improvement tied to their audit results]
✅ [specific improvement tied to their audit results]
✅ [specific improvement tied to their audit results]
✅ [realistic timeline e.g. "Live in approximately 10 days"]
✅ [quality or process guarantee]

[Closing question — suggest a specific short call e.g. "Would a 15-minute call work this week?" — use contact name if known]

Best,
${signatureLines}

── 3. FOLLOW-UP EMAIL ──────────────────────────────────────────────────────────

IMPORTANT: The PDF audit report was ALREADY sent with the cold email.
This follow-up assumes they received it. Do NOT offer to send it — ask if they saw it.

Write a short, warm follow-up — 80–100 words max.

Structure:
- Open with greeting (use contact name if known)
- Reference the audit report you already sent — ask if they had a chance to look at it
- Mention one specific finding as a gentle reminder of why it matters
- Offer a quick call to walk through it — low pressure, casual
- Sign off with sender name and company

Tone: friendly, not pushy. Like checking in with someone you've already spoken to.

── 4. DIRECT MESSAGE ───────────────────────────────────────────────────────────

2–3 sentences max. Casual and human.
Mention one specific finding from the audit if available.
End with a soft question — did the report land, or happy to chat.

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

Return ONLY valid JSON. No markdown. No code blocks. No explanation before or after.

{
  "call_script": "...",
  "email_subject": "...",
  "email_body": "...",
  "follow_up_body": "...",
  "dm_body": "..."
}
`

  const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite']

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
          },
        }),
      })

      const data = await response.json()
      const text =
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''

      if (!text) continue

      const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim()

      try {
        const parsed = JSON.parse(cleaned)
        if (parsed.call_script || parsed.email_body) {
          return {
            call_script: parsed.call_script || '',
            email_subject: parsed.email_subject || `Free website audit for ${businessName}`,
            email_body: parsed.email_body || '',
            follow_up_body: parsed.follow_up_body || '',
            dm_body: parsed.dm_body || '',
          }
        }
      } catch {
        console.warn(`⚠️ JSON parse failed for ${model}`)
      }
    } catch (err) {
      console.error(`Gemini model ${model} failed:`, err)
    }
  }

  return buildFallbackOutreach(lead, profile, clientContact)
}

export async function POST(req) {
  try {
    const userId = getUserIdFromRequest(req)
    const body = await req.json()
    const { lead, leadId, auditContext, profile, clientContact } = body

    console.log('📋 Outreach profile received:', {
      yourName: profile?.yourName,
      yourCompany: profile?.yourCompany,
      yourTitle: profile?.yourTitle,
      yourLocation: profile?.yourLocation,
    })

    let workingLead = null
    let finalLeadId = leadId || null

    if (leadId) {
      const { data: fetchedLead, error: fetchError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError) {
        console.error('Lead fetch error:', fetchError)
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }
      workingLead = fetchedLead
    } else if (lead) {
      const leadPayload = mapLeadToExistingLeadSchema(lead, userId)

      if (!leadPayload.domain) {
        return NextResponse.json(
          { error: 'Lead domain could not be determined' },
          { status: 400 }
        )
      }

      const { data: upsertedLead, error: upsertError } = await supabaseAdmin
        .from('leads')
        .upsert(
          { ...leadPayload, lead_status: 'New', notes: '' },
          { onConflict: 'user_id,domain', ignoreDuplicates: false }
        )
        .select('*')
        .maybeSingle()

      if (upsertError) {
        console.error('Lead upsert error:', upsertError)
        return NextResponse.json({ error: upsertError.message }, { status: 500 })
      }

      workingLead = upsertedLead
      finalLeadId = workingLead?.id
    }

    if (!workingLead || !finalLeadId) {
      return NextResponse.json({ error: 'Lead data is required' }, { status: 400 })
    }

    const generated = await generateWithGemini(
      workingLead,
      auditContext || null,
      profile || {},
      clientContact || {}
    )

    const outreachPayload = {
      user_id: userId,
      lead_id: finalLeadId,
      domain: workingLead.domain,
      source_type: auditContext ? 'audit_backed' : 'quick_scan',
      call_script: generated.call_script,
      email_subject: generated.email_subject,
      email_body: generated.email_body,
      follow_up_body: generated.follow_up_body,
      dm_body: generated.dm_body,
      updated_at: new Date().toISOString(),
    }

    const { data: savedRow, error: saveError } = await supabaseAdmin
      .from('outreach_generations')
      .upsert(outreachPayload, { onConflict: 'user_id,domain' })
      .select()
      .maybeSingle()

    if (saveError) {
      console.error('Outreach upsert error:', saveError)
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      outreach: savedRow || null,
      content: generated,
    })
  } catch (error) {
    console.error('POST /api/outreach fatal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate outreach' },
      { status: 500 }
    )
  }
}