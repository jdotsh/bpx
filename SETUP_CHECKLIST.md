# 🚀 Setup Checklist - Everything You Need

## **ACCOUNTS REQUIRED**

### **1. Supabase (Database + Auth)**
```yaml
Website: https://supabase.com
Cost: FREE tier (sufficient for MVP)
What you get:
  - 500MB database
  - 2GB storage  
  - 50K monthly active users
  - Built-in auth

Setup Steps:
1. Create account
2. Create new project
3. Copy connection strings from Settings > Database
4. Enable Email auth in Authentication > Providers
5. Optional: Enable Google OAuth
```

### **2. Stripe (Payments)**
```yaml
Website: https://stripe.com
Cost: FREE (2.9% + 30¢ per transaction)
What you get:
  - Payment processing
  - Subscription management
  - Customer portal
  - Webhooks

Setup Steps:
1. Create account
2. Get API keys from Developers > API keys
3. Create products in Products catalog:
   - Free Plan ($0)
   - Pro Plan ($29/month)
4. Set up webhook endpoint (after deployment)
```

### **3. OpenAI (AI Generation)**
```yaml
Website: https://platform.openai.com
Cost: Pay-as-you-go (~$0.02 per diagram)
What you get:
  - GPT-4 access
  - GPT-3.5 access
  - Embeddings API

Setup Steps:
1. Create account
2. Add payment method
3. Generate API key
4. Set usage limits ($50/month recommended)
```

### **4. Anthropic (AI Planning)**
```yaml
Website: https://console.anthropic.com
Cost: Pay-as-you-go (~$0.001 per plan)
What you get:
  - Claude 3 models
  - Better structured extraction

Setup Steps:
1. Request access (may take 1-2 days)
2. Add payment method
3. Generate API key
4. Set usage limits
```

### **5. Resend (Email)**
```yaml
Website: https://resend.com
Cost: FREE (100 emails/day)
What you get:
  - Transactional emails
  - React email templates
  - Delivery tracking

Setup Steps:
1. Create account
2. Verify domain (or use sandbox)
3. Generate API key
4. Create email templates
```

### **6. Vercel (Hosting)**
```yaml
Website: https://vercel.com
Cost: FREE (Hobby tier sufficient)
What you get:
  - Automatic deployments
  - Edge functions
  - Analytics
  - Custom domain

Setup Steps:
1. Create account (use GitHub login)
2. Import repository
3. Add environment variables
4. Deploy
```

### **7. GitHub (Code)**
```yaml
Website: https://github.com
Cost: FREE
What you get:
  - Version control
  - CI/CD with Actions
  - Issue tracking
  - Collaboration

Setup Steps:
1. Create repository
2. Push code
3. Connect to Vercel
4. Set up branch protection
```

## **OPTIONAL BUT RECOMMENDED**

### **8. Sentry (Error Tracking)**
```yaml
Website: https://sentry.io
Cost: FREE (10K events/month)
What you get:
  - Error tracking
  - Performance monitoring
  - User feedback

Setup Steps:
1. Create account
2. Create Next.js project
3. Get DSN
4. Install SDK
```

### **9. Pinecone (Vector Database)**
```yaml
Website: https://pinecone.io
Cost: FREE (1 index)
What you get:
  - Similarity search
  - Pattern matching
  - Learning system

Setup Steps:
1. Create account
2. Create index (1536 dimensions)
3. Get API key
4. Initialize in code
```

## **LOCAL SETUP COMMANDS**

```bash
# 1. Clone repository
git clone <your-repo>
cd mvp

# 2. Install dependencies
npm install

# 3. Create .env.local file
cp .env.example .env.local
# Edit .env.local with your keys

# 4. Setup database
npx prisma generate
npx prisma migrate dev

# 5. Run development server
npm run dev

# 6. Open browser
open http://localhost:3000
```

## **DEPLOYMENT COMMANDS**

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial MVP"
git push origin main

