import { supabaseAdmin } from './supabaseAdmin'
import { PLAN_LIMITS, PlanKey } from './stripe'

export type UserPlan = {
  plan: PlanKey
  status: string
  auditCount: number
  searchCount: number
  auditLimit: number
  searchLimit: number
  auditLimitReached: boolean
  searchLimitReached: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const month = getCurrentMonth()

  const [planResult, usageResult] = await Promise.all([
    supabaseAdmin
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),

    supabaseAdmin
      .from('usage_counts')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle(),
  ])

  const plan = (planResult.data?.plan || 'starter') as PlanKey
  const status = planResult.data?.status || 'active'
  const cancelAtPeriodEnd = planResult.data?.cancel_at_period_end || false
  const currentPeriodEnd = planResult.data?.current_period_end || null

  const auditCount = usageResult.data?.audit_count || 0
  const searchCount = usageResult.data?.search_count || 0

  const limits = PLAN_LIMITS[plan]
  const auditLimit = limits.audits === Infinity ? 999999 : limits.audits
  const searchLimit = limits.searches === Infinity ? 999999 : limits.searches

  return {
    plan,
    status,
    auditCount,
    searchCount,
    auditLimit,
    searchLimit,
    auditLimitReached: limits.audits !== Infinity && auditCount >= limits.audits,
    searchLimitReached: limits.searches !== Infinity && searchCount >= limits.searches,
    cancelAtPeriodEnd,
    currentPeriodEnd,
  }
}

export async function incrementUsage(
  userId: string,
  type: 'audit' | 'search'
): Promise<void> {
  const month = getCurrentMonth()

  const { data: existing } = await supabaseAdmin
    .from('usage_counts')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()

  if (existing) {
    await supabaseAdmin
      .from('usage_counts')
      .update({
        audit_count: type === 'audit' ? existing.audit_count + 1 : existing.audit_count,
        search_count: type === 'search' ? existing.search_count + 1 : existing.search_count,
      })
      .eq('id', existing.id)
  } else {
    await supabaseAdmin
      .from('usage_counts')
      .insert({
        user_id: userId,
        month,
        audit_count: type === 'audit' ? 1 : 0,
        search_count: type === 'search' ? 1 : 0,
      })
  }
}