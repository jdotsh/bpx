# ⚡ FAST ENTERPRISE-GRADE MVP PLAN

**Philosophy**: Modular monolith first, enterprise bits sequenced ruthlessly. No microservice ceremony.

---

## **NON-NEGOTIABLES (Do Now)** 🔥

### **1. SECURITY** 🔒
**Timeline**: Day 1-2

```typescript
// ✅ Server-only secrets
// .env.local (never in client bundles)
const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!
}

// ✅ RLS (Row Level Security)
-- Enable RLS on all tables
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own diagrams" ON diagrams
  FOR ALL USING (profile_id = auth.uid());

// ✅ Zod on every boundary
const DiagramSchema = z.object({
  title: z.string().min(1).max(200),
  bpmnXml: z.string().refine(isValidBpmn, 'Invalid BPMN'),
  projectId: z.string().uuid().optional()
})

// ✅ Rate limiting by userId + IP
export const rateLimits = {
  save: rateLimit({ windowMs: 60000, max: 10, keyGenerator: req => `${req.userId}:${req.ip}` }),
  ai: rateLimit({ windowMs: 60000, max: 2, keyGenerator: req => `${req.userId}:ai` })
}

// ✅ CSP/HSTS headers
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}
```

**Gate**: ✅ 0 secrets in client bundles, RLS enforced, 100% input validation

### **2. CORRECTNESS** ✅
**Timeline**: Day 2-3

```typescript
// ✅ Optimistic concurrency on saves
export const updateDiagram = async (id: string, data: UpdateData, expectedVersion: number) => {
  const result = await prisma.diagram.update({
    where: { 
      id, 
      version: expectedVersion, // Optimistic lock
      profile_id: userId 
    },
    data: { 
      ...data, 
      version: { increment: 1 },
      updated_at: new Date() 
    }
  })
  
  if (!result) {
    throw new ConflictError('Diagram modified elsewhere', { 
      currentVersion: await getCurrentVersion(id) 
    })
  }
}

// ✅ Version history (keep last 10)
await prisma.diagramVersion.create({
  data: {
    diagram_id: id,
    version: newVersion,
    bpmn_xml: data.bpmnXml,
    author_id: userId,
    message: data.message || 'Auto-saved'
  }
})

// ✅ Soft delete + audit log
const AuditLogger = {
  log: (action: string, resource: string, userId: string, metadata: any) =>
    prisma.auditLog.create({
      data: { action, resource, user_id: userId, metadata, created_at: new Date() }
    })
}
```

**Gate**: ✅ Save = idempotent, versioned, auditable; conflict returns 409 with recoverable UX

### **3. PERFORMANCE** ⚡
**Timeline**: Day 3-4

```typescript
// ✅ Summary endpoints + ETags
export const getDiagramList = async (userId: string) => {
  const etag = await redis.get(`etag:diagrams:${userId}`)
  
  return {
    data: await prisma.diagram.findMany({
      where: { profile_id: userId, deleted_at: null },
      select: { 
        id: true, 
        title: true, 
        thumbnail: true, 
        updated_at: true,
        version: true
        // 🚫 NOT bpmn_xml (keep summaries fast)
      },
      orderBy: { updated_at: 'desc' }
    }),
    etag
  }
}

// ✅ Redis cache with smart invalidation
const CacheManager = {
  get: (key: string) => redis.get(key),
  set: (key: string, value: any, ttl = 300) => redis.setex(key, ttl, JSON.stringify(value)),
  invalidatePattern: (pattern: string) => redis.del(...redis.keys(pattern))
}

// ✅ Lazy-load XML only when editing
export const getDiagramContent = async (id: string, userId: string) => {
  const cached = await redis.get(`diagram:${id}`)
  if (cached) return JSON.parse(cached)
  
  const diagram = await prisma.diagram.findFirst({
    where: { id, profile_id: userId },
    include: { bpmn_xml: true } // Load full content only here
  })
  
  await redis.setex(`diagram:${id}`, 300, JSON.stringify(diagram))
  return diagram
}

// ✅ Dynamic import to keep <1MB bundle
const BpmnDesigner = lazy(() => import('@/components/bpmn/bpmn-designer'))

export function StudioPage() {
  return (
    <Suspense fallback={<DiagramSkeleton />}>
      <BpmnDesigner />
    </Suspense>
  )
}
```

**Gate**: ✅ Initial bundle <1MB, FCP <2s, TTI <3s; 500+ elements <100MB, smooth pan/zoom

