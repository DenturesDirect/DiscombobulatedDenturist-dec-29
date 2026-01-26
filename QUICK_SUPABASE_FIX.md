# ⚡ QUICK FIX: Set Up Supabase Storage (5 Minutes)

## What You Need (2 Variables)

1. `SUPABASE_URL` (or `SUPABASE_PROJECT_URL`)
2. `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_ROLE`)

## Step 1: Get Supabase Credentials (2 minutes)

1. **Go to**: https://supabase.com/dashboard
2. **Click your project** (or create one if you don't have it)
3. **Go to**: Project Settings → API
4. **Copy these:**
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role key** (secret) → This is your `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Create Storage Bucket (1 minute)

1. **Still in Supabase Dashboard**
2. **Go to**: Storage (left sidebar)
3. **Click "New bucket"**
4. **Name it**: `patient-files`
5. **Make it**: Private (not public)
6. **Click "Create bucket"**

## Step 3: Add Variables to Railway (2 minutes)

1. **Go to Railway**: https://railway.app/dashboard
2. **Click your project** → **Web service** → **Variables tab**
3. **Add these 2 variables:**
   - Name: `SUPABASE_URL` → Value: (paste from Step 1)
   - Name: `SUPABASE_SERVICE_ROLE_KEY` → Value: (paste from Step 1)

## Step 4: Deploy

Railway will auto-deploy. Wait 1-2 minutes.

## Step 5: Test

1. **Check Railway logs** - should see: `💾 Using Supabase Storage for file uploads`
2. **Try uploading a photo** - should work!
3. **Try viewing an existing photo** - should work!

---

## That's It!

Your 217 photos will be accessible once Supabase Storage is configured.

**If you get stuck, tell me which step and I'll help immediately.**
