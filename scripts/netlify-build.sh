#!/bin/bash

echo "🧹 Cleaning Next.js build cache..."
rm -rf .next node_modules/.cache

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "🧹 Post-build cleanup..."
# Remove cache to avoid false positives
rm -rf .next/cache

# The NEXT_PUBLIC variables are meant to be public
# This is expected behavior for Next.js apps
echo "ℹ️  Note: NEXT_PUBLIC_* environment variables are intentionally public"

echo "✅ Build complete!"