### **4. RELIABILITY** 🛡️
**Timeline**: Day 4-5

```typescript
// ✅ Explicit service layer (commands/queries)
export class DiagramService {
  // Commands (writes)
  async createDiagram(command: CreateDiagramCommand): Promise<Result<Diagram>> {
    return this.withTransaction(async (tx) => {
      const diagram = await tx.diagram.create({ data: command })
      await this.outbox.add('diagram.created', { diagramId: diagram.id })
      return diagram
    })
  }
  
  // Queries (reads)
  async getDiagramList(query: GetDiagramListQuery): Promise<DiagramSummary[]> {
    const cacheKey = `diagrams:${query.userId}`
    return this.cache.getOrSet(cacheKey, () => 
      this.repository.findDiagramSummaries(query)
    )
  }
}

// ✅ Outbox table + worker for side-effects
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

// Worker processes events async
export const OutboxWorker = {
  process: async () => {
    const events = await prisma.outboxEvent.findMany({
      where: { processed_at: null },
      take: 100
    })
    
    for (const event of events) {
      await this.handleEvent(event)
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { processed_at: new Date() }
      })
    }
  }
}
```

**Gate**: ✅ One codebase, explicit service layer, outbox for side-effects

### **5. OBSERVABILITY** 📊
**Timeline**: Day 5-6

```typescript
// ✅ Sentry + OpenTelemetry
import { trace, context, SpanStatusCode } from '@opentelemetry/api'

export const withTracing = (name: string, fn: Function) => {
  return trace.getTracer('bpmn-studio').startActiveSpan(name, async (span) => {
    try {
      span.setAttributes({ 
        'user.id': getCurrentUserId(),
        'operation': name 
      })
      
      const result = await fn()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.recordException(error)
      span.setStatus({ code: SpanStatusCode.ERROR })
      Sentry.captureException(error)
      throw error
    } finally {
      span.end()
    }
  })
}

// ✅ RED/SLA dashboards
export const Metrics = {
  trackApiCall: (endpoint: string, duration: number, status: number) => {
    prometheus.histogram('api_request_duration_seconds')
      .labels({ endpoint, status })
      .observe(duration / 1000)
      
    if (duration > 1000) {
      Alert.send('slow_api_call', { endpoint, duration })
    }
  }
}

// ✅ Structured logs with correlation IDs
export const Logger = {
  info: (message: string, meta: any = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      correlationId: getCorrelationId(),
      userId: getCurrentUserId(),
      timestamp: new Date().toISOString(),
      ...meta
    }))
  }
}
```

**Gate**: ✅ Error budgets, runbooks, alerts for save latency/error rate/conflicts

---

## **FAST PATH GATES** 🚪
*Ship when ALL pass*

### **Security Gate** 🔒
- [ ] 0 secrets in client bundles
- [ ] RLS enforced on all tables  
- [ ] 100% input validation with Zod
- [ ] Rate limits on AI & write routes
- [ ] CSP/HSTS headers configured

### **Performance Gate** ⚡
- [ ] Initial bundle <1MB
- [ ] First Contentful Paint <2s
- [ ] Time to Interactive <3s
- [ ] 500+ elements uses <100MB RAM
- [ ] Pan/zoom stays smooth

### **Data Gate** 💾
- [ ] Save = idempotent, versioned, auditable
- [ ] Conflict returns 409 with recoverable UX
- [ ] Soft delete implemented
- [ ] Version history (last 10)

### **Ops Gate** 🔧
- [ ] Error budgets defined
- [ ] Runbooks written
- [ ] Alerts wired (save latency, error rate, conflicts)
- [ ] Health checks respond <100ms

### **Tests Gate** 🧪
- [ ] E2E happy paths (create/edit/undo/import/export)
- [ ] Contract tests on API
- [ ] Golden fixtures for BPMN XML

---

## **30-60-90 ROADMAP** 📅

### **Day 0-30: Foundation** 🏗️
**Focus**: Service layer, Prisma schema, security, performance

```bash
# Week 1: Core Infrastructure
✅ Service layer + commands/queries
✅ Prisma schema with RLS
✅ tRPC routes with Zod validation
✅ Rate limiting + security headers

# Week 2: Performance + Reliability  
✅ Summary endpoints + ETags
✅ Redis caching strategy
✅ Bundle optimization (<1MB)
✅ Outbox table + worker

# Week 3: Observability + Testing
✅ Sentry + OpenTelemetry setup
✅ RED dashboards + alerts
✅ E2E test suite
✅ Contract tests

# Week 4: Polish + Gates
✅ All fast path gates pass
✅ Performance benchmarks green
✅ Security audit complete
```

