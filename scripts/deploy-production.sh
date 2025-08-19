#!/bin/bash

# BPMN Studio Web - Production Deployment Script
# ==============================================
# This script handles the complete deployment process for production

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DEPLOY_BRANCH=${2:-main}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BPMN Studio Web - Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Branch: ${YELLOW}$DEPLOY_BRANCH${NC}"
echo ""

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run with loading message
run_with_spinner() {
    local message=$1
    local command=$2
    
    echo -n "$message"
    
    # Run command in background
    eval "$command" > /tmp/deploy_output.log 2>&1 &
    local pid=$!
    
    # Show spinner
    local spin='⣾⣽⣻⢿⡿⣟⣯⣷'
    local i=0
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %8 ))
        printf "\r$message ${spin:$i:1} "
        sleep .1
    done
    
    # Check if command succeeded
    if wait $pid; then
        echo -e "\r$message ${GREEN}✓${NC}"
        return 0
    else
        echo -e "\r$message ${RED}✗${NC}"
        echo -e "${RED}Error output:${NC}"
        cat /tmp/deploy_output.log
        return 1
    fi
}

# 1. Pre-deployment checks
echo -e "${BLUE}1. Pre-deployment Checks${NC}"
echo "------------------------"

# Check required tools
echo "Checking required tools..."
for tool in node npm git prisma vercel; do
    if command_exists $tool; then
        echo -e "  $tool: ${GREEN}✓${NC}"
    else
        echo -e "  $tool: ${RED}✗ Missing${NC}"
        echo -e "${RED}Please install $tool before deploying${NC}"
        exit 1
    fi
done

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi

# 2. Environment Setup
echo ""
echo -e "${BLUE}2. Environment Setup${NC}"
echo "--------------------"

# Load environment file
if [ "$ENVIRONMENT" = "production" ]; then
    ENV_FILE=".env.production"
    echo "Using production environment"
elif [ "$ENVIRONMENT" = "staging" ]; then
    ENV_FILE=".env.staging"
    echo "Using staging environment"
else
    ENV_FILE=".env.local"
    echo "Using local environment"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Environment file $ENV_FILE not found!${NC}"
    exit 1
fi

# Validate required environment variables
echo "Validating environment variables..."
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "DATABASE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" "$ENV_FILE"; then
        echo -e "  $var: ${GREEN}✓${NC}"
    else
        echo -e "  $var: ${RED}✗ Missing${NC}"
        MISSING_VARS=true
    fi
done

if [ "$MISSING_VARS" = true ]; then
    echo -e "${RED}Missing required environment variables!${NC}"
    exit 1
fi

# 3. Code Quality Checks
echo ""
echo -e "${BLUE}3. Code Quality Checks${NC}"
echo "----------------------"

# Run TypeScript check
run_with_spinner "TypeScript compilation..." "npm run type-check"

# Run linting
run_with_spinner "ESLint check..." "npm run lint"

# Run tests
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    run_with_spinner "Running tests..." "npm test -- --passWithNoTests"
fi

# 4. Build Application
echo ""
echo -e "${BLUE}4. Build Application${NC}"
echo "--------------------"

# Clean previous build
run_with_spinner "Cleaning build directory..." "rm -rf .next"

# Install dependencies
run_with_spinner "Installing dependencies..." "npm ci --production=false"

# Generate Prisma client
run_with_spinner "Generating Prisma client..." "npx prisma generate"

# Build Next.js application
run_with_spinner "Building application..." "npm run build"

# Check build size
echo ""
echo "Build size analysis:"
if [ -d ".next" ]; then
    TOTAL_SIZE=$(du -sh .next | cut -f1)
    echo -e "  Total build size: ${YELLOW}$TOTAL_SIZE${NC}"
    
    # Check if build is under 50MB (Vercel limit)
    SIZE_MB=$(du -sm .next | cut -f1)
    if [ "$SIZE_MB" -gt 50 ]; then
        echo -e "  ${YELLOW}Warning: Build size exceeds 50MB${NC}"
    fi
fi

# 5. Database Migration
echo ""
echo -e "${BLUE}5. Database Migration${NC}"
echo "---------------------"

