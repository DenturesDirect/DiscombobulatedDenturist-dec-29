# Reconnect to Supabase Database

## Current Status

You're currently connected to Supabase project: `qhexbhorylsvlpjkchkg`
- Connection: `aws-1-us-east-1.pooler.supabase.com`
- Patients found: 9 (test data created today)

## Step 1: Verify Current Connection

Your current DATABASE_URL points to:
```
postgresql://postgres.qhexbhorylsvlpjkchkg:****@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

**Project Reference:** `qhexbhorylsvlpjkchkg`

## Step 2: Check All Supabase Projects

**IMPORTANT:** Your 150 patients might be in a DIFFERENT Supabase project!

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Look at ALL your projects (not just the current one)
3. For each project:
   - Click on the project
   - Go to **Table Editor** → **patients** table
   - Check the row count
   - If you see ~150 patients, that's your project!

## Step 3: Get Correct Connection String

Once you find the project with your 150 patients:

1. **Go to:** Project Settings → Database
2. **Find:** "Connection string" section
3. **Select:** "Session" tab (NOT "URI" - use the pooler!)
4. **Copy** the connection string
5. **Format:** `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

## Step 4: Update DATABASE_URL

### Option A: Update in Railway (Production)
1. Railway Dashboard → Your Service → Variables
2. Find `DATABASE_URL`
3. Click Edit
4. Paste the NEW connection string
5. Save and redeploy

### Option B: Update in Local .env File
1. Open `DentureFlowPro/.env/.env`
2. Update `DATABASE_URL` with the new connection string
3. Save the file

## Step 5: Verify Connection

After updating, verify the connection:

```bash
cd DentureFlowPro
npm run check-patients
```

This should show your 150 patients if you're connected to the right project.

## Step 6: Test the App

1. Restart your app (if running locally)
2. Log in
3. Check if you see your 150 patients

## Troubleshooting

### "Connection failed"
- Make sure you're using the **Session** tab connection string (pooler)
- NOT the direct URI connection string
- The pooler string contains `pooler.supabase.com`

### "Wrong project"
- Double-check the project reference in the connection string
- Make sure it matches the project where your 150 patients are

### "Still seeing 9 patients"
- You might be connected to the wrong project
- Check all Supabase projects to find where your 150 patients are
- Update DATABASE_URL to point to the correct project

## Finding Your 150 Patients

**Before reconnecting, check:**

1. ✅ All Supabase projects in your dashboard
2. ✅ Each project's patient count
3. ✅ Which project has ~150 patients
4. ✅ Get the connection string from THAT project

**Then update DATABASE_URL to point to the correct project!**
