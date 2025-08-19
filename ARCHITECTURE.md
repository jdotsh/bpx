# 🏗️ BPMN Studio SaaS - Source Code Architecture

## **Directory Structure**
```
mvp/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group routes
│   │   ├── login/page.tsx        
│   │   ├── signup/page.tsx       
│   │   └── reset/page.tsx        
│   ├── (dashboard)/              # Protected routes
│   │   ├── projects/page.tsx     
│   │   ├── billing/page.tsx      
│   │   └── settings/page.tsx     
│   ├── studio/                   # BPMN Editor
│   │   └── [id]/page.tsx         # Dynamic diagram editor
│   ├── api/                      # API Routes
│   │   ├── trpc/[trpc]/route.ts  # tRPC handler
│   │   ├── webhooks/stripe/route.ts
│   │   └── auth/callback/route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── providers.tsx             # Client providers
│
├── components/                   # React Components
│   ├── bpmn/                     # BPMN components (existing)
│   ├── ui/                       # shadcn/ui components
│   ├── auth/                     # Auth components
│   │   ├── auth-form.tsx
│   │   ├── auth-guard.tsx
│   │   └── user-menu.tsx
│   ├── billing/                  # Billing components
│   │   ├── pricing-table.tsx
│   │   ├── subscription-card.tsx
│   │   └── usage-meter.tsx
│   └── dashboard/                # Dashboard components
│       ├── project-card.tsx
│       ├── diagram-list.tsx
│       └── stats-card.tsx
│
├── lib/                          # Core libraries
│   ├── db/                       # Database
│   │   ├── prisma.ts            # Prisma client
│   │   └── schema.prisma        # Database schema
│   ├── api/                      # API layer
│   │   ├── trpc.ts              # tRPC setup
│   │   └── routers/             # tRPC routers
│   │       ├── auth.ts
│   │       ├── diagrams.ts
│   │       ├── projects.ts
│   │       └── billing.ts
│   ├── services/                 # Business logic
│   │   ├── auth.service.ts      # Auth operations
│   │   ├── diagram.service.ts   # Diagram CRUD
│   │   ├── stripe.service.ts    # Payment processing
│   │   └── email.service.ts     # Email sending
│   ├── hooks/                    # React hooks
│   │   ├── use-auth.ts
│   │   ├── use-subscription.ts
│   │   └── use-autosave.ts
│   └── utils/                    # Utilities
│       ├── supabase.ts          # Supabase client
│       ├── stripe.ts            # Stripe config
│       └── resend.ts            # Email config
│
├── emails/                       # Email templates
│   ├── welcome.tsx              # React Email components
│   ├── receipt.tsx
│   └── diagram-shared.tsx
│
├── prisma/                       # Database
│   ├── schema.prisma            # Schema definition
│   └── migrations/              # Migration files
│
├── tests/                        # Test files
│   ├── e2e/                     # Playwright tests
│   │   ├── auth.spec.ts
│   │   ├── diagram.spec.ts
│   │   └── billing.spec.ts
│   └── unit/                    # Vitest tests
│       ├── services/
│       └── utils/
│
├── public/                       # Static assets
├── .env.example                  # Environment template
├── .env.local                    # Local environment
├── next.config.js               # Next.js config
├── tailwind.config.js           # Tailwind config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

## **Core Architecture Patterns**

### **1. API Layer (tRPC)**
```typescript
// lib/api/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server'
import { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(authMiddleware)

// lib/api/routers/diagrams.ts
export const diagramRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.diagram.findMany({
        where: { 
          projectId: input.projectId,
          ownerId: ctx.userId 
        }
      })
    }),
    
  create: protectedProcedure
    .input(DiagramSchema)
    .mutation(async ({ ctx, input }) => {
      // Check subscription limits
      const canCreate = await checkDiagramLimit(ctx.userId)
      if (!canCreate) throw new TRPCError({ code: 'FORBIDDEN' })
      
      return ctx.db.diagram.create({
        data: { ...input, ownerId: ctx.userId }
      })
    })
})
```

### **2. Service Layer**
```typescript
// lib/services/diagram.service.ts
export class DiagramService {
  async createDiagram(userId: string, data: DiagramInput) {
    // Business logic
    const user = await this.checkUserQuota(userId)
    const diagram = await this.saveDiagram(data)
    await this.createVersion(diagram)
    await this.sendNotification(user, diagram)
    return diagram
  }
  
