import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../lib/getUserId'
import { getUserPlan } from '../../../lib/getUserPlan'

export async function GET(req) {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json(
        {
          plan: 'starter',
          auditCount: 0,
          searchCount: 0,
          auditLimit: 5,
          searchLimit: 3,
          auditLimitReached: false,
          searchLimitReached: false,
        },
        { status: 200 }
      )
    }

    const planData = await getUserPlan(userId)

    return NextResponse.json({
      success: true,
      ...planData,
    })
  } catch (error) {
    console.error('user-plan GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get plan' },
      { status: 500 }
    )
  }
}