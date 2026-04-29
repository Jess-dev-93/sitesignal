import { NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(req) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json(
      { error: `Webhook error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log('Stripe webhook received:', event.type)

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (!userId || !plan) break

        const subscriptionId = session.subscription

        let subscription = null
        if (subscriptionId) {
          subscription = await stripe.subscriptions.retrieve(subscriptionId)
        }

        await supabaseAdmin
          .from('user_plans')
          .upsert({
            user_id: userId,
            plan,
            status: 'active',
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscriptionId || null,
            stripe_price_id: subscription?.items?.data?.[0]?.price?.id || null,
            current_period_start: subscription?.current_period_start
              ? new Date(subscription.current_period_start * 1000).toISOString()
              : null,
            current_period_end: subscription?.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        console.log(`Plan upgraded: userId=${userId} plan=${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata?.userId

        if (!userId) break

        const plan = subscription.metadata?.plan || 'starter'
        const status = subscription.status

        await supabaseAdmin
          .from('user_plans')
          .update({
            plan: status === 'active' || status === 'trialing' ? plan : 'starter',
            status,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items?.data?.[0]?.price?.id || null,
            current_period_start: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000).toISOString()
              : null,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        console.log(`Subscription updated: userId=${userId} status=${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata?.userId

        if (!userId) break

        await supabaseAdmin
          .from('user_plans')
          .update({
            plan: 'starter',
            status: 'cancelled',
            stripe_subscription_id: null,
            stripe_price_id: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        console.log(`Subscription cancelled: userId=${userId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer

        const { data: planData } = await supabaseAdmin
          .from('user_plans')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (planData?.user_id) {
          await supabaseAdmin
            .from('user_plans')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', planData.user_id)

          console.log(`Payment failed: userId=${planData.user_id}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}