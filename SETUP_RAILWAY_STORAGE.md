# 🚀 Set Up Railway Storage for Your Photos

## What You Need

Your app needs **3 environment variables** to access Railway Storage:
1. `RAILWAY_STORAGE_ACCESS_KEY_ID`
2. `RAILWAY_STORAGE_SECRET_ACCESS_KEY`
3. `RAILWAY_STORAGE_ENDPOINT`

## Step-by-Step Setup

### Step 1: Create Railway Storage Bucket

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click on your project** (the one with Postgres)
3. **Click "New"** (top right)
4. **Select "Storage"** or **"S3 Bucket"**
5. **Name it** (e.g., `patient-files` or `dental-photos`)
6. **Click "Create"**

### Step 2: Get Your Storage Credentials

After creating the bucket:

1. **Click on the Storage service** you just created
2. **Go to "Variables" tab** (or "Settings" → "Variables")
3. **You should see these variables automatically created:**
   - `RAILWAY_STORAGE_ACCESS_KEY_ID`
   - `RAILWAY_STORAGE_SECRET_ACCESS_KEY`
   - `RAILWAY_STORAGE_ENDPOINT`

### Step 3: Copy Variables to Web Service

**Important:** The variables are on the Storage service, but your Web service needs them!

1. **Copy each value** from the Storage service Variables tab
2. **Go to your Web service** (click "web" service)
3. **Go to "Variables" tab**
4. **Click "New Variable"** for each one:
   - Name: `RAILWAY_STORAGE_ACCESS_KEY_ID` → Paste the value
   - Name: `RAILWAY_STORAGE_SECRET_ACCESS_KEY` → Paste the value
   - Name: `RAILWAY_STORAGE_ENDPOINT` → Paste the value

### Step 4: Verify Setup

1. **Redeploy your Web service** (or wait for auto-deploy)
2. **Check the logs** - you should see:
   ```
   💾 Using Railway Storage Buckets for file uploads
   ```
3. **Try uploading a photo** - it should work!

---

## If Railway Storage Doesn't Exist

**Railway Storage might not be available in your plan or region.**

**Alternative:** You can use Supabase Storage instead:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Create a storage bucket** called `patient-files`
3. **Get your Supabase credentials:**
   - `SUPABASE_URL` (or `SUPABASE_PROJECT_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Add them to Railway Web service Variables**

---

## Troubleshooting

### "Storage not configured" error
- Make sure all 3 Railway Storage variables are set in **Web service** (not just Storage service)
- Check that variable names are EXACTLY as shown (case-sensitive)

### Photos still not showing
- Check Railway logs for storage errors
- Verify the Storage bucket exists and is active
- Make sure variables are copied to Web service, not just Storage service

### Can't find "Storage" option
- Railway Storage might not be available in your plan
- Try using Supabase Storage instead (see alternative above)

---

## Quick Checklist

- [ ] Created Railway Storage bucket
- [ ] Copied `RAILWAY_STORAGE_ACCESS_KEY_ID` to Web service
- [ ] Copied `RAILWAY_STORAGE_SECRET_ACCESS_KEY` to Web service
- [ ] Copied `RAILWAY_STORAGE_ENDPOINT` to Web service
- [ ] Redeployed Web service
- [ ] Checked logs for "Using Railway Storage" message
- [ ] Tested photo upload

---

**Once set up, your 217 existing photos should be accessible!**
