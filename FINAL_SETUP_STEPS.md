# 🔴 IMMEDIATE ACTION REQUIRED - Complete Supabase Setup

## Current Status
✅ Supabase project created (adjdqxptoaecafmmjgtf)
✅ Auth service connected  
❌ Database not connected (missing password)
❌ Email verification not tested

## Step 1: Get Your Database Password (1 minute)

You set a database password when you created your Supabase project. If you forgot it:

1. Go to: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/settings/database
2. Click **Reset database password**
3. Set a new password (save it!)
4. Wait 1 minute for it to apply

## Step 2: Update .env.local with Database Password (1 minute)

Open `.env.local` and replace `[YOUR-DATABASE-PASSWORD]` with your actual password:

```env
# Change this line:
DATABASE_URL=postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.adjdqxptoaecafmmjgtf.supabase.co:6543/postgres?pgbouncer=true

# To this (example with password "MySecurePass123"):
DATABASE_URL=postgresql://postgres:MySecurePass123@db.adjdqxptoaecafmmjgtf.supabase.co:6543/postgres?pgbouncer=true

# Also update this line:
DIRECT_URL=postgresql://postgres:MySecurePass123@db.adjdqxptoaecafmmjgtf.supabase.co:5432/postgres
```

## Step 3: Run Database Setup SQL (3 minutes)

1. Go to: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/sql/new
2. Copy ALL content from `supabase-setup.sql` file
3. Paste it in the SQL Editor
4. Click **RUN** button
5. You should see "Database setup complete!" message

## Step 4: Configure Email Settings (2 minutes)

1. Go to: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/auth/url-configuration
2. Set **Site URL** to: `http://localhost:3000`
3. Add to **Redirect URLs** (one per line):
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```
4. Click **Save**

## Step 5: Restart Dev Server (30 seconds)

```bash
# Stop current server: Press Ctrl+C in terminal
# Start again:
npm run dev
```

## Step 6: Verify Everything Works (2 minutes)

### A. Check Health Status
Visit: http://localhost:3000/test-supabase

You should see:
- ✅ Supabase URL
- ✅ Anon Key  
- ✅ Service Role Key
- ✅ Auth service connected
- ✅ Database connected

### B. Test Authentication
1. Go to: http://localhost:3000/auth/signup
2. Sign up with YOUR REAL EMAIL
3. Check your email (including spam folder)
4. Click verification link
5. Sign in at: http://localhost:3000/auth/signin

## ⚠️ IMPORTANT NOTES

1. **Use a REAL email address** - Supabase sends actual emails
2. **Check spam folder** - First email might go to spam
3. **Database password** - Must not contain special characters like @ or #
4. **Email delays** - First email can take 1-2 minutes

## 🆘 If Email Doesn't Arrive

1. Check Supabase Logs:
   https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/logs/edge-logs

2. Verify email is enabled:
   https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/auth/configuration
   - Enable email signup ✅
   - Enable email confirmations ✅

3. Check Auth Logs:
   https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/auth/users
   - You should see your signup attempt

## ✅ Success Indicators

After completing these steps:
1. Health check shows all green
2. Sign up sends verification email
3. Email arrives within 2 minutes
4. Clicking link verifies account
5. You can sign in successfully
6. BPMN diagrams save to database

## 📞 Quick Links

- Supabase Dashboard: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf
- SQL Editor: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/sql/new
- Auth Settings: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/auth/configuration
- Database Settings: https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/settings/database

**TIME REQUIRED: 10 minutes total**