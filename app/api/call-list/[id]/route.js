import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { getUserIdFromRequest } from '../../../../lib/getUserId'

export async function PATCH(req, { params }) {
  try {
    const userId = getUserIdFromRequest(req)
    const { id } = params
    const body = await req.json()

    const updatePayload = {
      updated_at: new Date().toISOString(),
    }

    if (body.status !== undefined) updatePayload.status = body.status
    if (body.priority !== undefined) updatePayload.priority = body.priority
    if (body.note !== undefined) updatePayload.note = body.note
    if (body.follow_up_date !== undefined) {
      updatePayload.follow_up_date = body.follow_up_date
    }
    if (body.reminder_note !== undefined) {
      updatePayload.reminder_note = body.reminder_note
    }

    const { data, error } = await supabaseAdmin
      .from('call_list')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('PATCH /api/call-list/[id] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      item: data?.[0] || null,
    })
  } catch (error) {
    console.error('PATCH /api/call-list/[id] fatal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update call list item' },
      { status: 500 }
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = getUserIdFromRequest(req)
    const { id } = params

    const { error } = await supabaseAdmin
      .from('call_list')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('DELETE /api/call-list/[id] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/call-list/[id] fatal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete call list item' },
      { status: 500 }
    )
  }
}