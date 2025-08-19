# 🚀 BPMN Studio SaaS - 5-Day Delivery Plan

## **DAY 1: Database & Auth Setup**
```bash
# 1. Create Supabase project
# 2. Initialize Prisma
npx prisma init

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Setup auth flows
```

### Database Schema
- `users` → Supabase Auth
- `profiles` → User metadata
- `subscriptions` → Stripe subscriptions
- `projects` → User projects
- `diagrams` → BPMN diagrams
- `diagram_versions` → Version history

## **DAY 2: API Layer (tRPC)**
```typescript
// Core routers
- auth.router.ts      // Sign up, login, logout
- diagrams.router.ts  // CRUD operations
- billing.router.ts   // Stripe integration
- projects.router.ts  // Project management
```

## **DAY 3: Stripe Integration**
```typescript
// Pricing tiers
const PLANS = {
  FREE: {
    price: 0,
    diagrams: 3,
    features: ['Basic editor', 'Export XML']
  },
  PRO: {
    price: 29,
    diagrams: 'unlimited',
    features: ['All features', 'Version history', 'Collaboration']
  },
  ENTERPRISE: {
    price: 'custom',
    diagrams: 'unlimited',
    features: ['Everything', 'SSO', 'Priority support']
  }
}
```

### Stripe Webhooks
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

## **DAY 4: Email & Notifications**
```typescript
// Email templates with Resend
- Welcome email
- Payment receipt
- Diagram shared
- Trial expiring
- Password reset
```

## **DAY 5: Testing & Deployment**

### E2E Tests (Playwright)
```typescript
test('user can create and save diagram', async ({ page }) => {
  await page.goto('/studio')
  await page.click('[data-testid="new-diagram"]')
  await page.fill('[name="title"]', 'Test Diagram')
  await page.click('[data-testid="save"]')
  await expect(page.locator('.toast')).toContainText('Saved')
})

test('subscription flow works', async ({ page }) => {
  await page.goto('/pricing')
  await page.click('[data-plan="pro"]')
  // Stripe checkout...
})
```

### Deployment Checklist
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Stripe webhooks configured
- [ ] Resend domain verified
- [ ] Sentry error tracking
- [ ] Vercel deployment
- [ ] Custom domain configured

## **POST-LAUNCH (Week 2)**
- Analytics (PostHog/Mixpanel)
- A/B testing framework
- Customer support (Crisp/Intercom)
- Documentation site
- API rate limiting
- CDN optimization

## **METRICS TO TRACK**
- Signup → Activation rate
- Free → Paid conversion
- Monthly Recurring Revenue (MRR)
- Churn rate
- Feature adoption
- Performance metrics (Core Web Vitals)