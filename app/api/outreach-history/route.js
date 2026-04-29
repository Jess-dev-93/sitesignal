import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function POST(request) {
  try {
    const body = await request.json()
    const { domains } = body

    if (!Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
      })
    }

    const cleanedDomains = domains
      .map((d) => String(d || '').trim().toLowerCase())
      .filter(Boolean)

    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, domain')
      .in('domain', cleanedDomains)

    if (leadsError) {
      throw new Error(leadsError.message)
    }

    const leadIds = (leads || []).map((l) => l.id).filter(Boolean)

    if (!leadIds.length) {
      return NextResponse.json({
        success: true,
        items: [],
      })
    }

    const { data, error } = await supabaseAdmin
      .from('outreach_generations')
      .select(`
        id,
        lead_id,
        source_type,
        call_script,
        email_subject,
        email_body,
        follow_up_body,
        dm_body,
        created_at
      `)
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    const leadIdToDomain = Object.fromEntries((leads || []).map((l) => [l.id, l.domain]))

    const items = (data || []).map((row) => ({
      ...row,
      domain: leadIdToDomain[row.lead_id] || '',
    }))

    return NextResponse.json({
      success: true,
      items,
    })
  } catch (error) {
    console.error('❌ outreach-history error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch outreach history' },
      { status: 500 }
    )
  }
}