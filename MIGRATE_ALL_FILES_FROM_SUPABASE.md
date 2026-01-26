# 🔄 Migrate ALL Files from Supabase Storage to Railway Storage

## What This Does

This script will migrate **ALL files** from your Supabase Storage bucket to Railway Storage, including:
- ✅ Files that are in the database
- ✅ Files that might be in Supabase but not in database
- ✅ Updates database URLs to point to Railway Storage

## Quick Setup

### Step 1: Set Up Railway Storage

1. **Create Railway Bucket**:
   - Railway → Create → Bucket
   - Get credentials from Bucket → Credentials tab

2. **Add to Web service Variables:**
   - `RAILWAY_STORAGE_ACCESS_KEY_ID`
   - `RAILWAY_STORAGE_SECRET_ACCESS_KEY`
   - `RAILWAY_STORAGE_ENDPOINT`
   - `RAILWAY_STORAGE_BUCKET_NAME`

### Step 2: Add Supabase Variables (Temporarily)

**Add to Railway Web service Variables:**
- `SUPABASE_URL` = (your Supabase project URL)
- `SUPABASE_SERVICE_ROLE_KEY` = (your Supabase service role key)

### Step 3: Run Migration

**Option A: Via Railway CLI**
```bash
railway run npm run migrate-storage
```

**Option B: Via Railway Dashboard**
1. Railway will auto-deploy after adding variables
2. Check logs - migration will run on startup (or we can trigger it manually)

**Option C: Locally**
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

## What Happens

1. **Script connects to Supabase Storage**
2. **Downloads each file** from Supabase bucket
3. **Uploads to Railway Storage**
4. **Updates database** with new Railway Storage URLs
5. **Shows progress** for each file

## After Migration

- ✅ All files moved to Railway Storage
- ✅ Database URLs updated
- ✅ Photos should work in your app
- ✅ You can remove Supabase variables (optional)

---

**This will migrate your ~200 files from Supabase to Railway Storage!**
