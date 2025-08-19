# 🚀 DEPLOY TO PRODUCTION - COMPLETE GUIDE

## Step 1: Create Supabase Account (5 minutes)

### A. Sign Up for Supabase
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or Email
4. Verify your email

### B. Create New Project
1. Click "New Project"
2. Fill in:
   - **Name**: `bpmn-studio-prod`
   - **Database Password**: `[SAVE THIS PASSWORD]`
   - **Region**: Choose closest to your users (e.g., US East)
   - **Plan**: Free tier (upgrade later if needed)
3. Click "Create new project"
4. Wait 2 minutes for setup

### C. Get Your Credentials
Once project is ready, go to **Settings > API**:

```bash
# You'll see these values:
Project URL: https://xxxxxxxxxxxxx.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 2: Configure Database (5 minutes)

### A. Open SQL Editor
1. In Supabase Dashboard, click **SQL Editor**
2. Click "New query"

### B. Run Database Setup
Copy and paste this ENTIRE SQL script:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  bpmn_xml TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'FREE',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_projects_profile_id ON public.projects(profile_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can CRUD own projects" ON public.projects
  FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Public projects viewable" ON public.projects
  FOR SELECT USING (is_public = true);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = profile_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.subscriptions (profile_id, plan, status)
  VALUES (NEW.id, 'FREE', 'ACTIVE');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('bpmn-files', 'bpmn-files', false)
ON CONFLICT DO NOTHING;
```

3. Click **Run** button
4. You should see "Success. No rows returned"

## Step 3: Configure Email Settings (3 minutes)

### A. Enable Email in Supabase
1. Go to **Authentication > Settings**
2. Under **Email Auth**:
   - ✅ Enable email signup
   - ✅ Enable email confirmations
   - ✅ Enable password recovery

### B. Configure Email Templates (Optional)
1. Go to **Authentication > Email Templates**
2. You can customize, but defaults work fine

### C. Set Redirect URLs
1. Still in **Authentication > Settings**
2. Add to **Site URL**: `https://your-domain.com`
3. Add to **Redirect URLs**:
   ```
   http://localhost:3000/**
   https://your-domain.com/**
   ```

## Step 4: Update Environment Variables (2 minutes)

### A. Create Production Environment File
```bash
# Copy this to .env.production.local
cp .env.local .env.production.local
```

### B. Update with Real Credentials
Edit `.env.production.local`:

```env
# REPLACE THESE WITH YOUR ACTUAL VALUES FROM SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database URL (from Supabase Settings > Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# Your production domain
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Environment
NODE_ENV=production
```

## Step 5: Test Locally with Production Config (2 minutes)

```bash
# Stop current dev server
# Press Ctrl+C

# Test with production config
NODE_ENV=production npm run dev

# Test signup
# 1. Go to http://localhost:3000/auth/signup
# 2. Sign up with real email
# 3. CHECK YOUR EMAIL - you should receive verification
# 4. Click the link to verify
# 5. Sign in
```

## Step 6: Deploy to Vercel (5 minutes)

### A. Install Vercel CLI
```bash
npm i -g vercel
```

### B. Deploy
```bash
# In your project directory
vercel

# Answer prompts:
? Set up and deploy "~/Desktop/mvp"? [Y/n] Y
? Which scope? [Select your account]
? Link to existing project? [y/N] N
? Project name? bpmn-studio-web
? In which directory is your code? ./
? Want to override settings? [y/N] N
```

### C. Set Environment Variables in Vercel
1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Settings > Environment Variables**
4. Add each variable from `.env.production.local`:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - DATABASE_URL
   - etc.

### D. Deploy to Production
```bash
vercel --prod
```

## Step 7: Verify Everything Works (5 minutes)

### A. Check Health Endpoint
```bash
# Replace with your domain
curl https://your-app.vercel.app/api/health

# Should return:
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "auth": { "status": "ok" }
  }
}
```

### B. Test Full Flow
1. Go to your production URL
2. Sign up with new email
3. Check email for verification
4. Click verification link
5. Sign in
6. Create BPMN diagram
7. Save project
8. Reload and verify it persists

## 🎯 VERIFICATION CHECKLIST

Run this after setup:
```bash
./verify-production-ready.sh
```

All checks should pass:
- [x] TypeScript Compilation: ✅
- [x] Production Build: ✅
- [x] Supabase URL: ✅ (Real URL)
- [x] Database URL: ✅ (Connected)
- [x] API Health: ✅ (Healthy)
- [x] Email Sending: ✅ (Working)

## 🚨 TROUBLESHOOTING

### Issue: Not receiving emails
**Solution:**
1. Check Supabase Dashboard > Authentication > Logs
2. Check spam folder
3. Verify email settings in Supabase

### Issue: Database connection failed
**Solution:**
1. Check password is correct
2. Verify connection pooling is enabled
3. Check Supabase Dashboard > Database for status

### Issue: Users can't sign up
**Solution:**
1. Check Supabase Auth settings
2. Verify redirect URLs are configured
3. Check browser console for errors

## 📊 MONITORING

### Supabase Dashboard
- **Authentication > Users**: See all signups
- **Database > Query Performance**: Monitor queries
- **Logs**: Check for errors

### Vercel Dashboard
- **Functions**: Monitor API calls
- **Analytics**: Track performance
- **Logs**: View real-time logs

## ✅ SUCCESS CRITERIA

You know deployment is successful when:
1. ✅ Health check returns "healthy"
2. ✅ Users receive verification emails
3. ✅ Sign up/sign in works
4. ✅ BPMN diagrams save to database
5. ✅ Projects persist after reload

## 🎉 CONGRATULATIONS!

Once all checks pass, your application is:
- **LIVE** in production
- **SECURE** with authentication
- **SCALABLE** with Supabase
- **MONITORED** with health checks
- **READY** for users!

**Total time: ~30 minutes**