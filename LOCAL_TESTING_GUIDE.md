# 🧪 Local Testing Guide - BPMN Studio Web

## Option 1: Full Local Stack with Supabase (Recommended)
**Time: 15 minutes | Full functionality**

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- npm or yarn

### Step 1: Set Up Local Supabase
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Initialize and start local Supabase
supabase init
supabase start
```

This will start:
- Local PostgreSQL database (port 54322)
- Local Auth service (port 54321)
- Local Storage service
- Supabase Studio (port 54323)
- Email testing server (port 54324)

### Step 2: Get Local Credentials
```bash
# View your local credentials
supabase status
```

You'll see output like:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
anon key: eyJ...
service_role key: eyJ...
```

### Step 3: Configure Environment
```bash
# Create local environment file
cat > .env.local << 'EOF'
# Local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[copy anon key from above]
SUPABASE_SERVICE_ROLE_KEY=[copy service_role key from above]

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Email (local testing - emails visible at http://localhost:54324)
RESEND_API_KEY=re_local_test
EMAIL_FROM=BPMN Studio <noreply@localhost>

# Optional - leave empty for local testing
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
STRIPE_SECRET_KEY=sk_test_local
STRIPE_WEBHOOK_SECRET=whsec_local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_local
EOF
```

### Step 4: Set Up Database
```bash
# Run migrations
npx prisma generate
npx prisma db push

# Or run the SQL directly in Supabase Studio (http://localhost:54323)
```

Copy this SQL to Supabase Studio SQL Editor:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own projects" ON projects
  FOR ALL USING (auth.uid() = profile_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Step 5: Start the Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 6: Access the Application
Open your browser to:
- **Application**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (database management)
- **Email Inbox**: http://localhost:54324 (see sent emails)

---

## Option 2: Minimal Test (Without External Services)
**Time: 5 minutes | Limited functionality**

### Step 1: Use Mock Environment
```bash
# Create minimal environment
cat > .env.local << 'EOF'
# Minimal config for UI testing
NEXT_PUBLIC_SUPABASE_URL=https://mock.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock_anon_key
SUPABASE_SERVICE_ROLE_KEY=mock_service_key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF
```

### Step 2: Start Application
```bash
npm install
npm run dev
```

**Note**: With mock config, authentication and data persistence won't work, but you can test the UI and BPMN editor.

---

## 📋 Testing Checklist

### 1. Authentication Testing
- [ ] **Sign Up Flow**
  ```
  1. Go to http://localhost:3000/auth/signup
  2. Enter email: test@example.com
  3. Enter password: password123
  4. Click "Create Account"
  5. Check email at http://localhost:54324
  6. Verify account creation in Supabase Studio
  ```

- [ ] **Sign In Flow**
  ```
  1. Go to http://localhost:3000/auth/signin
  2. Use credentials from signup
  3. Verify redirect to dashboard
  4. Check session in browser DevTools
  ```

- [ ] **Password Reset**
  ```
  1. Click "Forgot Password"
  2. Enter email
  3. Check reset email at http://localhost:54324
  4. Follow reset link
  5. Set new password
  ```

### 2. BPMN Editor Testing
- [ ] **Create Diagram**
  ```
  1. Go to http://localhost:3000/studio
  2. Drag elements from palette
  3. Connect elements with arrows
  4. Double-click to edit labels
  5. Test undo/redo
  ```

- [ ] **Import/Export**
  ```
  1. Create a diagram
  2. Export as BPMN XML
  3. Export as SVG
  4. Export as PNG
  5. Import previously exported XML
  ```

- [ ] **Save Project**
  ```
  1. Create diagram
  2. Click Save
  3. Enter project name
  4. Verify in database (Supabase Studio)
  5. Reload page and verify persistence
  ```

### 3. API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Should return:
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "auth": { "status": "ok" },
    "redis": { "status": "degraded" },
    "environment": { "status": "ok" }
  }
}
```

### 4. Performance Testing
```bash
# Build and check size
npm run build

# Start production build locally
npm run start

# Check performance:
# - Page load < 2 seconds
# - BPMN editor responsive
# - No console errors
```

### 5. Error Handling Testing
- [ ] Try invalid login (wrong password)
- [ ] Try duplicate email signup
- [ ] Try saving without authentication
- [ ] Check rate limiting (multiple rapid requests)

---

## 🔍 Debugging Tools

### View Logs
```bash
# Application logs
npm run dev

# Supabase logs
supabase logs --follow

# Database queries
# Go to http://localhost:54323 > SQL Editor
```

### Check Database
```sql
-- In Supabase Studio (http://localhost:54323)

-- View users
SELECT * FROM auth.users;

-- View profiles
SELECT * FROM profiles;

-- View projects
SELECT * FROM projects;
```

### Monitor Emails
```
http://localhost:54324
All emails sent locally appear here instantly
```

### Browser DevTools
```javascript
// Check session in Console
localStorage.getItem('supabase.auth.token')

// Check API calls in Network tab
// Filter by: Fetch/XHR

// Check for errors in Console
```

---

## 🚦 Ready for Production Checklist

If all these work locally, you're ready to deploy:

- ✅ User can sign up and receive email
- ✅ User can sign in successfully
- ✅ BPMN editor loads and functions
- ✅ Diagrams can be saved and loaded
- ✅ Export functions work (XML, SVG, PNG)
- ✅ Health endpoint returns healthy
- ✅ No console errors in browser
- ✅ Build completes without errors

---

## 🆘 Troubleshooting

### Issue: "Failed to fetch" errors
```bash
# Check if Supabase is running
supabase status

# Restart if needed
supabase stop
supabase start
```

### Issue: Database connection failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Reset database
supabase db reset
```

### Issue: Emails not showing
```bash
# Check Inbucket is running
# Open http://localhost:54324
# Emails appear here instantly
```

### Issue: Build errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## 🎯 Quick Test Commands

```bash
# Complete local setup in one command
npm install && \
supabase start && \
npx prisma db push && \
npm run dev

# Then open:
# - App: http://localhost:3000
# - Database: http://localhost:54323
# - Emails: http://localhost:54324
```

---

## ✅ Next Steps

Once local testing is complete:

1. **Deploy to Staging**
   ```bash
   ./scripts/deploy-production.sh staging
   ```

2. **Deploy to Production**
   ```bash
   ./scripts/deploy-production.sh production
   ```

The application is fully functional locally with Supabase!