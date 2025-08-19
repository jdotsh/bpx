# ✅ Complete Your Supabase Setup - Final Steps

## You've Already Done:
- ✅ Created Supabase project
- ✅ Got your project URL: `adjdqxptoaecafmmjgtf.supabase.co`
- ✅ Got your anon key

## Now Complete These Steps:

### 1️⃣ Get Missing Credentials (2 minutes)

Go to your Supabase Dashboard:
https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf

#### A. Get Service Role Key:
1. Click **Settings** (gear icon) → **API**
2. Find **Service role key** section
3. Click **Reveal** and copy the key
4. It starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### B. Get Database Password:
1. Click **Settings** → **Database**
2. Find **Connection string** section
3. Copy your database password (you set this when creating the project)

### 2️⃣ Run Database Setup (3 minutes)

1. Go to your Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy ALL content from `supabase-setup.sql` file I created
5. Paste it in the SQL Editor
6. Click **Run** button
7. You should see "Database setup complete!" message

### 3️⃣ Configure Authentication (2 minutes)

1. In Supabase Dashboard, click **Authentication** → **Settings**
2. Make these settings:

#### Email Settings:
- ✅ Enable email signup
- ✅ Enable email confirmations  
- ✅ Double email confirmation: OFF (easier testing)

#### Site URL:
- Set to: `http://localhost:3000` (for now)
- Later change to your production domain

#### Redirect URLs:
Add these (one per line):
```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

3. Click **Save**

### 4️⃣ Update Your .env.local File (1 minute)

Replace the placeholders with your actual values:

```env
# KEEP THESE (already correct):
NEXT_PUBLIC_SUPABASE_URL=https://adjdqxptoaecafmmjgtf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkamRxeHB0b2FlY2FmbW1qZ3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTgzOTMsImV4cCI6MjA3MTEzNDM5M30.L_PMZMsTkFklUOx9lNll-s1NiaW9HnGifk-bB5tdIQ

# ADD THESE (get from step 1):
SUPABASE_SERVICE_ROLE_KEY=[YOUR SERVICE ROLE KEY FROM STEP 1A]

# Database URLs (replace [YOUR-PASSWORD] with your actual password from step 1B):
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.adjdqxptoaecafmmjgtf.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.adjdqxptoaecafmmjgtf.supabase.co:5432/postgres
```

### 5️⃣ Restart Your Dev Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
# Start with new config
npm run dev
```

### 6️⃣ Test Everything Works! (2 minutes)

#### A. Check Health:
```bash
curl http://localhost:3000/api/health
```

Should show:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "auth": { "status": "ok" }
  }
}
```

#### B. Test Sign Up:
1. Go to: http://localhost:3000/auth/signup
2. Enter a REAL email address
3. Enter password
4. Click "Create Account"
5. **CHECK YOUR EMAIL** - you should receive verification from Supabase
6. Click the link in the email
7. You can now sign in!

### 7️⃣ Verify in Supabase Dashboard

1. Go to **Authentication** → **Users**
2. You should see your new user
3. Go to **Table Editor** → **profiles**
4. You should see the user profile created automatically

## 🎯 Success Checklist

After completing these steps:
- [ ] Service role key added to .env.local
- [ ] Database password added to .env.local
- [ ] SQL setup script executed successfully
- [ ] Authentication settings configured
- [ ] Health check shows "healthy"
- [ ] Sign up sends verification email
- [ ] User appears in Supabase dashboard

## 🚨 Troubleshooting

### Not receiving emails?
1. Check spam folder
2. In Supabase: **Authentication** → **Logs** to see if email was sent
3. Make sure email confirmations are enabled

### Database connection error?
1. Verify password is correct
2. Check if project is not paused (free tier pauses after inactivity)
3. Try connection string without `?pgbouncer=true` first

### Health check failing?
1. Make sure all environment variables are set
2. Restart dev server after changing .env.local
3. Check Supabase dashboard that project is running

## ✅ Once Everything Works

You'll have:
- Real authentication with email verification
- Database storing projects
- BPMN diagrams persisting
- Production-ready deployment

**Your app is then ready to deploy to Vercel!**

## Need Help?

Check:
1. Supabase Logs: Dashboard → **Logs** → **Recent logs**
2. Browser Console: F12 → Console tab
3. Server logs: Terminal where `npm run dev` is running