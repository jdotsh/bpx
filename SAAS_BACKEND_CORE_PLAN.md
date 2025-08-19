# 🎯 SaaS Backend Core Planning - Complete Implementation Guide

## **PHASE 1: FOUNDATION (Day 1-2)**

### **1.1 Database Architecture**
```sql
-- Core Tables Priority Order
1. profiles (users)     → Authentication base
2. subscriptions        → Monetization 
3. projects            → Organization unit
4. diagrams            → Core product value
5. diagram_versions    → Version control
```

### **1.2 Authentication Flow**
```typescript
// Priority Implementation Order
1. Sign Up → Create profile + free subscription
2. Sign In → JWT token + session
3. Password Reset → Email flow
4. OAuth → Google/GitHub (optional)
```

### **1.3 Core API Endpoints**
```typescript
// MUST HAVE - Week 1
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/me

GET    /api/diagrams          // List
POST   /api/diagrams          // Create
GET    /api/diagrams/:id      // Get
PUT    /api/diagrams/:id      // Update
DELETE /api/diagrams/:id      // Soft delete

POST   /api/diagrams/:id/save // Auto-save endpoint
```

## **PHASE 2: BUSINESS LOGIC (Day 3-4)**

### **2.1 Subscription Management**
```typescript
interface SubscriptionLimits {
  FREE: {
    diagrams: 3,
    projects: 1,
    storage: '100MB',
    collaborators: 0,
    versions: 5
  },
  PRO: {
    diagrams: 'unlimited',
    projects: 'unlimited',
    storage: '10GB',
    collaborators: 10,
    versions: 'unlimited'
  },
  ENTERPRISE: {
    everything: 'unlimited',
    sso: true,
    audit: true,
    support: 'priority'
  }
}

// Enforcement Points
class QuotaService {
  async canCreateDiagram(userId: string): Promise<boolean>
  async canAddCollaborator(projectId: string): Promise<boolean>
  async getStorageUsed(userId: string): Promise<number>
  async enforceQuota(userId: string, action: Action): Promise<void>
}
```

### **2.2 Core Services Architecture**
```typescript
// services/
├── auth.service.ts        // Authentication & sessions
├── diagram.service.ts     // BPMN operations
├── subscription.service.ts // Billing & limits
├── project.service.ts     // Project management
├── email.service.ts       // Transactional emails
└── storage.service.ts     // File uploads

// Each service follows this pattern:
export class DiagramService {
  // CREATE
  async createDiagram(userId: string, data: CreateDiagramDTO) {
    // 1. Check quota
    await this.quotaService.enforceQuota(userId, 'CREATE_DIAGRAM')
    
    // 2. Validate input
    const validated = DiagramSchema.parse(data)
    
    // 3. Business logic
    const diagram = await this.repository.create({
      ...validated,
      ownerId: userId,
      version: 1
    })
    
    // 4. Side effects
    await this.eventBus.publish('diagram.created', diagram)
    
    // 5. Return result
    return diagram
  }
  
  // READ with pagination
  async listDiagrams(userId: string, options: ListOptions) {
    return this.repository.findMany({
      where: { ownerId: userId },
      take: options.limit,
      skip: options.offset,
      orderBy: { updatedAt: 'desc' }
    })
  }
  
  // UPDATE with versioning
  async updateDiagram(userId: string, id: string, data: UpdateDiagramDTO) {
    // 1. Check ownership
    const diagram = await this.repository.findOne({ id, ownerId: userId })
    if (!diagram) throw new ForbiddenError()
    
    // 2. Version check (optimistic locking)
    if (data.version !== diagram.version) {
      throw new ConflictError('Version mismatch')
    }
    
    // 3. Update with version increment
    const updated = await this.repository.update(id, {
      ...data,
      version: diagram.version + 1
    })
    
    // 4. Create version snapshot
    await this.versionService.createSnapshot(updated)
    
    return updated
  }
  
  // DELETE (soft delete)
  async deleteDiagram(userId: string, id: string) {
    await this.repository.update(id, {
      deletedAt: new Date()
    })
  }
}
```

