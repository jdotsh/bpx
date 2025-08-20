import Stripe from 'stripe'

// Make Stripe optional - only initialize if keys are provided
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      // Use the latest stable Stripe API version
      apiVersion: '2025-07-30.basil',
      typescript: true,
    })
  : null as any

// Helper to check if Stripe is configured
export const isStripeConfigured = () => !!stripeSecretKey

// Pricing configuration
export const PRICING_PLANS = {
  FREE: {
    name: 'Free',
    priceId: null,
    price: 0,
    features: [
      '3 BPMN diagrams',
      '1 project',
      'Basic editor',
      'Export to XML',
      'Community support'
    ],
    limits: {
      diagrams: 3,
      projects: 1,
      aiGenerations: 5,
      storage: 100 * 1024 * 1024, // 100MB
    }
  },
  PRO: {
    name: 'Pro',
    priceId: 'price_pro_monthly', // You'll need to create this in Stripe Dashboard
    price: 29,
    features: [
      'Unlimited diagrams',
      'Unlimited projects',
      'AI-powered generation',
      'Version history',
      'Priority support',
      'Export to PDF/PNG',
      'Collaboration features'
    ],
    limits: {
      diagrams: -1, // unlimited
      projects: -1,
      aiGenerations: 500,
      storage: 10 * 1024 * 1024 * 1024, // 10GB
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: 'price_enterprise',
    price: 'Custom',
    features: [
      'Everything in Pro',
      'Unlimited AI generations',
      'SSO/SAML',
      'Custom integrations',
      'SLA',
      'Dedicated support',
      'On-premise option'
    ],
    limits: {
      diagrams: -1,
      projects: -1,
      aiGenerations: -1,
      storage: -1,
    }
  }
}