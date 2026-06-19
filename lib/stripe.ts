import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

// ── Stripe singleton ──────────────────────────────────────────────────────────
// apiVersion is cast to satisfy the strict Stripe SDK union type.
// Update this string if you upgrade the stripe package.

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
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