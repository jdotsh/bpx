#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Checks if all required environment variables are present
 */

const chalk = require('chalk') || { 
  green: (s) => s, 
  red: (s) => s, 
  yellow: (s) => s, 
  blue: (s) => s,
  gray: (s) => s
};

// Define required and optional environment variables
const ENV_VARS = {
  required: [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      description: 'Supabase Project URL',
      example: 'https://xxxx.supabase.co'
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      description: 'Supabase Anonymous Key',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  ],
  recommended: [
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase Service Role Key (for server-side operations)',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    {
      key: 'DATABASE_URL',
      description: 'PostgreSQL connection string',
      example: 'postgresql://user:pass@host:5432/db'
    }
  ],
  optional: [
    {
      key: 'STRIPE_SECRET_KEY',
      description: 'Stripe Secret Key (for payments)',
      example: 'sk_test_...'
    },
    {
      key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      description: 'Stripe Publishable Key',
      example: 'pk_test_...'
    },
    {
      key: 'REDIS_URL',
      description: 'Redis URL (for caching/rate limiting)',
      example: 'redis://...'
    },
    {
      key: 'REDIS_TOKEN',
      description: 'Redis authentication token',
      example: 'AX9z...'
    }
  ]
};

function checkEnvironmentVariables() {
  console.log('🔍 Validating Environment Variables\n');
  console.log('=====================================\n');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables
  console.log('📋 Required Variables:');
  console.log('---------------------');
  ENV_VARS.required.forEach(({ key, description }) => {
    const value = process.env[key];
    if (value) {
      const maskedValue = value.substring(0, 10) + '...' + value.substring(value.length - 5);
      console.log(`✅ ${key}`);
      console.log(`   ${description}`);
      console.log(`   Value: ${maskedValue}\n`);
    } else {
      console.log(`❌ ${key} - MISSING!`);
      console.log(`   ${description}`);
      console.log(`   This variable is required for the app to function.\n`);
      hasErrors = true;
    }
  });
  
  // Check recommended variables
  console.log('\n📋 Recommended Variables:');
  console.log('------------------------');
  ENV_VARS.recommended.forEach(({ key, description }) => {
    const value = process.env[key];
    if (value) {
      const maskedValue = value.substring(0, 10) + '...' + value.substring(value.length - 5);
      console.log(`✅ ${key}`);
      console.log(`   ${description}`);
      console.log(`   Value: ${maskedValue}\n`);
    } else {
      console.log(`⚠️  ${key} - Not set`);
      console.log(`   ${description}`);
      console.log(`   Consider setting this for full functionality.\n`);
      hasWarnings = true;
    }
  });
  
  // Check optional variables
  console.log('\n📋 Optional Variables:');
  console.log('---------------------');
  ENV_VARS.optional.forEach(({ key, description }) => {
    const value = process.env[key];
    if (value) {
      const maskedValue = value.substring(0, 10) + '...' + value.substring(value.length - 5);
      console.log(`✅ ${key}`);
      console.log(`   Value: ${maskedValue}`);
    } else {
      console.log(`⭕ ${key} - Not set (${description})`);
    }
  });
  
  // Summary
  console.log('\n=====================================');
  if (hasErrors) {
    console.log('❌ VALIDATION FAILED: Missing required environment variables!');
    console.log('\nTo fix this:');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Fill in the required values');
    console.log('3. For Netlify: Add these in Site settings → Environment variables');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  VALIDATION PASSED with warnings');
    console.log('Some recommended variables are not set.');
    console.log('The app will work but may have limited functionality.');
  } else {
    console.log('✅ VALIDATION PASSED');
    console.log('All required and recommended environment variables are set!');
  }
  
  // Check environment
  console.log('\n📍 Current Environment:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Node Version: ${process.version}`);
}

// Run validation
checkEnvironmentVariables();