#!/bin/bash

# Netlify deployment helper script
# This script helps prepare the build for Netlify deployment

echo "🚀 Preparing for Netlify deployment..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf .next .netlify out dist build

# Clear npm cache if needed
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run the build
echo "Building application..."
npm run build

echo "✅ Build preparation complete!"
echo ""
echo "To deploy to Netlify:"
echo "1. Commit your changes: git add . && git commit -m 'Fix Netlify deployment'"
echo "2. Push to your repository: git push"
echo "3. Netlify will automatically deploy from your repository"
echo ""
echo "Environment variables needed in Netlify:"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY (if using server-side auth)"