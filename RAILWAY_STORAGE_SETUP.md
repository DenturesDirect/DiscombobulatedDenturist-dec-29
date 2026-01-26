# 🚀 Set Up Railway Storage (The Right Way)

## Railway Storage EXISTS - Here's How to Get It

Railway Storage is available! You just need to create a "Bucket" in your Railway project.

## Step 1: Create Railway Storage Bucket (2 minutes)

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click on your project** (the one with Postgres)
3. **Click "Create"** button (top right, near "New")
4. **Select "Bucket"** (not "Database" or "Service")
5. **Choose a region** (closest to you)
6. **Optionally change display name** (e.g., `patient-files`)
7. **Click "Create"**

**The bucket name will be**: `displayname-<short-hash>` (Railway makes it unique)

## Step 2: Get Your Credentials (1 minute)

After creating the bucket:

1. **Click on the Bucket** you just created
2. **Go to "Credentials" tab**
3. **You'll see these variables:**
   - `ACCESS_KEY_ID`
   - `SECRET_ACCESS_KEY`
   - `ENDPOINT` (usually `https://storage.railway.app`)
   - `REGION` (e.g., `auto` or region code)
   - `BUCKET` (the actual bucket name - use this, not display name!)

## Step 3: Copy Credentials to Web Service (2 minutes)

**Important:** The credentials are on the Bucket service, but your Web service needs them!

1. **Copy each value** from Bucket → Credentials tab
2. **Go to Web service** → **Variables tab**
3. **Add these 4 variables:**
   - `RAILWAY_STORAGE_ACCESS_KEY_ID` = (copy ACCESS_KEY_ID)
   - `RAILWAY_STORAGE_SECRET_ACCESS_KEY` = (copy SECRET_ACCESS_KEY)
   - `RAILWAY_STORAGE_ENDPOINT` = (copy ENDPOINT)
   - `RAILWAY_STORAGE_BUCKET_NAME` = (copy BUCKET - the full name with hash!)

## Step 4: Set Region (Optional)

If Railway gave you a `REGION` value:
- Add: `RAILWAY_STORAGE_REGION` = (copy REGION value)

If not set, it defaults to `us-east-1` which is fine.

## Step 5: Deploy

Railway auto-deploys. Wait 1-2 minutes.

## Step 6: Verify

1. **Check Railway logs** - should see: `💾 Using Railway Storage Buckets for file uploads`
2. **Try uploading a photo** - should work!
3. **Try viewing an existing photo** - should work!

---

## Important Notes

- **Use the BUCKET name** (with hash), not the display name
- **Copy credentials to Web service**, not just leave them on Bucket service
- **Endpoint is usually**: `https://storage.railway.app`
- **Region can be**: `auto` or a specific region code

---

## Troubleshooting

### "Bucket" option not showing
- Make sure you're clicking "Create" → "Bucket" (not "New Service")
- If still not there, you might need to upgrade your Railway plan
- Contact Railway support if needed

### "Storage not configured" error
- Make sure all 4 variables are in **Web service** Variables (not Bucket service)
- Check that variable names are EXACT (case-sensitive)
- Make sure you copied the full BUCKET name (with hash)

### Photos still not showing
- Check Railway logs for errors
- Verify bucket exists and is active
- Make sure you used the BUCKET variable (full name), not display name

---

**Once set up, your 217 photos will be accessible via Railway Storage!**
