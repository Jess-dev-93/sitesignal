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

export async function GET(req) {
  try {
    const userId = getUserIdFromRequest(req)
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const { data, error } = await supabaseAdmin
      .from('call_list')
      .select(`
        id,
        user_id,
        lead_id,
        queue_date,
        priority,
        status,
        note,
        follow_up_date,
        reminder_note,
        created_at,
        updated_at,
        leads (
          id,
          domain,
          business_name,
          website_url,
          display_url,
          snippet,
          industry,
          location,
          website_health_score,
          opportunity_score,
          lead_temp,
          lead_status,
          notes
        )
      `)
      .eq('user_id', userId)
      .eq('queue_date', date)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/call-list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = (data || []).map((item) => ({
      ...item,
      leads: item.leads
        ? {
            ...item.leads,
            quick_health_score: item.leads.website_health_score,
            lead_temperature: item.leads.lead_temp?.toLowerCase() || 'new',
            quick_issues: [],
            suburb: item.leads.location || '',
          }
        : null,
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET /api/call-list fatal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch call list' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const userId = getUserIdFromRequest(req)
    const body = await req.json()
    const { lead, queueDate, priority = 0 } = body

    if (!lead) {
      return NextResponse.json({ error: 'Lead is required' }, { status: 400 })
    }

    const leadPayload = mapLeadToExistingLeadSchema(lead, userId)

    if (!leadPayload.domain) {
      return NextResponse.json(
        { error: 'Lead domain could not be determined' },
        { status: 400 }
      )
    }

    const { data: existingLead, error: findError } = await supabaseAdmin
      .from('leads')
      .select(`
        id,
        domain,
        notes,
        lead_status,
        contact_name,
        contact_email,
        contact_phone,
        response_summary,
        follow_up_at,
        outreach_last_sent_at
      `)
      .eq('domain', leadPayload.domain)
      .eq('user_id', userId)
      .maybeSingle()

    if (findError) {
      console.error('Lead lookup error:', findError)
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    let savedLeadId = existingLead?.id || null

    if (existingLead) {
      const updatePayload = {
        ...leadPayload,
        notes: existingLead.notes ?? '',
        lead_status: existingLead.lead_status ?? 'New',
        contact_name: existingLead.contact_name ?? null,
        contact_email: existingLead.contact_email ?? null,
        contact_phone: existingLead.contact_phone ?? null,
        response_summary: existingLead.response_summary ?? null,
        follow_up_at: existingLead.follow_up_at ?? null,
        outreach_last_sent_at: existingLead.outreach_last_sent_at ?? null,
      }

      const { data: updatedRows, error: updateError } = await supabaseAdmin
        .from('leads')
        .update(updatePayload)
        .eq('id', existingLead.id)
        .select('id')

      if (updateError) {
        console.error('Lead update error:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      savedLeadId = updatedRows?.[0]?.id || existingLead.id
    } else {
      const insertPayload = {
        ...leadPayload,
        lead_status: 'New',
        notes: '',
      }

      const { data: insertedRows, error: insertError } = await supabaseAdmin
        .from('leads')
        .insert(insertPayload)
        .select('id')

      if (insertError) {
        console.error('Lead insert error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      savedLeadId = insertedRows?.[0]?.id
    }

    if (!savedLeadId) {
      return NextResponse.json({ error: 'Lead could not be saved' }, { status: 500 })
    }

    const queue_date = queueDate || new Date().toISOString().slice(0, 10)

    const { data: existingQueueItem, error: existingQueueError } = await supabaseAdmin
      .from('call_list')
      .select('id')
      .eq('user_id', userId)
      .eq('lead_id', savedLeadId)
      .eq('queue_date', queue_date)
      .maybeSingle()

    if (existingQueueError) {
      console.error('Existing queue lookup error:', existingQueueError)
      return NextResponse.json({ error: existingQueueError.message }, { status: 500 })
    }

    let queueItem = null

    if (existingQueueItem?.id) {
      const { data: updatedQueueRows, error: updateQueueError } = await supabaseAdmin
        .from('call_list')
        .update({
          priority,
          status: 'queued',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingQueueItem.id)
        .select()

      if (updateQueueError) {
        console.error('Queue update error:', updateQueueError)
        return NextResponse.json({ error: updateQueueError.message }, { status: 500 })
      }

      queueItem = updatedQueueRows?.[0] || null
    } else {
      const { data: insertedQueueRows, error: insertQueueError } = await supabaseAdmin
        .from('call_list')
        .insert({
          user_id: userId,
          lead_id: savedLeadId,
          queue_date,
          priority,
          status: 'queued',
          updated_at: new Date().toISOString(),
        })
        .select()

      if (insertQueueError) {
        console.error('Queue insert error:', insertQueueError)
        return NextResponse.json({ error: insertQueueError.message }, { status: 500 })
      }

      queueItem = insertedQueueRows?.[0] || null
    }

    return NextResponse.json({
      success: true,
      item: queueItem,
      leadId: savedLeadId,
    })
  } catch (error) {
    console.error('POST /api/call-list fatal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add to call list' },
      { status: 500 }
    )
  }
}