#!/bin/bash

# Test local authentication without Supabase
echo "🧪 Testing Local Authentication"
echo "================================"

# Test signup
echo ""
echo "1. Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}')

echo "Response: $SIGNUP_RESPONSE" | jq '.'

# Test signin
echo ""
echo "2. Testing Signin..."
SIGNIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

echo "Response: $SIGNIN_RESPONSE" | jq '.'

# Test health
echo ""
echo "3. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
echo "Response: $HEALTH_RESPONSE" | jq '.'

echo ""
echo "✅ Test complete! Check responses above."