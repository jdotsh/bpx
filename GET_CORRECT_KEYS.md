# 🔴 URGENT: Get Your Correct Supabase Keys

## The Issue
Your service role key is in the wrong format. You provided:
- `sb_secret_FpVMrFi72b1wNyGyggi5YA_1unNjjbf` (This is NOT a service role key)
- `sb_publishable_6zEtvmzhrVB4SvMZDfuOcw_ny77fwi3` (This is NOT needed)

## Get the Correct Keys NOW

### 1. Go to Your Supabase Dashboard
Click here: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/settings/api

### 2. Find These TWO Keys Only:

#### A. Project URL (You have this ✅)
```
https://adjdqxptoaecafmmjgtf.supabase.co
```

#### B. Anon Key (You have this ✅)
Look for: **anon** `public`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkamRxeHB0b2FlY2FmbW1qZ3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTgzOTMsImV4cCI6MjA3MTEzNDM5M30.L_PMZMsTkFklUOx9lNll-s1NiaW9HnGifk-bB5tdIQ
```

#### C. Service Role Key (You need this ❌)
Look for: **service_role** `secret`

**IMPORTANT:** The service role key should:
- Start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- Be a LONG string (200+ characters)
- Have THREE parts separated by dots (.)
- Look similar to the anon key but longer

### 3. What the Keys Look Like

**CORRECT Service Role Key Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkamRxeHB0b2FlY2FmbW1qZ3RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNTU1ODM5MywiZXhwIjoyMDcxMTM0MzkzfQ.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**WRONG (what you provided):**
```
sb_secret_FpVMrFi72b1wNyGyggi5YA_1unNjjbf  ❌ This is NOT a service role key
sb_publishable_6zEtvmzhrVB4SvMZDfuOcw_ny77fwi3  ❌ This is NOT needed
```

## Where to Find in Dashboard

1. Go to: **Settings** → **API**
2. You'll see a table with:
   ```
   Project URL         https://adjdqxptoaecafmmjgtf.supabase.co
   Project API keys    
   ├─ anon public     eyJhbGci... (short key) 
   └─ service_role    eyJhbGci... (LONG key) ← YOU NEED THIS ONE
   ```

3. Click **Reveal** next to `service_role`
4. Copy the ENTIRE key (it's very long!)

## Update Your .env.local

Replace the incorrect key:
```env
# WRONG - Remove this:
SUPABASE_SERVICE_ROLE_KEY=sb_secret_FpVMrFi72b1wNyGyggi5YA_1unNjjbf

# CORRECT - Add the real service role key:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(rest of long key)
```

## Quick Test

After updating, restart the server and check:
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

---

**⏱️ This will take 1 minute to fix**

The keys you provided (`sb_secret_` and `sb_publishable_`) appear to be from a different system or older Supabase format. You need the JWT-format service role key!