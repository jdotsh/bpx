# 🚀 RELEASE PLAN WITH UAT GATES

**Strategy**: Incremental releases → UAT approval → Next release → Final CI/CD

---

## **RELEASE SCHEDULE** 📅

```
Release 1: Foundation      [3 days] → UAT → ✅ Approve
Release 2: Core CRUD       [2 days] → UAT → ✅ Approve  
Release 3: Performance     [2 days] → UAT → ✅ Approve
Release 4: Studio Wiring   [2 days] → UAT → ✅ Approve
Release 5: Production      [1 day]  → UAT → ✅ Approve
Final: CI/CD Pipeline      [1 day]  → SHIP 🚀
```

---

## **RELEASE 1: FOUNDATION** 🏗️
**Duration**: 3 days | **Goal**: Database + Auth + Basic API

### **Day 1: Database Setup**
```sql
-- Deliverables
✓ Supabase project configured
✓ Database schema with RLS
✓ Prisma setup and migrations
✓ Test data seeded

-- UAT Checklist
□ Can create organizations in database
□ RLS policies block unauthorized access
□ Prisma queries work correctly
□ Test data is realistic
```

### **Day 2: Authentication**
```typescript
// Deliverables
✓ Supabase Auth integration
✓ Profile creation on signup
✓ Protected routes middleware
✓ User session management

// UAT Checklist
□ Can sign up with email
□ Can sign in/out
□ Profile created automatically
□ Protected routes redirect to login
□ Session persists on refresh
```

### **Day 3: Basic API Structure**
```typescript
// Deliverables
✓ Next.js API route structure
✓ Zod validation setup
✓ Error handling middleware
✓ Rate limiting basics

// UAT Test URLs
GET /api/health → "OK"
POST /api/test → Validates input with Zod
GET /api/protected → Requires auth
```

### **🔍 RELEASE 1 UAT CRITERIA**
```bash
# Test Commands
curl -X GET https://your-app.vercel.app/api/health
# Expected: 200 OK

curl -X POST https://your-app.vercel.app/api/test \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# Expected: 400 with Zod error

# Manual Testing
1. Visit /signup → Create account
2. Check Supabase dashboard → Profile created
3. Sign out → Redirected properly
4. Visit /protected → Redirected to login
5. Sign in → Access granted
```

**✅ APPROVAL GATE**: Foundation works correctly
**🚫 BLOCKERS**: Fix any auth/db issues before proceeding

---

## **RELEASE 2: CORE CRUD** 💾
**Duration**: 2 days | **Goal**: Diagram CRUD with versioning

### **Day 1: Domain Layer**
```typescript
// Deliverables
✓ Diagram entity with business logic
✓ Repository pattern implementation
✓ Domain events for audit
✓ Use cases (Create, Save, List, Get)

// UAT Checklist
□ Diagram entity validates business rules
□ Repository saves/loads correctly
□ Events are emitted on changes
□ Use cases handle errors properly
```

### **Day 2: CRUD APIs**
```typescript
// Deliverables
✓ POST /api/diagrams (create)
✓ GET /api/diagrams (list summaries)
✓ GET /api/diagrams/[id] (full diagram)
✓ PUT /api/diagrams/[id] (save with versioning)
✓ DELETE /api/diagrams/[id] (soft delete)

// UAT Test Cases
POST /api/diagrams → Creates diagram, returns ID
GET /api/diagrams → Returns list (no XML)
GET /api/diagrams/[id] → Returns full diagram with XML
PUT /api/diagrams/[id] → Updates with version check
PUT /api/diagrams/[id] (wrong version) → 409 conflict
DELETE /api/diagrams/[id] → Soft deletes
```

### **🔍 RELEASE 2 UAT CRITERIA**
```bash
# API Testing Script
#!/bin/bash

# Create diagram
DIAGRAM_ID=$(curl -X POST /api/diagrams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Diagram",
    "bpmnXml": "<bpmn:definitions>...</bpmn:definitions>"
  }' | jq -r '.id')

echo "Created diagram: $DIAGRAM_ID"

# List diagrams
curl -X GET /api/diagrams \
  -H "Authorization: Bearer $TOKEN"

# Get full diagram
curl -X GET /api/diagrams/$DIAGRAM_ID \
  -H "Authorization: Bearer $TOKEN"

# Update diagram
curl -X PUT /api/diagrams/$DIAGRAM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Diagram",
    "expectedVersion": 1
  }'

# Test version conflict
curl -X PUT /api/diagrams/$DIAGRAM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Should Fail",
    "expectedVersion": 1
  }'
# Expected: 409 Conflict
```

