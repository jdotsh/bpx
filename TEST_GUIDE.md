# **END-TO-END TESTING GUIDE**
## **BPMN Studio Web - Complete Testing Instructions**

---

## **🚀 QUICK START TESTING**

### **Option 1: Automated Full Test Suite**
```bash
# Run complete E2E test
./scripts/test-e2e.sh
```

This will automatically:
- ✅ Check TypeScript compilation
- ✅ Run linting
- ✅ Execute unit tests
- ✅ Build the application
- ✅ Start the server
- ✅ Test all endpoints
- ✅ Check performance
- ✅ Validate memory usage

---

## **🧪 MANUAL TESTING STEPS**

### **1. Setup Environment**
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.template .env.local
# Edit .env.local with your Supabase and Stripe keys
```

### **2. Run Tests**

#### **TypeScript Check**
```bash
npm run type-check
# Expected: No errors
```

#### **Linting**
```bash
npm run lint
# Expected: No warnings or errors
```

#### **Unit Tests**
```bash
npm test
# Expected: All tests passing
```

#### **Test Coverage**
```bash
npm run test:coverage
# Expected: >80% coverage
```

### **3. Build & Start**
```bash
# Development mode
npm run dev
# Open http://localhost:3000

# OR Production build
npm run build
npm run start
# Open http://localhost:3000
```

---

## **🔍 FEATURE TESTING CHECKLIST**

### **Homepage**
- [ ] Navigate to http://localhost:3000
- [ ] Verify page loads without errors
- [ ] Check responsive design (mobile/tablet/desktop)
- [ ] Test navigation links
- [ ] Verify dark/light theme toggle

### **BPMN Studio**
- [ ] Navigate to /studio
- [ ] Create a new diagram
- [ ] Add BPMN elements (tasks, gateways, events)
- [ ] Test drag and drop functionality
- [ ] Save diagram (if authenticated)
- [ ] Export diagram as XML/PNG/SVG
- [ ] Import existing BPMN file
- [ ] Test undo/redo functionality
- [ ] Verify zoom controls
- [ ] Test toolbar actions

### **Authentication Flow**
- [ ] Navigate to /auth/signin
- [ ] Test email/password login
- [ ] Test Google OAuth (if configured)
- [ ] Verify error messages for invalid credentials
- [ ] Test signup flow at /auth/signup
- [ ] Verify password requirements
- [ ] Test logout functionality

### **Project Management**
- [ ] Create new project (authenticated)
- [ ] View project list at /projects
- [ ] Edit project details
- [ ] Delete project (soft delete)
- [ ] Search/filter projects

### **Diagram Management**
- [ ] Create diagram within project
- [ ] Edit diagram title
- [ ] Test auto-save (every 30 seconds)
- [ ] View version history
- [ ] Duplicate diagram
- [ ] Share diagram (collaboration)

### **API Testing**
```bash
# Test API health
curl http://localhost:3000/api/health

# Test diagrams endpoint (will return 401 without auth)
curl http://localhost:3000/api/diagrams

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/diagrams
```

---

## **⚡ PERFORMANCE TESTING**

### **Load Testing**
```javascript
// Run in Node.js
const loadTest = require('./__tests__/performance/load-test')

// Test with 100 concurrent requests
loadTest.runLoadTest('http://localhost:3000/api/diagrams', 10, 100)
  .then(report => console.log(report))
```

### **Memory Leak Detection**
```javascript
// Start memory monitoring
const detector = new MemoryLeakDetector()
detector.start(1000) // Sample every second

// Perform operations...

// Check for leaks
setTimeout(() => {
  const result = detector.analyze()
  console.log('Memory leak detected:', result.hasLeak)
  console.log('Trend:', result.trend)
  detector.stop()
}, 60000) // After 1 minute
```

### **Browser Performance**
1. Open Chrome DevTools
2. Go to Performance tab
3. Start recording
4. Interact with the application
5. Stop recording
6. Check for:
   - First Contentful Paint < 1.8s
   - Time to Interactive < 3.8s
   - No long tasks > 50ms

---

## **🔒 SECURITY TESTING**

### **Test Security Headers**
```bash
curl -I http://localhost:3000 | grep -E "X-Frame-Options|X-Content-Type|CSP"
```

### **Test Rate Limiting**
```bash
# Send multiple requests quickly
for i in {1..100}; do
  curl http://localhost:3000/api/diagrams &
done

# Should see 429 errors after limit
```

### **Test Input Validation**
```javascript
// Try XSS in BPMN XML
const maliciousXml = '<script>alert("XSS")</script>'
// Should be rejected

// Try SQL injection
const maliciousTitle = "'; DROP TABLE diagrams; --"
// Should be sanitized
```

---

## **📊 EXPECTED TEST RESULTS**

### **Unit Tests**
```
PASS  __tests__/components/bpmn-canvas.test.tsx
PASS  __tests__/services/project.test.ts
PASS  __tests__/api/diagrams.test.ts

Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
Coverage:    85% statements, 80% branches
```

### **Build Output**
```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB        89.3 kB
├ ○ /studio                             45.6 kB       234.5 kB
├ ○ /auth/signin                        12.3 kB       98.4 kB
└ ○ /api/diagrams                       0 B               0 B
```

### **Performance Metrics**
- Page Load: < 2 seconds
- API Response: < 200ms
- Memory Usage: < 200MB
- CPU Usage: < 30%

---

## **🐛 TROUBLESHOOTING**

### **TypeScript Errors**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run type-check
```

### **Build Failures**
```bash
# Clean build
rm -rf .next
npm run build
```

### **Test Failures**
```bash
# Run tests in debug mode
npm test -- --verbose --no-coverage
```

### **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## **✅ VALIDATION CHECKLIST**

Before deploying, ensure:

- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] Build completes successfully
- [ ] No console errors in browser
- [ ] API endpoints responding correctly
- [ ] Authentication flow working
- [ ] BPMN editor fully functional
- [ ] Performance metrics within targets
- [ ] Security headers present
- [ ] No memory leaks detected

---

## **🎯 SUCCESS CRITERIA**

The application is ready when:
1. **Zero errors** in console and build
2. **All tests pass** with >80% coverage
3. **Performance targets met** (<2s load time)
4. **Security validated** (headers, rate limiting)
5. **Full functionality** verified manually
6. **Memory stable** over time

Run `./scripts/test-e2e.sh` for automated validation of all criteria!

---

**Need help?** Check the logs:
- Application: `npm run dev` (see console output)
- Build: `.next/build-manifest.json`
- Tests: `coverage/lcov-report/index.html`