# Supabase Setup for Production Authentication

## 1. Create Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project:

1. Sign up/Login to Supabase
2. Click "New Project"
3. Enter project details:
   - Name: `bpmn-studio-web`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
   - Plan: Free tier for testing, Pro for production

## 2. Get Your API Keys

Once project is created, go to Settings > API:

```env
# Copy these to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

## 3. Database Schema

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  bpmn_xml TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PROFESSIONAL', 'ENTERPRISE')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELED')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX idx_projects_profile_id ON public.projects(profile_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_subscriptions_profile_id ON public.subscriptions(profile_id);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Public projects are viewable by all" ON public.projects
  FOR SELECT USING (is_public = true);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = profile_id);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create free subscription
  INSERT INTO public.subscriptions (profile_id, plan, status)
  VALUES (NEW.id, 'FREE', 'ACTIVE');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

## 4. Authentication Settings

In Supabase Dashboard > Authentication > Settings:

### Email Auth
- Enable Email/Password authentication
- Configure email templates:
  - Confirmation email
  - Password reset
  - Magic link

### OAuth Providers (Optional)
1. Go to Authentication > Providers
2. Enable Google:
   - Get OAuth credentials from Google Console
   - Add redirect URL: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
3. Enable GitHub:
   - Create OAuth App in GitHub Settings
   - Add callback URL

### Email Templates
Customize in Authentication > Email Templates:

**Confirmation Email:**
```html
<h2>Confirm your email for BPMN Studio</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm email</a></p>
```

## 5. Storage Buckets (for file uploads)

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('bpmn-files', 'bpmn-files', false),
  ('exports', 'exports', false);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can access their own BPMN files" ON storage.objects
  FOR ALL USING (bucket_id = 'bpmn-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 6. Local Development Setup

For local development with Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in project
supabase init

# Start local Supabase
supabase start

# This gives you local URLs:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio: http://localhost:54323
```

## 7. Environment Variables

Complete `.env.local`:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Database (from Supabase settings)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production deployment
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 8. Test Authentication Flow

1. **Sign Up:**
   - User enters email/password
   - Supabase sends confirmation email
   - User clicks link to verify
   - Profile automatically created via trigger

2. **Sign In:**
   - Email/password or OAuth
   - Session stored in cookies
   - Automatic refresh

3. **Password Reset:**
   - User requests reset
   - Email sent with reset link
   - User sets new password

## 9. Security Checklist

- [x] RLS enabled on all tables
- [x] Policies restrict data access
- [x] Service role key only on server
- [x] HTTPS in production
- [x] Rate limiting configured
- [x] Email verification required
- [x] Strong password requirements

## 10. Monitoring

In Supabase Dashboard:
- Authentication > Users - Monitor signups
- Database > Query Performance - Track slow queries
- Storage > Usage - Monitor file uploads
- Logs - Check for errors

## Ready for Production!

With these steps completed, you have:
- ✅ Secure authentication with email verification
- ✅ PostgreSQL database with proper schema
- ✅ Row-level security
- ✅ OAuth support
- ✅ File storage
- ✅ Automatic user profile creation
- ✅ Subscription management ready