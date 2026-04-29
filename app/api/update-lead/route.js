import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function POST(request) {
  try {
    const body = await request.json()
    const { domain, notes, leadStatus } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    const updatePayload = {
      updated_at: new Date().toISOString(),
    }

    if (typeof notes === 'string') {
      updatePayload.notes = notes
    }

    if (typeof leadStatus === 'string') {
      updatePayload.lead_status = leadStatus
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updatePayload)
      .eq('domain', domain)
      .select(`
        id,
        domain,
        lead_status,
        notes,
        updated_at
      `)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully',
      lead: data || null,
    })
  } catch (error) {
    console.error('❌ Update lead error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update lead' },
      { status: 500 }
    )
  }
}