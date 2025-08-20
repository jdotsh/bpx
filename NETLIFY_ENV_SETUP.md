# Netlify Environment Variables Setup

## Quick Setup Instructions

### Step 1: Go to Netlify Dashboard
1. Open [Netlify Dashboard](https://app.netlify.com)
2. Select your site (bpx)
3. Go to **Site configuration** → **Environment variables**

### Step 2: Add These Required Variables

Click "Add a variable" for each one and paste these exactly:

#### 🔴 REQUIRED (Must add these or build will fail)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://adjdqxptoaecafmmjgtf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkamRxeHB0b2FlY2FmbW1qZ3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTgzOTMsImV4cCI6MjA3MTEzNDM5M30.L_PMZMsTkFklUOx9lNll-s1NiaW9HnGifk-bB5tdIQ` |

#### 🟡 RECOMMENDED (For full functionality)

| Key | Value |
|-----|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkamRxeHB0b2FlY2FmbW1qZ3RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU1ODM5MywiZXhwIjoyMDcxMTM0MzkzfQ.jJPSP4jaKeEx41KXpcFtlh0HhvbVbkbBeBKPboApocs` |
| `DATABASE_URL` | `postgresql://postgres.adjdqxptoaecafmmjgtf:Astaghfirullah1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |

### Step 3: Trigger New Deployment

After adding the variables:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

Or use the command line:
```bash
git push origin main
```

### Step 4: Verify Deployment

The build should now succeed! Check the deploy logs to confirm.

## Testing Environment Variables Locally

Run this command to validate your local environment:
```bash
node scripts/validate-env.js
```

## Security Notes

- ✅ These environment variables are safe to add to Netlify
- ✅ The anon key is meant to be public (used in frontend)
- ⚠️  Never commit the service role key to Git
- ⚠️  Keep your `.env.local` file in `.gitignore`

## Troubleshooting

If the build still fails after adding these variables:

1. **Check the build logs** - Look for the specific error message
2. **Clear build cache** - In Netlify: Deploys → Trigger deploy → Clear cache and deploy site
3. **Verify variable names** - Make sure there are no typos in the variable names
4. **Check for spaces** - Ensure no leading/trailing spaces in the values

## Need Help?

If you're still having issues, the build logs will show the exact error. Common issues:

- Missing required variables
- Typos in variable names
- Authentication errors with Supabase
- Build timeout (increase in Site settings → Build & deploy)