**✅ APPROVAL GATE**: All CRUD operations work with proper versioning
**🚫 BLOCKERS**: Fix any data consistency issues

---

## **RELEASE 3: PERFORMANCE** ⚡
**Duration**: 2 days | **Goal**: Caching + Bundle optimization

### **Day 1: Caching Layer**
```typescript
// Deliverables
✓ Redis cache setup (Upstash)
✓ Summary endpoint caching
✓ ETag support for client caching
✓ Cache invalidation on updates

// UAT Checklist
□ First request slow, second fast (cache hit)
□ ETags returned in headers
□ Cache invalidated on diagram update
□ Redis contains expected keys
```

### **Day 2: Bundle Optimization**
```typescript
// Deliverables
✓ Dynamic imports for BPMN studio
✓ Bundle analysis shows <1MB initial
✓ Code splitting configured
✓ Asset optimization

// UAT Checklist
□ Initial page load <2s
□ Studio loads dynamically
□ Bundle size report shows optimization
□ Lighthouse score >90
```

### **🔍 RELEASE 3 UAT CRITERIA**
```bash
# Performance Testing
npm run build
npm run analyze # Check bundle sizes

# Load Testing
npx lighthouse https://your-app.vercel.app
# Expected: Performance >90, FCP <2s

# Cache Testing
curl -X GET /api/diagrams \
  -H "Authorization: Bearer $TOKEN" \
  -v # Check for ETag header

curl -X GET /api/diagrams \
  -H "Authorization: Bearer $TOKEN" \
  -H "If-None-Match: \"cached-etag\"" \
  -v # Should return 304 Not Modified
```

**✅ APPROVAL GATE**: Performance targets met
**🚫 BLOCKERS**: Optimize if bundle >1MB or load time >2s

---

## **RELEASE 4: STUDIO WIRING** 🔗
**Duration**: 2 days | **Goal**: Connect frontend to backend

### **Day 1: TanStack Query Integration**
```typescript
// Deliverables
✓ Query hooks for diagrams
✓ Mutation hooks for save/create
✓ Optimistic updates
✓ Error handling with conflict resolution

// UAT Checklist
□ Diagram list loads from API
□ Can create new diagram via UI
□ Auto-save works every 2 seconds
□ Conflict resolution shows proper UI
```

### **Day 2: Studio Component Updates**
```typescript
// Deliverables
✓ Remove localStorage dependencies
✓ Wire studio to use API hooks
✓ Auto-save indicator shows status
✓ Error boundaries handle failures

// UAT Checklist
□ Studio loads existing diagram from API
□ Changes auto-save to database
□ No data stored in localStorage
□ Errors show user-friendly messages
```

### **🔍 RELEASE 4 UAT CRITERIA**
```bash
# Manual Testing Workflow
1. Go to /studio/new
   → Should create diagram in database
   → Should show in studio

2. Make changes to diagram
   → Should see "Saving..." indicator
   → Should auto-save every 2 seconds

3. Refresh page
   → Should load same diagram
   → Changes should persist

4. Open same diagram in two tabs
   → Make changes in tab 1
   → Save in tab 2 (should conflict)
   → Should show conflict resolution UI

5. Check localStorage
   → Should be empty (no diagram data)

6. Network tab
   → Should see API calls to /api/diagrams
   → Should see proper caching headers
```

**✅ APPROVAL GATE**: Studio fully functional with backend
**🚫 BLOCKERS**: Fix any data loss or UI issues

---

## **RELEASE 5: PRODUCTION READY** 🛡️
**Duration**: 1 day | **Goal**: Monitoring + Security + Polish

### **Morning: Monitoring & Observability**
```typescript
// Deliverables
✓ Sentry error tracking configured
✓ Structured logging implemented
✓ Performance monitoring active
✓ Alert rules configured

// UAT Checklist
□ Errors show in Sentry dashboard
□ API metrics visible in monitoring
□ Alerts fire on test conditions
□ Logs contain correlation IDs
```

