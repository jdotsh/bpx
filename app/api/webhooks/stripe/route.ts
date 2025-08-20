import { NextRequest, NextResponse } from 'next/server'

import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { createServerClient } from '@/lib/auth/server'

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  // Return early if Stripe is not configured
  if (!isStripeConfigured()) {
    return NextResponse.json({ 
      error: 'Stripe is not configured. Webhooks are disabled.' 
    }, { status: 501 })
  }

  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const supabase = createServerClient()
  
  // Get the customer to find the user
  const customer = await stripe.customers.retrieve(customerId)
  
  if (customer.deleted) {
    console.error('Customer was deleted')
    return
  }

  const userEmail = customer.email
  if (!userEmail) {
    console.error('No email found for customer')
    return
  }

  // Find user by email and update their subscription
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .single()

  if (error || !profile) {
    console.error('No profile found for email:', userEmail)
    return
  }

  // Map Stripe price ID to our plan
  const plan = mapPriceIdToPlan(subscription.items.data[0]?.price.id)
  
  // Type assertion for Stripe properties that TypeScript doesn't recognize
  const currentPeriodEnd = (subscription as any).current_period_end as number
  
  // Upsert subscription
  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert({
      profile_id: profile.id,
      stripe_customer_id: customerId,
      stripe_sub_id: subscription.id,
      plan,
      status: mapStripeStatus(subscription.status),
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString()
    }, {
      onConflict: 'profile_id'
    })

  if (upsertError) {
    console.error('Failed to upsert subscription:', upsertError)
    return
  }

  console.log(`Subscription created for user ${userEmail}, plan: ${plan}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const plan = mapPriceIdToPlan(subscription.items.data[0]?.price.id)
  const currentPeriodEnd = (subscription as any).current_period_end as number
  const supabase = createServerClient()
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan,
      status: mapStripeStatus(subscription.status),
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString()
    })
    .eq('stripe_sub_id', subscription.id)

  if (error) {
    console.error('Failed to update subscription:', error)
    return
  }

  console.log(`Subscription updated: ${subscription.id}, plan: ${plan}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createServerClient()
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan: 'FREE',
      status: 'CANCELED',
      current_period_end: new Date().toISOString()
    })
    .eq('stripe_sub_id', subscription.id)

  if (error) {
    console.error('Failed to cancel subscription:', error)
    return
  }

  console.log(`Subscription canceled: ${subscription.id}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | null
  
  if (subscriptionId) {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'ACTIVE'
      })
      .eq('stripe_sub_id', subscriptionId)

    if (error) {
      console.error('Failed to update payment status:', error)
    }
  }

  console.log(`Payment succeeded for invoice: ${invoice.id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | null
  
  if (subscriptionId) {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'PAST_DUE'
      })
      .eq('stripe_sub_id', subscriptionId)

    if (error) {
      console.error('Failed to update payment status:', error)
    }
  }

  console.log(`Payment failed for invoice: ${invoice.id}`)
}

function mapPriceIdToPlan(priceId?: string): 'FREE' | 'PRO' | 'ENTERPRISE' {
  switch (priceId) {
    case 'price_pro_monthly':
    case 'price_pro_yearly':
      return 'PRO'
    case 'price_enterprise':
      return 'ENTERPRISE'
    default:
      return 'FREE'
  }
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'PAUSED' {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'canceled':
    case 'incomplete_expired':
    case 'unpaid':
      return 'CANCELED'
    case 'past_due':
      return 'PAST_DUE'
    case 'paused':
      return 'PAUSED'
    default:
      return 'ACTIVE'
  }
}

// Add GET method for health checks
export async function GET() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ 
      status: 'disabled',
      message: 'Stripe is not configured'
    })
  }
  
  return NextResponse.json({ 
    status: 'ready',
    message: 'Stripe webhook endpoint is ready'
  })
}