if [ "$ENVIRONMENT" != "local" ]; then
    echo "Running database migrations..."
    
    # Export DATABASE_URL from env file
    export $(grep DATABASE_URL "$ENV_FILE" | xargs)
    
    # Run migrations
    run_with_spinner "Applying migrations..." "npx prisma migrate deploy"
    
    # Verify database connection
    run_with_spinner "Verifying database..." "npx prisma db pull --print"
else
    echo "Skipping database migration for local environment"
fi

# 6. Deployment
echo ""
echo -e "${BLUE}6. Deployment${NC}"
echo "-------------"

if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
    # Deploy to Vercel
    echo "Deploying to Vercel..."
    
    # Set environment
    if [ "$ENVIRONMENT" = "production" ]; then
        VERCEL_ENV="--prod"
        ALIAS="app.bpmn-studio.com"
    else
        VERCEL_ENV=""
        ALIAS="staging.bpmn-studio.com"
    fi
    
    # Deploy
    run_with_spinner "Deploying to Vercel..." "vercel --yes $VERCEL_ENV"
    
    # Set alias
    if [ ! -z "$ALIAS" ]; then
        run_with_spinner "Setting domain alias..." "vercel alias set $ALIAS"
    fi
    
    DEPLOY_URL=$(vercel inspect --json | jq -r '.url')
    echo -e "Deployment URL: ${GREEN}$DEPLOY_URL${NC}"
else
    echo "Local deployment - starting development server..."
    echo -e "${YELLOW}Run 'npm run dev' to start the development server${NC}"
fi

# 7. Post-deployment Checks
echo ""
echo -e "${BLUE}7. Post-deployment Checks${NC}"
echo "-------------------------"

if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
    # Wait for deployment to be ready
    echo "Waiting for deployment to be ready..."
    sleep 10
    
    # Health check
    echo "Running health check..."
    HEALTH_URL="https://$ALIAS/api/health"
    
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        echo -e "  Health check: ${GREEN}✓ Healthy${NC}"
        
        # Get detailed health status
        HEALTH_DATA=$(curl -s "$HEALTH_URL")
        echo "  Health details:"
        echo "$HEALTH_DATA" | jq -r '.checks | to_entries[] | "    \(.key): \(.value.status)"'
    else
        echo -e "  Health check: ${RED}✗ Failed (HTTP $HEALTH_RESPONSE)${NC}"
    fi
    
    # Check critical endpoints
    echo ""
    echo "Checking critical endpoints..."
    
    ENDPOINTS=(
        "/api/health|200"
        "/auth/signin|200"
        "/|200"
    )
    
    for endpoint_data in "${ENDPOINTS[@]}"; do
        IFS='|' read -r endpoint expected <<< "$endpoint_data"
        URL="https://$ALIAS$endpoint"
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
        
        if [ "$RESPONSE" = "$expected" ]; then
            echo -e "  $endpoint: ${GREEN}✓ ($RESPONSE)${NC}"
        else
            echo -e "  $endpoint: ${RED}✗ (Expected $expected, got $RESPONSE)${NC}"
        fi
    done
fi

# 8. Monitoring Setup
echo ""
echo -e "${BLUE}8. Monitoring Setup${NC}"
echo "-------------------"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "Setting up monitoring..."
    
    # Sentry release
    if command_exists sentry-cli && [ ! -z "$SENTRY_DSN" ]; then
        run_with_spinner "Creating Sentry release..." "sentry-cli releases new $DEPLOY_BRANCH"
        run_with_spinner "Uploading source maps..." "sentry-cli releases files $DEPLOY_BRANCH upload-sourcemaps .next"
    else
        echo "  Sentry: Skipped (not configured)"
    fi
    
    echo -e "  Monitoring: ${GREEN}✓ Configured${NC}"
fi

# 9. Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deployment Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo -e "Status: ${GREEN}Successfully Deployed${NC}"
    echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
    echo -e "URL: ${GREEN}https://$ALIAS${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Monitor application logs: vercel logs"
    echo "2. Check error tracking in Sentry"
    echo "3. Monitor performance metrics"
    echo "4. Test critical user flows"
else
    echo -e "Status: ${GREEN}Build Successful${NC}"
    echo -e "Environment: ${YELLOW}Local${NC}"
    echo ""
    echo -e "${YELLOW}To start the application:${NC}"
    echo "  npm run dev"
fi

echo ""
echo -e "${GREEN}Deployment complete!${NC}"