## **PHASE 3: PAYMENT INTEGRATION (Day 5)**

### **3.1 Stripe Setup**
```typescript
// 1. Products & Prices
const STRIPE_PRODUCTS = {
  pro_monthly: {
    priceId: 'price_xxx',
    amount: 2900, // $29.00
    interval: 'month'
  },
  pro_yearly: {
    priceId: 'price_yyy',
    amount: 29900, // $299.00
    interval: 'year'
  }
}

// 2. Webhook Events to Handle
const CRITICAL_WEBHOOKS = [
  'checkout.session.completed',     // New subscription
  'customer.subscription.updated',  // Plan change
  'customer.subscription.deleted',  // Cancellation
  'invoice.payment_failed',        // Payment issue
]

// 3. Subscription Lifecycle
class StripeService {
  async createCheckoutSession(userId: string, priceId: string) {
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      metadata: { userId },
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${APP_URL}/billing?success=true`,
      cancel_url: `${APP_URL}/billing`,
    })
    return session.url
  }
  
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        await this.activateSubscription(
          session.metadata.userId,
          session.subscription
        )
        break
        
      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object.id)
        break
    }
  }
}
```

## **PHASE 4: CRITICAL BACKEND FLOWS**

### **4.1 Auto-Save Flow**
```typescript
// Debounced auto-save with conflict resolution
class AutoSaveService {
  private saveQueue = new Map<string, NodeJS.Timeout>()
  
  async queueSave(diagramId: string, content: string, version: number) {
    // Clear existing timer
    if (this.saveQueue.has(diagramId)) {
      clearTimeout(this.saveQueue.get(diagramId))
    }
    
    // Queue new save (1 second debounce)
    const timer = setTimeout(async () => {
      try {
        await this.save(diagramId, content, version)
        this.saveQueue.delete(diagramId)
      } catch (error) {
        if (error.code === 'VERSION_CONFLICT') {
          // Return latest version to client
          return { conflict: true, latest: await this.getLatest(diagramId) }
        }
      }
    }, 1000)
    
    this.saveQueue.set(diagramId, timer)
  }
}
```

### **4.2 Permission System**
```typescript
enum Permission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin'
}

class PermissionService {
  async can(userId: string, resource: Resource, action: Permission): boolean {
    // Owner has all permissions
    if (resource.ownerId === userId) return true
    
    // Check collaborator permissions
    const collab = await this.getCollaborator(resource.id, userId)
    if (!collab) return false
    
    const permissions = {
      viewer: [Permission.VIEW],
      editor: [Permission.VIEW, Permission.EDIT],
      admin: [Permission.VIEW, Permission.EDIT, Permission.DELETE, Permission.SHARE]
    }
    
    return permissions[collab.role].includes(action)
  }
}
```

### **4.3 Email Notifications**
```typescript
class EmailService {
  // Transactional emails (immediate)
  async sendWelcome(user: User) {
    await resend.emails.send({
      from: 'BPMN Studio <noreply@bpmnstudio.com>',
      to: user.email,
      subject: 'Welcome to BPMN Studio',
      react: WelcomeEmail({ name: user.name })
    })
  }
  
