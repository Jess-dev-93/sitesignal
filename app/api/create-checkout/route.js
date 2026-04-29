import { NextResponse } from 'next/server'
import { stripe, STRIPE_PLANS } from '../../../lib/stripe'
import { getUserIdFromRequest } from '../../../lib/getUserId'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function POST(req) {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, successUrl, cancelUrl } = body

    if (!plan || !STRIPE_PLANS[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "pro" or "agency"' },
        { status: 400 }
      )
    }

    // Get user email from Supabase
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const email = userData.user.email

    // Check if user already has a Stripe customer
    const { data: planData } = await supabaseAdmin
      .from('user_plans')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    let customerId = planData?.stripe_customer_id

    // Create Stripe customer if they don't have one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      })
      customerId = customer.id

      await supabaseAdmin
        .from('user_plans')
        .upsert({
          user_id: userId,
          plan: 'starter',
          status: 'active',
          stripe_customer_id: customerId,
        })
        .eq('user_id', userId)
    }

    const selectedPlan = STRIPE_PLANS[plan]

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/app?upgraded=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?cancelled=true`,
      metadata: {
        userId,
        plan,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}