import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { getUserIdFromRequest } from '../../../lib/getUserId'

// GET: fetch recent search history for this user
export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

    const { data, error } = await supabaseAdmin
      .from('lead_search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ success: true, history: data || [] })
  } catch (err) {
    console.error('❌ lead-search-history GET error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load search history' },
      { status: 500 }
    )
  }
}

// POST: save a search history entry for this user
export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const payload = {
      user_id: userId,
      query: body.query || '',
      location: body.location || '',
      total_found: body.totalFound || 0,
      hot_leads: body.hotLeads || 0,
      warm_leads: body.warmLeads || 0,
      leads: body.leads || [],
      stats: body.stats || null,
      message: body.message || '',
    }

    if (!payload.query.trim()) {
      return NextResponse.json({ success: false, error: 'Missing query' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('lead_search_history')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, entry: data })
  } catch (err) {
    console.error('❌ lead-search-history POST error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save search history' },
      { status: 500 }
    )
  }
}

// DELETE: clear history for this user
export async function DELETE(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('lead_search_history')
      .delete()
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ lead-search-history DELETE error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to clear search history' },
      { status: 500 }
    )
  }
}