#!/bin/bash
set -e

echo "🔨 Building Next.js application for Netlify..."

# Build the application
npm run build

echo "✅ Build complete!"

# Note: NEXT_PUBLIC_* variables are meant to be public and embedded in the client code.
# This is by design - they are not secrets.