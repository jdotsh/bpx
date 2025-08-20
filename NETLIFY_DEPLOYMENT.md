# Netlify Deployment Instructions

## Important: Secret Scanning False Positives

The Netlify build may show warnings about "secrets" being detected in the build output. These are **false positives** for `NEXT_PUBLIC_*` environment variables.

### Why This Happens
- `NEXT_PUBLIC_*` variables are **intentionally public** and exposed in client-side code
- This is by design in Next.js - these variables are meant to be visible in the browser
- The Supabase anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is specifically designed to be public

### To Fix This Issue

#### Option 1: Contact Netlify Support
Request to disable secret scanning for `NEXT_PUBLIC_*` variables for your site.

#### Option 2: Add Environment Variable in Netlify Dashboard
1. Go to your Netlify site dashboard
2. Navigate to Site Settings > Environment Variables
3. Add: `NETLIFY_SKIP_SECRET_SCANNING = true`

#### Option 3: Use Build Plugins
Install a build plugin that skips secret scanning for public variables.

### Required Environment Variables
Make sure these are set in your Netlify dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service key (private, if using server-side auth)

### Build Configuration
- Node Version: 20.9.0
- Build Command: `npm run build`
- Publish Directory: `.next`

## Security Note
The "anon" key is safe to expose because:
1. It's designed to be public
2. Database access is controlled by Row Level Security (RLS) policies
3. This is the standard Supabase architecture

## Support
If builds continue to fail due to secret scanning, contact Netlify support and explain that `NEXT_PUBLIC_*` variables are intentionally public as per Next.js design.