### **Afternoon: Security & Polish**
```typescript
// Deliverables
✓ Rate limiting on all endpoints
✓ Input validation on all routes
✓ Security headers configured
✓ UI polish and error states

// UAT Checklist
□ Rate limiting blocks excessive requests
□ Invalid inputs return proper errors
□ Security scan passes
□ UI handles all error states gracefully
```

### **🔍 RELEASE 5 UAT CRITERIA**
```bash
# Security Testing
# Rate limiting test
for i in {1..20}; do
  curl -X POST /api/diagrams \
    -H "Authorization: Bearer $TOKEN"
done
# Should rate limit after ~10 requests

# Input validation test
curl -X POST /api/diagrams \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"invalid": "payload"}'
# Should return 400 with validation errors

# Security headers test
curl -I https://your-app.vercel.app
# Should include CSP, HSTS, etc.

# Error monitoring test
# Trigger error in UI
# Check Sentry dashboard for error report
```

**✅ APPROVAL GATE**: Production-ready with monitoring
**🚫 BLOCKERS**: Fix any security issues

---

## **FINAL: CI/CD PIPELINE** 🔄
**Duration**: 1 day | **Goal**: Automated deployment

### **CI/CD Setup**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### **🔍 FINAL UAT CRITERIA**
```bash
# CI/CD Testing
1. Make code change
2. Push to main branch
3. Watch GitHub Actions
   → Tests should pass
   → Build should succeed
   → Deployment should complete

4. Visit production URL
   → Should show updated code
   → Should work identically to staging

5. Check deployment logs
   → No errors in build process
   → Health checks pass
```

**✅ FINAL APPROVAL**: Ready for production traffic
**🚀 SHIP IT**: Go live!

---

## **UAT APPROVAL PROCESS** ✅

### **For Each Release**
```markdown
## Release X UAT Report

**Date**: ___________
**Tester**: ___________
**Environment**: ___________

### Functional Tests
□ All features work as expected
□ No critical bugs found
□ Performance meets requirements
□ Error handling works properly

### Non-Functional Tests  
□ Security tests pass
□ Performance tests pass
□ Monitoring works
□ Documentation updated

### Decision
□ ✅ APPROVED - Proceed to next release
□ 🚫 REJECTED - Fix issues and retest

**Notes**: ___________
**Approval Signature**: ___________
```

### **Daily Standup Template**
```markdown
**Release X - Day Y Status**

**Completed**:
- [x] Task 1
- [x] Task 2

**In Progress**:
- [ ] Task 3

**Ready for UAT**:
- Feature A: /api/test-url
- Feature B: Manual test steps

**Blockers**:
- None / List any issues

**Next**: UAT scheduled for [time]
```

---

## **ROLLBACK PLAN** 🔄

```bash
# If UAT fails
1. Identify critical issues
2. Create hotfix branch
3. Fix issues
4. Re-deploy to staging
5. Re-run UAT
6. Approve and continue

# If production fails
1. Revert to previous Vercel deployment
2. Check database integrity
3. Clear caches if needed
4. Create incident report
5. Fix and re-deploy
```

**Ready to start Release 1?** Let's go! 🚀

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Release 1: Database + Auth + Basic API (3 days)", "status": "pending", "id": "1"}, {"content": "Release 2: Core CRUD with versioning (2 days)", "status": "pending", "id": "2"}, {"content": "Release 3: Performance + Caching (2 days)", "status": "pending", "id": "3"}, {"content": "Release 4: Studio Wiring (2 days)", "status": "pending", "id": "4"}, {"content": "Release 5: Production Ready (1 day)", "status": "pending", "id": "5"}, {"content": "Final: CI/CD Pipeline (1 day)", "status": "pending", "id": "6"}, {"content": "UAT testing and approval for each release", "status": "pending", "id": "7"}, {"content": "Performance validation and monitoring", "status": "pending", "id": "8"}, {"content": "Security testing and compliance", "status": "pending", "id": "9"}, {"content": "Production deployment and go-live", "status": "pending", "id": "10"}]</parameter>
</invoke>