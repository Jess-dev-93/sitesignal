import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function POST(request) {
  try {
    const body = await request.json()
    const { domains } = body

    if (!Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json({
        success: true,
        leads: [],
      })
    }

    const cleanedDomains = domains
      .map((d) => String(d || '').trim().toLowerCase())
      .filter(Boolean)

    if (cleanedDomains.length === 0) {
      return NextResponse.json({
        success: true,
        leads: [],
      })
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .select(`
        id,
        domain,
        business_name,
        website_url,
        lead_status,
        notes,
        updated_at
      `)
      .in('domain', cleanedDomains)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      leads: data || [],
    })
  } catch (error) {
    console.error('❌ leads-by-domains error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads by domains' },
      { status: 500 }
    )
  }
}