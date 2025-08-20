#!/bin/bash

echo "🧹 Cleaning Next.js build cache..."
rm -rf .next node_modules/.cache

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "🧹 Removing webpack cache to avoid false positives..."
rm -rf .next/cache

echo "✅ Build complete!"