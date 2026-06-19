import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../lib/getUserId'
import { getUserPlan } from '../../../lib/getUserPlan'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { formatPipelineValue, parseEstimatedValue } from '../../../lib/parseEstimatedValue'

function getMonthStartIso() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

export async function GET(req) {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json({
        plan: 'starter',
        auditCount: 0,
        searchCount: 0,
        outreachCount: 0,
        pipelineValue: 0,
        pipelineValueLabel: '$0',
      })
    }

    const monthStart = getMonthStartIso()
    const planData = await getUserPlan(userId)

    const [outreachResult, pipelineResult] = await Promise.all([
      supabaseAdmin
        .from('outreach_generations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', monthStart),

      supabaseAdmin
        .from('call_list')
        .select('leads ( estimated_value )')
        .eq('user_id', userId),
    ])

    const outreachCount = outreachResult.count ?? 0

    const pipelineValue = (pipelineResult.data || []).reduce((total, item) => {
      const value = item.leads?.estimated_value
      return total + parseEstimatedValue(value)
    }, 0)

    return NextResponse.json({
      success: true,
      plan: planData.plan,
      auditCount: planData.auditCount,
      searchCount: planData.searchCount,
      outreachCount,
      pipelineValue,
      pipelineValueLabel: formatPipelineValue(pipelineValue),
    })
  } catch (error) {
    console.error('dashboard-stats GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load dashboard stats' },
      { status: 500 }
    )
  }
}