  async autoSave(id: string, xml: string) {
    // Debounced save with conflict resolution
    const current = await this.getDiagram(id)
    if (current.version !== version) {
      return { conflict: true, latest: current }
    }
    return this.updateDiagram(id, xml)
  }
}
```

### **3. Database Schema (Prisma)**
```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  subscription  Subscription?
  projects      Project[]
  diagrams      Diagram[]
  createdAt     DateTime  @default(now())
}

model Subscription {
  id            String    @id @default(cuid())
  userId        String    @unique
  stripeId      String    @unique
  status        String    // active, canceled, past_due
  plan          String    // free, pro, enterprise
  currentPeriod DateTime
  user          User      @relation(fields: [userId], references: [id])
}

model Project {
  id          String    @id @default(cuid())
  name        String
  userId      String
  diagrams    Diagram[]
  user        User      @relation(fields: [userId], references: [id])
  createdAt   DateTime  @default(now())
}

model Diagram {
  id          String    @id @default(cuid())
  title       String
  bpmnXml     String    @db.Text
  projectId   String
  userId      String
  version     Int       @default(1)
  project     Project   @relation(fields: [projectId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
  versions    DiagramVersion[]
  updatedAt   DateTime  @updatedAt
  createdAt   DateTime  @default(now())
}

model DiagramVersion {
  id          String    @id @default(cuid())
  diagramId   String
  version     Int
  bpmnXml     String    @db.Text
  diagram     Diagram   @relation(fields: [diagramId], references: [id])
  createdAt   DateTime  @default(now())
}
```

### **4. Authentication Flow**
```typescript
// lib/services/auth.service.ts
export class AuthService {
  async signUp(email: string, password: string) {
    // 1. Create Supabase user
    const { user } = await supabase.auth.signUp({ email, password })
    
    // 2. Create database profile
    await prisma.user.create({
      data: { id: user.id, email }
    })
    
    // 3. Create free subscription
    await this.createFreeSubscription(user.id)
    
    // 4. Send welcome email
    await emailService.sendWelcome(email)
    
    return user
  }
}
```

### **5. Stripe Integration**
```typescript
// lib/services/stripe.service.ts
export class StripeService {
  async createCheckoutSession(userId: string, priceId: string) {
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${url}/billing?success=true`,
      cancel_url: `${url}/billing?canceled=true`,
      metadata: { userId }
    })
    return session
  }
  
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.created':
        await this.activateSubscription(event.data.object)
        break
      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object)
        break
    }
  }
}
```

### **6. Email Templates**
```typescript
// emails/welcome.tsx
import { Html, Button, Text } from '@react-email/components'

export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Text>Welcome to BPMN Studio, {name}!</Text>
      <Button href="https://app.bpmnstudio.com/studio">
        Create Your First Diagram
      </Button>
    </Html>
  )
}
```

### **7. React Hooks**
```typescript
// lib/hooks/use-subscription.ts
export function useSubscription() {
  const { data, isLoading } = trpc.billing.subscription.useQuery()
  
  const upgrade = trpc.billing.createCheckout.useMutation({
    onSuccess: (session) => {
      window.location.href = session.url
    }
  })
  
  return {
    subscription: data,
    isLoading,
    canCreateDiagram: data?.plan !== 'free' || data?.diagramCount < 3,
    upgrade: () => upgrade.mutate({ plan: 'pro' })
  }
}
```

## **Security & Performance**

### **Security Layers**
1. **Row Level Security (RLS)** - Database level
2. **tRPC Middleware** - API level  
3. **Auth Guards** - Component level
4. **Rate Limiting** - Request level
5. **Input Validation** - Zod schemas

### **Performance Optimizations**
1. **Code Splitting** - Dynamic imports
2. **Database Indexes** - Query optimization
3. **Redis Caching** - Session & frequently accessed data
4. **CDN** - Static assets
5. **Image Optimization** - Next.js Image component

## **Deployment Architecture**
```yaml
Production:
  Frontend: Vercel (Auto-scaling)
  Database: Supabase (Managed PostgreSQL)
  Storage: Supabase Storage (S3 compatible)
  Email: Resend (Transactional)
  Payments: Stripe (Webhooks)
  Monitoring: Sentry + Vercel Analytics
  
Environments:
  - Production: app.bpmnstudio.com
  - Staging: staging.bpmnstudio.com
  - Development: localhost:3000
```

This architecture is **production-ready**, **scalable**, and **maintainable** with clear separation of concerns and industry best practices.