# 2. Deploy to Vercel
vercel

# 3. Add environment variables in Vercel dashboard
# Go to: Settings > Environment Variables
# Add all variables from .env.local

# 4. Set up Stripe webhook
# In Stripe Dashboard > Webhooks
# Add endpoint: https://your-app.vercel.app/api/webhooks/stripe
# Select events: checkout.session.completed, customer.subscription.*

# 5. Run database migrations
vercel env pull .env.production.local
npx prisma migrate deploy
```

## **TESTING CHECKLIST**

### **Local Testing**
```bash
# Test auth flow
- [ ] Sign up with email
- [ ] Sign in
- [ ] Reset password

# Test CRUD
- [ ] Create diagram
- [ ] Save diagram
- [ ] Load diagram
- [ ] Delete diagram

# Test payments (Stripe test mode)
- [ ] View pricing
- [ ] Start checkout
- [ ] Complete payment (use test card: 4242 4242 4242 4242)
- [ ] Verify subscription active

# Test AI generation
- [ ] Enter prompt
- [ ] Generate diagram
- [ ] View result
- [ ] Edit and save
```

### **Production Testing**
```bash
# Performance
- [ ] Lighthouse score >90
- [ ] Load time <2s
- [ ] No memory leaks

# Security
- [ ] HTTPS working
- [ ] Auth required for protected routes
- [ ] Rate limiting active
- [ ] Input validation working

# Monitoring
- [ ] Errors appearing in Sentry
- [ ] Analytics tracking events
- [ ] Logs accessible
```

## **COST BREAKDOWN**

### **Monthly Costs (Estimated)**
```yaml
Fixed Costs:
  Vercel: $0 (Hobby)
  Supabase: $0 (Free tier)
  GitHub: $0
  Sentry: $0 (Free tier)
  TOTAL FIXED: $0/month

Variable Costs (per 1000 users):
  OpenAI: ~$50 (2500 generations)
  Anthropic: ~$5 (5000 plans)
  Resend: $0 (under 3000 emails)
  Stripe: ~$30 (fees on $1000 revenue)
  TOTAL VARIABLE: ~$85/1000 users

Revenue (per 1000 users):
  10% conversion = 100 paying users
  100 × $29 = $2,900/month
  
Profit: $2,900 - $85 = $2,815/month
```

## **QUICK START (5 MINUTES)**

If you want to start RIGHT NOW with minimal setup:

```bash
# 1. Use these test services (no account needed)
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc.supabase.co  # Use your project
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Use your key
DATABASE_URL=postgresql://postgres:password@db.xyzabc.supabase.co:5432/postgres

# 2. Skip these initially
# - Stripe (use mock payments)
# - AI APIs (use mock responses)
# - Email (console.log instead)

# 3. Deploy to Vercel
npm run build
vercel --prod

# 4. You now have a working app!
```

## **PROBLEMS YOU MIGHT HIT**

### **Problem 1: Prisma Generate Fails**
```bash
# Solution
npm install -D @prisma/client
npx prisma generate
```

### **Problem 2: Build Fails**
```bash
# Solution
rm -rf .next node_modules
npm install
npm run build
```

### **Problem 3: Database Connection Fails**
```bash
# Solution - Check DATABASE_URL format
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

### **Problem 4: Stripe Webhook Fails**
```bash
# Solution - Get webhook secret after creating endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret
```

## **SUPPORT RESOURCES**

- **Supabase Discord**: https://discord.supabase.com
- **Vercel Discord**: https://vercel.com/discord  
- **Stripe Support**: https://support.stripe.com
- **Stack Overflow**: Tag with [nextjs] [supabase] [trpc]

## **YOU'RE READY! 🚀**

With these accounts and keys, you can:
1. Run the app locally
2. Deploy to production
3. Accept payments
4. Generate AI diagrams
5. Send emails
6. Track errors

Total setup time: ~2 hours
Total cost to start: $0
Time to first customer: Day 1