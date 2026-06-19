import Stripe from 'stripe'

// ── Stripe singleton (lazy — avoids build-time env requirement) ───────────────

let stripeInstance: Stripe | null = null

function initStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }

  return new Stripe(key, {
    apiVersion: '2023-10-16' as any,
  })
}

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = initStripe()
  }
  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})

// ── Plan definitions ──────────────────────────────────────────────────────────

export const STRIPE_PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
    name: 'Pro',
    amount: 4900,
    currency: 'aud',
  },
  agency: {
    priceId: process.env.STRIPE_AGENCY_PRICE_ID ?? '',
    name: 'Agency',
    amount: 14900,
    currency: 'aud',
  },
} as const

// ── Plan types + limits ───────────────────────────────────────────────────────

export type PlanKey = 'free' | 'pro' | 'agency'   // ✅ renamed starter → free to match DB

export const PLAN_LIMITS: Record<PlanKey, { audits: number; searches: number }> = {
  free:   { audits: 5,        searches: 3 },
  pro:    { audits: Infinity, searches: Infinity },
  agency: { audits: Infinity, searches: Infinity },
}