### **Day 31-60: Scale** 📈
**Focus**: CQRS for reads, Stripe, org/roles

```bash
# Week 5-6: Read Models (Selective CQRS)
✅ Dashboard read model (aggregated stats)
✅ Search read model (full-text)
✅ Event handlers to update read models

# Week 7-8: Business Features
✅ Stripe basic plans (free/pro/enterprise)
✅ Organizations + role-based access
✅ Usage quotas + billing
```

### **Day 61-90: Advanced** 🚀
**Focus**: Realtime pilot, AI features

```bash
# Week 9-10: Realtime (Pilot)
✅ Yjs integration for task names/comments
✅ Collaborative cursor positions
✅ Conflict resolution UI

# Week 11-12: AI Pipeline
✅ "Prompt → BPMN XML" behind feature flag
✅ Hard quotas + rate limiting
✅ AI-generated thumbnails
```

---

## **RED FLAGS TO AVOID** ⛔

### **Architecture Anti-Patterns**
- ❌ Big-bang microservices
- ❌ Kafka on day 1
- ❌ Full CQRS everywhere
- ❌ Event sourcing without clear ROI

### **Performance Killers**
- ❌ Storing only full XML (use summaries)
- ❌ Reloading XML for every view
- ❌ Frontend persistence in localStorage
- ❌ No bundle optimization

### **Reliability Issues**
- ❌ Undefined error taxonomy
- ❌ No correlation IDs
- ❌ Missing health checks
- ❌ No circuit breakers

---

## **IMPLEMENTATION PUNCH-LIST** ✅

### **File Structure**
```
lib/
├── services/           # Service layer (commands/queries)
│   ├── diagram.service.ts
│   ├── auth.service.ts
│   └── billing.service.ts
├── repositories/       # Data access layer
│   ├── diagram.repository.ts
│   └── base.repository.ts
├── domain/            # Domain entities + business logic
│   ├── diagram.entity.ts
│   └── user.entity.ts
├── infrastructure/    # External concerns
│   ├── cache.ts
│   ├── queue.ts
│   └── monitoring.ts
└── shared/            # Shared utilities
    ├── result.ts
    ├── logger.ts
    └── validation.ts
```

### **Exact Checks for Each Gate**

#### **Security Checklist**
```bash
# Check 1: No secrets in client bundle
npm run build && grep -r "sk_\|pk_" .next/static/ # Should return nothing

# Check 2: RLS policies active
psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE rowsecurity = true;"

# Check 3: Rate limiting works
curl -X POST /api/diagram/create -H "Authorization: Bearer $TOKEN" # Should hit rate limit after 10 calls

# Check 4: CSP headers
curl -I https://yourapp.vercel.app | grep -i "content-security-policy"
```

#### **Performance Checklist**
```bash
# Check 1: Bundle size
npm run build && ls -la .next/static/chunks/*.js | awk '{sum+=$5} END {print "Total bundle:", sum/1024/1024 "MB"}'

# Check 2: Core Web Vitals
npx lighthouse https://yourapp.vercel.app --only-categories=performance

# Check 3: API response times
k6 run load-test.js # Should show p95 < 200ms
```

#### **Data Integrity Checklist**
```bash
# Check 1: Optimistic concurrency
# Try saving same diagram with old version -> should get 409

# Check 2: Version history
psql $DATABASE_URL -c "SELECT COUNT(*) FROM diagram_versions WHERE diagram_id = 'test-id';"

# Check 3: Audit trail
psql $DATABASE_URL -c "SELECT * FROM audit_logs WHERE resource = 'diagram' ORDER BY created_at DESC LIMIT 5;"
```

---

## **SUCCESS DEFINITION** 🎯

**Technical KPIs**
- API p95 latency: <200ms
- Page load time: <2s
- Error rate: <0.1%
- Uptime: 99.9%

**Business KPIs**  
- Save success rate: 100%
- Conflict resolution rate: >95%
- User satisfaction: >4.5/5
- Churn rate: <5%

**The Fast Path Promise**: Enterprise-grade in 30 days, not 6 months.

This plan gives you **production-ready SaaS architecture** without the ceremony. Modular monolith scales to millions of users while staying maintainable and fast to ship.