  // Batched notifications (queued)
  async queueDigest(userId: string, events: Event[]) {
    await this.queue.add('digest', { userId, events }, {
      delay: ms('1 hour'),
      attempts: 3
    })
  }
}
```

## **PHASE 5: PERFORMANCE & SCALE**

### **5.1 Caching Strategy**
```typescript
class CacheService {
  // Cache layers
  1. Browser Cache    → Static assets (1 year)
  2. CDN Cache       → Public content (1 hour)
  3. Redis Cache     → Session data (15 min)
  4. Database Cache  → Query results (5 min)
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key)
    if (cached) {
      await redis.expire(key, 300) // Refresh TTL
      return JSON.parse(cached)
    }
    return null
  }
  
  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value))
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length) await redis.del(...keys)
  }
}
```

### **5.2 Database Optimization**
```sql
-- Critical Indexes
CREATE INDEX idx_diagrams_owner_updated ON diagrams(owner_id, updated_at DESC);
CREATE INDEX idx_diagrams_project ON diagrams(project_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_versions_diagram ON diagram_versions(diagram_id, version DESC);

-- Materialized Views for Analytics
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
  u.id,
  COUNT(DISTINCT d.id) as diagram_count,
  COUNT(DISTINCT p.id) as project_count,
  SUM(LENGTH(d.bpmn_xml)) as storage_used
FROM users u
LEFT JOIN diagrams d ON u.id = d.owner_id
LEFT JOIN projects p ON u.id = p.owner_id
GROUP BY u.id;

-- Refresh every hour
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
END;
$$ LANGUAGE plpgsql;
```

## **PHASE 6: MONITORING & OBSERVABILITY**

### **6.1 Key Metrics to Track**
```typescript
interface Metrics {
  // Business Metrics
  'user.signup': number
  'user.activation': number  // Created first diagram
  'subscription.created': number
  'subscription.churned': number
  'diagram.created': number
  'diagram.saved': number
  
  // Performance Metrics
  'api.latency': Histogram
  'db.query.time': Histogram
  'cache.hit.rate': Gauge
  
  // Error Metrics
  'error.rate': Counter
  'error.payment': Counter
  'error.quota': Counter
}

class MetricsService {
  track(metric: keyof Metrics, value: number, tags?: Record<string, string>) {
    // Send to monitoring service
    statsd.increment(metric, value, tags)
    
    // Log for debugging
    logger.info(`Metric: ${metric}`, { value, tags })
  }
}
```

### **6.2 Health Checks**
```typescript
// /api/health endpoints
GET /api/health/live     → Is service running?
GET /api/health/ready    → Can serve traffic?
GET /api/health/startup  → Initial checks passed?

class HealthService {
  async checkLive(): Promise<HealthStatus> {
    return { status: 'ok', timestamp: Date.now() }
  }
  
  async checkReady(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStripe(),
      this.checkEmail()
    ])
    
    const allHealthy = checks.every(c => c.healthy)
    return {
      status: allHealthy ? 'ok' : 'degraded',
      checks
    }
  }
}
```

## **CRITICAL SUCCESS FACTORS**

### **Week 1 Priorities**
1. ✅ Auth working end-to-end
2. ✅ CRUD operations for diagrams
3. ✅ Auto-save with conflict resolution
4. ✅ Basic quota enforcement
5. ✅ Deployment pipeline

### **Week 2 Priorities**
1. 💳 Stripe integration
2. 📧 Email notifications
3. 👥 Collaboration features
4. 📊 Analytics dashboard
5. 🚀 Performance optimization

### **Technical Debt to Avoid**
```typescript
// DON'T
❌ Hardcode configuration
❌ Skip input validation
❌ Ignore error handling
❌ Mix concerns in services
❌ Bypass permission checks

// DO
✅ Use environment variables
✅ Validate with Zod schemas
✅ Handle errors gracefully
✅ Single responsibility principle
✅ Check permissions everywhere
```

## **DEPLOYMENT READINESS CHECKLIST**

```yaml
Database:
  ✅ Migrations ready
  ✅ Indexes created
  ✅ RLS policies set
  ✅ Backup configured

API:
  ✅ Rate limiting
  ✅ CORS configured
  ✅ Error handling
  ✅ Request validation

Security:
  ✅ JWT tokens
  ✅ HTTPS only
  ✅ SQL injection protected
  ✅ XSS protected

Monitoring:
  ✅ Error tracking (Sentry)
  ✅ APM (Vercel Analytics)
  ✅ Logs (structured)
  ✅ Alerts configured

Scale:
  ✅ Database pooling
  ✅ Caching layer
  ✅ CDN configured
  ✅ Auto-scaling enabled
```

This is your **complete backend implementation plan** - follow this and you'll have a production-ready SaaS in a week!