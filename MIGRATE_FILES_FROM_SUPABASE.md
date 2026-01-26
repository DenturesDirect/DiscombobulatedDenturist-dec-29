# 🔄 Migrate Files from Supabase to Railway Storage

## What This Does

This script will:
1. ✅ Download all files from your Supabase Storage bucket (`patient-files`)
2. ✅ Upload them to Railway Storage
3. ✅ Update database URLs to point to Railway Storage instead of Supabase

## Prerequisites

You need BOTH configured:

### Supabase (source)
- `SUPABASE_URL` or `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE`

### Railway Storage (destination)
- `RAILWAY_STORAGE_ACCESS_KEY_ID`
- `RAILWAY_STORAGE_SECRET_ACCESS_KEY`
- `RAILWAY_STORAGE_ENDPOINT`
- `RAILWAY_STORAGE_BUCKET_NAME`

## Step 1: Set Up Railway Storage First

**Before migrating, set up Railway Storage:**

1. **Create Railway Bucket** (if not done yet)
   - Railway → Create → Bucket
   - Get credentials from Bucket → Credentials tab

2. **Add Railway Storage variables to Railway Web service:**
   - `RAILWAY_STORAGE_ACCESS_KEY_ID`
   - `RAILWAY_STORAGE_SECRET_ACCESS_KEY`
   - `RAILWAY_STORAGE_ENDPOINT`
   - `RAILWAY_STORAGE_BUCKET_NAME`

## Step 2: Get Supabase Credentials

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Click your project**
3. **Go to**: Project Settings → API
4. **Copy**:
   - Project URL → `SUPABASE_URL`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Run Migration Script

**In Railway (recommended):**

1. **Go to Railway** → **Web service** → **Variables**
2. **Add Supabase variables temporarily:**
   - `SUPABASE_URL` = (your Supabase project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
3. **Railway will auto-deploy**
4. **Go to Railway** → **Web service** → **Deployments** → **Latest deployment** → **View Logs**
5. **Or use Railway CLI:**
   ```bash
   railway run npm run migrate-storage
   ```

**Or locally:**

```powershell
cd "c:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro"
$env:DATABASE_URL="your_railway_database_url"
$env:SUPABASE_URL="your_supabase_url"
$env:SUPABASE_SERVICE_ROLE_KEY="your_supabase_key"
$env:RAILWAY_STORAGE_ACCESS_KEY_ID="your_railway_access_key"
$env:RAILWAY_STORAGE_SECRET_ACCESS_KEY="your_railway_secret_key"
$env:RAILWAY_STORAGE_ENDPOINT="your_railway_endpoint"
$env:RAILWAY_STORAGE_BUCKET_NAME="your_railway_bucket_name"
npm run migrate-storage
```

## Step 4: Verify Migration

After migration:

1. **Check Railway logs** - should show migration summary
2. **Run check-files script** - should show files pointing to Railway Storage
3. **Try viewing a photo** - should work!

## What Gets Migrated

- ✅ All images/photos from Supabase Storage
- ✅ All PDFs and documents
- ✅ Database URLs updated to Railway Storage paths

## After Migration

**You can remove Supabase variables** from Railway once migration is complete (if you want).

---

**This will migrate your ~200 files from Supabase to Railway Storage!**
