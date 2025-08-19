# 🔴 ACTION REQUIRED: Run SQL Setup in Supabase

Your database password is configured! Now you need to create the database tables.

## Step 1: Open Supabase SQL Editor
Click this link to open the SQL Editor directly:
https://supabase.com/dashboard/project/adjdqxptoaecafmmjgtf/sql/new

## Step 2: Copy the SQL Script
Copy ALL content from the file: `supabase-setup.sql`

## Step 3: Run the SQL
1. Paste the entire SQL script in the editor
2. Click the **RUN** button (bottom right)
3. You should see "Database setup complete!" message

## Step 4: Verify Success
After running the SQL, check:
http://localhost:3000/api/health

Should show:
- ✅ database: "ok"
- ✅ auth: "ok"

## Step 5: Test Sign Up
1. Go to: http://localhost:3000/auth/signup
2. Use your REAL email address
3. Check your email for verification link

---

⏱️ This will take 2-3 minutes total.