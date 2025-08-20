#!/bin/bash

# Setup Netlify Environment Variables
# This script sets up all required environment variables for Netlify deployment

echo "🚀 Setting up Netlify Environment Variables..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo "Please create .env.local with your credentials first."
    exit 1
fi

# Source the .env.local file to get values
set -a
source .env.local
set +a

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    local description=$3
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Skipping $key (no value found)${NC}"
        return
    fi
    
    echo -e "${GREEN}✓${NC} Setting $key... ($description)"
    netlify env:set "$key" "$value" --context production 2>/dev/null || {
        echo -e "${RED}❌ Failed to set $key${NC}"
        return 1
    }
}

echo ""
echo "📝 Setting Required Environment Variables..."
echo "==========================================="

# Required Supabase variables
set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "Supabase Project URL"
set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anonymous Key"

# Optional but recommended
echo ""
echo "📝 Setting Optional Environment Variables..."
echo "==========================================="

set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key"
set_env_var "DATABASE_URL" "$DATABASE_URL" "Database Connection String"
set_env_var "DIRECT_URL" "$DIRECT_URL" "Direct Database URL"

# Stripe (if configured)
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    echo ""
    echo "💳 Setting Stripe Variables..."
    set_env_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "Stripe Secret Key"
    set_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Stripe Publishable Key"
    set_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET" "Stripe Webhook Secret"
fi

# Redis/Upstash (if configured)
if [ ! -z "$REDIS_URL" ]; then
    echo ""
    echo "🔴 Setting Redis Variables..."
    set_env_var "REDIS_URL" "$REDIS_URL" "Redis URL"
    set_env_var "REDIS_TOKEN" "$REDIS_TOKEN" "Redis Token"
fi

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify variables in Netlify dashboard: Site settings → Environment variables"
echo "2. Trigger a new deploy: netlify deploy --prod"
echo "3. Monitor the build logs for any issues"
echo ""
echo "🔐 Security reminder: Never commit .env files to Git!"