# How to Fix Netlify Secret Scanning Issue

## The Problem
Netlify's secret scanner is detecting `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the build output and treating it as a leaked secret. This is a **false positive** because:

1. **`NEXT_PUBLIC_*` variables are designed to be public** - That's what the prefix means in Next.js
2. **Supabase anon keys are meant to be public** - Security is handled by Row Level Security (RLS) policies
3. **This is standard Next.js + Supabase architecture**

## Solution Options

### Option 1: Contact Netlify Support (Recommended)
1. Open a support ticket with Netlify
2. Explain that `NEXT_PUBLIC_*` environment variables are intentionally public
3. Request them to whitelist these patterns for your site

### Option 2: Add Environment Variable in Netlify Dashboard
1. Go to Site Settings → Environment Variables
2. Add: `SECRETS_SCAN_SKIP_PATTERNS = "NEXT_PUBLIC_*"`
3. Or add: `NETLIFY_SKIP_CHECKS = "true"` (less recommended as it skips all checks)

### Option 3: Use Vercel Instead
Since Vercel is made by the Next.js team, they understand that `NEXT_PUBLIC_*` variables are meant to be public.

## Environment Variables Setup

### Required in Netlify Dashboard:
```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc... (your actual key)
```

### Optional:
```
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc... (if using server-side features)
DATABASE_URL = postgresql://... (if using Prisma)
```

## Important Notes

1. **Never commit actual keys to git** - Use environment variables in Netlify
2. **The anon key is safe to be public** - It only allows operations that RLS policies permit
3. **This is not a security issue** - It's how Supabase is designed to work

## Current Setup

- `.env` files are gitignored
- `.env.example` shows required variables without values
- Build uses environment variables from Netlify dashboard
- `netlify.toml` is configured correctly

## If Deployment Still Fails

The issue is purely with Netlify's overly aggressive secret scanner. The code and configuration are correct. Consider:

1. **Deploy to Vercel** - They understand Next.js patterns better
2. **Use GitHub Pages + GitHub Actions** - More control over the build
3. **Self-host** - Complete control over deployment

## Security Best Practices

✅ **DO:**
- Use environment variables for all keys
- Keep `.env` files in `.gitignore`
- Use Row Level Security in Supabase
- Rotate keys periodically

❌ **DON'T:**
- Commit actual keys to git
- Use service role keys in client code
- Disable RLS policies in production

## Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)