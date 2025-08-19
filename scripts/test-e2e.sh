#!/bin/bash

# End-to-End Testing Script for BPMN Studio Web
# This script runs all tests and validates the entire application

set -e

echo "🚀 Starting End-to-End Testing Suite"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# 1. Environment Check
echo -e "\n${YELLOW}1. Checking Environment...${NC}"
if [ ! -f .env.local ]; then
    echo "Creating .env.local from template..."
    cp .env.template .env.local
    echo "⚠️  Please update .env.local with your actual values"
fi
print_status $? "Environment files ready"

# 2. Install Dependencies
echo -e "\n${YELLOW}2. Installing Dependencies...${NC}"
npm install --quiet
print_status $? "Dependencies installed"

# 3. TypeScript Compilation
echo -e "\n${YELLOW}3. Running TypeScript Check...${NC}"
npm run type-check
print_status $? "TypeScript compilation successful"

# 4. Linting
echo -e "\n${YELLOW}4. Running ESLint...${NC}"
npm run lint
print_status $? "Linting passed"

# 5. Unit Tests
echo -e "\n${YELLOW}5. Running Unit Tests...${NC}"
npm test -- --coverage --silent
print_status $? "Unit tests passed"

# 6. Build Application
echo -e "\n${YELLOW}6. Building Application...${NC}"
npm run build
print_status $? "Build successful"

# 7. Database Setup (if needed)
echo -e "\n${YELLOW}7. Setting up Database...${NC}"
if command -v prisma &> /dev/null; then
    npx prisma generate
    print_status $? "Prisma client generated"
else
    echo "Skipping database setup (Prisma not configured)"
fi

# 8. Start Application in Background
echo -e "\n${YELLOW}8. Starting Application...${NC}"
npm run build && npm run start &
APP_PID=$!
sleep 10  # Wait for app to start

# Check if app is running
if ps -p $APP_PID > /dev/null; then
    print_status 0 "Application started (PID: $APP_PID)"
else
    print_status 1 "Failed to start application"
fi

# 9. API Health Check
echo -e "\n${YELLOW}9. Testing API Health...${NC}"
curl -f http://localhost:3000/api/health || curl -f http://localhost:3000/ > /dev/null 2>&1
print_status $? "API responding"

# 10. Test Critical Endpoints
echo -e "\n${YELLOW}10. Testing Critical Routes...${NC}"

# Test homepage
curl -f http://localhost:3000/ > /dev/null 2>&1
print_status $? "Homepage accessible"

# Test studio page
curl -f http://localhost:3000/studio > /dev/null 2>&1
print_status $? "Studio page accessible"

# Test API endpoints (will return 401 without auth, which is expected)
curl -s http://localhost:3000/api/diagrams | grep -q "Unauthorized\|error\|data"
print_status $? "API endpoints responding"

# 11. Performance Check
echo -e "\n${YELLOW}11. Running Performance Check...${NC}"
node -e "
const start = Date.now();
fetch('http://localhost:3000/')
  .then(() => {
    const time = Date.now() - start;
    console.log('Page load time: ' + time + 'ms');
    process.exit(time < 3000 ? 0 : 1);
  })
  .catch(() => process.exit(1));
" &
PERF_PID=$!
sleep 5
wait $PERF_PID
print_status $? "Performance within limits (<3s)"

# 12. Memory Check
echo -e "\n${YELLOW}12. Checking Memory Usage...${NC}"
ps aux | grep "node.*next" | awk '{print $4}' | head -1 | awk '{if ($1 < 5.0) exit 0; else exit 1}'
print_status $? "Memory usage acceptable"

# Clean up
echo -e "\n${YELLOW}Cleaning up...${NC}"
kill $APP_PID 2>/dev/null || true
wait $APP_PID 2>/dev/null || true

echo -e "\n${GREEN}===================================="
echo "✅ END-TO-END TESTING COMPLETE!"
echo "====================================${NC}"
echo ""
echo "Summary:"
echo "- TypeScript: ✅ No errors"
echo "- Linting: ✅ Passed"
echo "- Unit Tests: ✅ Passed"
echo "- Build: ✅ Successful"
echo "- API: ✅ Healthy"
echo "- Performance: ✅ Good"
echo "- Memory: ✅ Normal"
echo ""
echo "The application is ready for deployment! 🚀"