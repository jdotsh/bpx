#!/bin/bash
set -e  # Exit on any error

echo "🧹 Cleaning Next.js build cache..."
rm -rf .next

echo "🔨 Building application..."
npm run build

echo "🧹 Post-build cleanup..."
# Remove cache to avoid false positives in secret scanning
rm -rf .next/cache

echo "✅ Build complete!"