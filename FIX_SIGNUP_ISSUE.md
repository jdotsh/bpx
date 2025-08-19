# 🔧 FIXING SIGNUP ISSUE

## The Problem:
"Invalid API key" error when signing up. This suggests a mismatch between the keys or a configuration issue.

## Diagnostic Test Created:

### 🧪 TEST THIS NOW:
**Go to:** http://localhost:3000/test-direct-signup

This test page:
- Uses Supabase client directly (bypasses our API)
- Creates random test email
- Shows exact error if any

### What This Will Tell Us:

#### If Direct Signup WORKS ✅:
- Supabase is configured correctly
- Issue is in our API route code
- Fix: Update the API route

#### If Direct Signup FAILS ❌:
- Supabase configuration issue
- Possibly wrong project or keys
- Fix: Verify Supabase project settings

## Alternative Solution - Use UI Directly:

Since the "Invalid API key" might be a service role key issue, try this:

### Option 1: Test Direct Signup
1. Go to: http://localhost:3000/test-direct-signup
2. Click "Test Direct Signup"
3. See if it works

### Option 2: Check Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/settings/api
2. Verify you're looking at the RIGHT project
3. Check that the URL matches: `adjdqxptoaecafmmjgtf.supabase.co`

### Option 3: Verify Authentication Settings
1. Go to: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/auth/configuration
2. Make sure:
   - Email signup is enabled ✅
   - Email confirmations enabled ✅
   - Site URL is set to: `http://localhost:3000`

## Possible Causes:

1. **Service Role Key Mismatch**
   - The service role key might not match this project
   - Solution: Get the correct key from dashboard

2. **RLS Policies**
   - Row Level Security might be blocking
   - Solution: Check if policies allow inserts

3. **Email Provider Issue**
   - Supabase email service might be down
   - Solution: Wait or use magic link

## Quick Fix - Reset Keys:

If nothing works, let's get fresh keys:

1. Go to: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/settings/api
2. Copy the **anon** key (public)
3. Copy the **service_role** key (secret)
4. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=[paste anon key]
SUPABASE_SERVICE_ROLE_KEY=[paste service role key]
```

5. Restart server:
```bash
# Ctrl+C to stop
npm run dev
```

## Test Links:

| Test | URL |
|------|-----|
| Direct Test | http://localhost:3000/test-direct-signup |
| Normal Signup | http://localhost:3000/auth/signup |
| Supabase Status | http://localhost:3000/test-supabase |

---

**TRY THE DIRECT TEST FIRST:** http://localhost:3000/test-direct-signup

This will tell us exactly where the problem is!