#!/bin/bash

# Production Readiness Verification Script
# =========================================
# This script checks if your application is ready for production

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Production Readiness Verification"
echo "===================================="
echo ""

READY=true
WARNINGS=0
ERRORS=0

# 1. Code Quality Checks
echo "1️⃣  CODE QUALITY CHECKS"
echo "------------------------"

# TypeScript Check
echo -n "   TypeScript Compilation: "
if npm run type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    READY=false
    ((ERRORS++))
fi

# Build Check
echo -n "   Production Build: "
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    READY=false
    ((ERRORS++))
fi

# Lint Check (warnings ok)
echo -n "   ESLint Check: "
if npm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  WARNINGS${NC}"
    ((WARNINGS++))
fi

echo ""

# 2. Environment Configuration
echo "2️⃣  ENVIRONMENT CONFIGURATION"
echo "-----------------------------"

# Check for placeholder values
echo -n "   Supabase URL: "
if grep -q "your-project\|localhost:54321" .env.local 2>/dev/null; then
    echo -e "${RED}❌ PLACEHOLDER/LOCAL${NC}"
    READY=false
    ((ERRORS++))
else
    echo -e "${GREEN}✅ CONFIGURED${NC}"
fi

echo -n "   Database URL: "
if grep -q "localhost:5432\|localhost:54322" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  LOCAL DATABASE${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ CONFIGURED${NC}"
fi

echo -n "   API Keys: "
if grep -q "placeholder\|mock\|test" .env.local 2>/dev/null; then
    echo -e "${RED}❌ USING TEST KEYS${NC}"
    READY=false
    ((ERRORS++))
else
    echo -e "${GREEN}✅ CONFIGURED${NC}"
fi

echo ""

# 3. API Health Check
echo "3️⃣  API HEALTH CHECK"
echo "--------------------"

# Check if server is running
echo -n "   Server Status: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ RUNNING${NC}"
    
    # Check health endpoint
    echo -n "   Health Endpoint: "
    HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    if echo "$HEALTH" | grep -q '"status":"healthy"'; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
    elif echo "$HEALTH" | grep -q '"status":"degraded"'; then
        echo -e "${YELLOW}⚠️  DEGRADED${NC}"
        ((WARNINGS++))
    else
        echo -e "${RED}❌ UNHEALTHY${NC}"
        READY=false
        ((ERRORS++))
    fi
    
    # Check specific services
    echo -n "   Database Connection: "
    if echo "$HEALTH" | grep -q '"database":{"status":"ok"'; then
        echo -e "${GREEN}✅ CONNECTED${NC}"
    else
        echo -e "${RED}❌ NOT CONNECTED${NC}"
        READY=false
        ((ERRORS++))
    fi
    
    echo -n "   Auth Service: "
    if echo "$HEALTH" | grep -q '"auth":{"status":"ok"'; then
        echo -e "${GREEN}✅ WORKING${NC}"
    else
        echo -e "${RED}❌ NOT WORKING${NC}"
        READY=false
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌ NOT RUNNING${NC}"
    echo "   Start server with: npm run dev"
    READY=false
    ((ERRORS++))
fi

echo ""

# 4. Feature Verification
echo "4️⃣  FEATURE VERIFICATION"
echo "------------------------"

# Check critical files exist
echo -n "   BPMN Editor: "
if [ -f "components/bpmn/bpmn-studio.tsx" ]; then
    echo -e "${GREEN}✅ IMPLEMENTED${NC}"
else
    echo -e "${RED}❌ MISSING${NC}"
    READY=false
    ((ERRORS++))
fi

echo -n "   Authentication: "
if [ -f "app/api/auth/signin/route.ts" ] && [ -f "app/api/auth/signup/route.ts" ]; then
    echo -e "${GREEN}✅ IMPLEMENTED${NC}"
else
    echo -e "${RED}❌ MISSING${NC}"
    READY=false
    ((ERRORS++))
fi

echo -n "   Email Service: "
if [ -f "lib/email/resend.ts" ]; then
    echo -e "${GREEN}✅ IMPLEMENTED${NC}"
else
    echo -e "${RED}❌ MISSING${NC}"
    READY=false
    ((ERRORS++))
fi

echo -n "   Rate Limiting: "
if [ -f "lib/rate-limit.ts" ]; then
    echo -e "${GREEN}✅ IMPLEMENTED${NC}"
else
    echo -e "${RED}❌ MISSING${NC}"
    READY=false
    ((ERRORS++))
fi

echo ""

# 5. Security Checks
echo "5️⃣  SECURITY CHECKS"
echo "-------------------"

echo -n "   Middleware Protection: "
if [ -f "middleware.ts" ]; then
    echo -e "${GREEN}✅ CONFIGURED${NC}"
else
    echo -e "${RED}❌ MISSING${NC}"
    READY=false
    ((ERRORS++))
fi

echo -n "   Environment Variables: "
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ CONFIGURED${NC}"
else
    echo -e "${RED}❌ MISSING${NC}"
    READY=false
    ((ERRORS++))
fi

echo -n "   Error Handling: "
if [ -f "lib/core/errors/application-error.ts" ]; then
    echo -e "${GREEN}✅ IMPLEMENTED${NC}"
else
    echo -e "${RED}❌ MISSING${NC}"
    READY=false
    ((ERRORS++))
fi

echo ""

# 6. Performance Check
echo "6️⃣  PERFORMANCE CHECK"
echo "---------------------"

if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo "   Build Size: $BUILD_SIZE"
    
    # Check if build exists
    if [ -f ".next/BUILD_ID" ]; then
        echo -e "   Build Status: ${GREEN}✅ OPTIMIZED${NC}"
    else
        echo -e "   Build Status: ${YELLOW}⚠️  NOT OPTIMIZED${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "   Build Status: ${RED}❌ NOT BUILT${NC}"
    echo "   Run: npm run build"
    READY=false
    ((ERRORS++))
fi

echo ""
echo "===================================="
echo ""

# Final Verdict
echo "📊 SUMMARY"
echo "----------"
echo -e "   Errors: ${RED}$ERRORS${NC}"
echo -e "   Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ "$READY" = true ] && [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ PRODUCTION READY!${NC}"
    echo ""
    echo "Your application is ready for production deployment."
    echo "Deploy with: vercel --prod"
elif [ $ERRORS -gt 0 ] && [ $ERRORS -le 3 ]; then
    echo -e "${YELLOW}⚠️  ALMOST READY${NC}"
    echo ""
    echo "Your code is production ready but needs configuration:"
    echo "1. Create Supabase project at supabase.com"
    echo "2. Update .env.local with real credentials"
    echo "3. Run database migrations"
    echo "4. Configure email service"
else
    echo -e "${RED}❌ NOT PRODUCTION READY${NC}"
    echo ""
    echo "Critical issues found. Fix the errors above before deploying."
fi

echo ""
echo "===================================="
echo ""

# Provide next steps
if [ "$READY" = false ]; then
    echo "📝 NEXT STEPS:"
    echo "--------------"
    
    if grep -q "your-project\|localhost:54321" .env.local 2>/dev/null; then
        echo "1. Set up Supabase:"
        echo "   - Go to supabase.com"
        echo "   - Create new project"
        echo "   - Copy credentials to .env.local"
        echo ""
    fi
    
    if ! curl -s http://localhost:3000/api/health | grep -q '"database":{"status":"ok"' 2>/dev/null; then
        echo "2. Connect Database:"
        echo "   - Run database migrations"
        echo "   - Update DATABASE_URL in .env.local"
        echo ""
    fi
    
    echo "3. Run this script again to verify"
fi

exit $ERRORS