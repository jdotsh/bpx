#!/bin/bash

echo "🧹 Cleaning build cache..."
rm -rf .next .netlify node_modules/.cache

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
npm run build

echo "🧹 Removing webpack cache to avoid false positives..."
rm -rf .next/cache

echo "✅ Build complete!"