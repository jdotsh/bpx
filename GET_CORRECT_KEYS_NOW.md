# 🚨 URGENT: YOUR KEYS DON'T MATCH YOUR PROJECT!

## The Problem:
The keys in your `.env.local` don't match your Supabase project `adjdqxptoaecafmmjgtf`

## GET THE CORRECT KEYS NOW (2 minutes):

### Step 1: Open Your Supabase Project
👉 **CLICK HERE:** https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/settings/api

### Step 2: Copy These TWO Keys

Look for this table in the dashboard:

```
Project API keys
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
anon        eyJhbGci...    public     [Copy]
service_role eyJhbGci...    secret     [Reveal] [Copy]
```

#### A. Copy the "anon" key (public):
- Click the **Copy** button next to "anon"
- This key should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

#### B. Copy the "service_role" key (secret):
- Click **Reveal** first
- Then click **Copy**
- This key should also start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### Step 3: Update Your `.env.local`

Replace the ENTIRE content with this (paste your keys):

```env
# BPMN Studio Web - Production Configuration
# ==========================================

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase - PASTE YOUR KEYS HERE
NEXT_PUBLIC_SUPABASE_URL=https://adjdqxptoaecafmmjgtf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE

# Database URLs
DATABASE_URL=postgresql://postgres.adjdqxptoaecafmmjgtf:d0tuc9CsNxspYzkQ@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.adjdqxptoaecafmmjgtf:d0tuc9CsNxspYzkQ@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

# Email (Supabase handles this)
EMAIL_FROM=BPMN Studio <noreply@adjdqxptoaecafmmjgtf.supabase.co>
```

### Step 4: Restart the Server

```bash
# Stop server: Press Ctrl+C
# Start again:
npm run dev
```

### Step 5: Test Again
Go to: http://localhost:3000/test-direct-signup

## ⚠️ IMPORTANT NOTES:

### Make Sure:
1. You're copying from the RIGHT project (adjdqxptoaecafmmjgtf)
2. Both keys start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
3. The service_role key is LONGER than the anon key
4. You're NOT using keys that start with `sb_secret_` or `sb_publishable_`

### If You See Different Key Formats:
- `sb_secret_...` ❌ WRONG
- `sb_publishable_...` ❌ WRONG  
- `sbp_...` ❌ WRONG
- `eyJhbGci...` ✅ CORRECT (JWT format)

## 🔍 Quick Verification:

After updating keys, run:
```bash
curl http://localhost:3000/api/auth/debug
```

Should show:
```json
{
  "status": "ok",
  "message": "Configuration looks good"
}
```

## 📝 What Your Keys Should Look Like:

### Anon Key (shorter):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkamRxeHB0b2FlY2FmbW1qZ3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3XXXXXXXXX,ImV4cCI6MjA3XXXXXXX}.XXXXXXXXXXXXXXXXXXXXXX
```

### Service Role Key (longer):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkamRxeHB0b2FlY2FmbW1qZ3RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcXXXXXXXXX,ImV4cCI6MjA3XXXXXXX}.YYYYYYYYYYYYYYYYYYYYYY
```

---

**GO GET THE KEYS NOW:** https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/settings/api

The keys you have are for a DIFFERENT project or are corrupted!