# 🚀 Use AWS S3 Directly (No Supabase, No Railway Storage)

## Why This Works

Your code already supports S3-compatible storage. We'll just point it at AWS S3 directly.

## What You Need (3 Variables)

1. `RAILWAY_STORAGE_ACCESS_KEY_ID` = AWS Access Key ID
2. `RAILWAY_STORAGE_SECRET_ACCESS_KEY` = AWS Secret Access Key  
3. `RAILWAY_STORAGE_ENDPOINT` = AWS S3 endpoint (we'll set this)

## Step 1: Create AWS S3 Bucket (5 minutes)

1. **Go to**: https://aws.amazon.com/s3/
2. **Sign in** (or create free account - free tier available)
3. **Go to S3 Console**: https://s3.console.aws.amazon.com/
4. **Click "Create bucket"**
5. **Name it**: `dental-patient-files` (or whatever you want)
6. **Region**: Choose closest to you (e.g., `us-east-1`)
7. **Uncheck "Block all public access"** (or keep it private - your choice)
8. **Click "Create bucket"**

## Step 2: Create AWS Access Keys (2 minutes)

1. **Go to**: https://console.aws.amazon.com/iam/
2. **Click "Users"** (left sidebar)
3. **Click "Create user"**
4. **Username**: `railway-storage-user`
5. **Click "Next"**
6. **Select "Attach policies directly"**
7. **Search and select**: `AmazonS3FullAccess`
8. **Click "Next"** → **"Create user"**
9. **Click on the user you just created**
10. **Go to "Security credentials" tab**
11. **Click "Create access key"**
12. **Select "Application running outside AWS"**
13. **Click "Next"** → **"Create access key"**
14. **COPY BOTH:**
    - Access Key ID → This is `RAILWAY_STORAGE_ACCESS_KEY_ID`
    - Secret Access Key → This is `RAILWAY_STORAGE_SECRET_ACCESS_KEY`
    - **SAVE THESE - you won't see the secret again!**

## Step 3: Get S3 Endpoint (1 minute)

**The endpoint depends on your region:**
- `us-east-1`: `https://s3.amazonaws.com`
- `us-west-1`: `https://s3.us-west-1.amazonaws.com`
- `us-west-2`: `https://s3.us-west-2.amazonaws.com`
- `eu-west-1`: `https://s3.eu-west-1.amazonaws.com`
- **Or use**: `https://s3.amazonaws.com` (works for most regions)

## Step 4: Add Variables to Railway (2 minutes)

1. **Go to Railway**: https://railway.app/dashboard
2. **Click your project** → **Web service** → **Variables tab**
3. **Add these 3 variables:**
   - Name: `RAILWAY_STORAGE_ACCESS_KEY_ID` → Value: (AWS Access Key ID)
   - Name: `RAILWAY_STORAGE_SECRET_ACCESS_KEY` → Value: (AWS Secret Access Key)
   - Name: `RAILWAY_STORAGE_ENDPOINT` → Value: `https://s3.amazonaws.com` (or your region endpoint)

## Step 5: Update Code to Use S3 Bucket Name

We need to tell the code which S3 bucket to use. Let me update the code...

## Step 6: Deploy and Test

1. Railway auto-deploys
2. Check logs - should see: `💾 Using Railway Storage Buckets for file uploads`
3. Try uploading a photo - should work!

---

## Quick Reference

**AWS S3 Endpoints by Region:**
- `us-east-1`: `https://s3.amazonaws.com`
- `us-west-1`: `https://s3.us-west-1.amazonaws.com`
- `us-west-2`: `https://s3.us-west-2.amazonaws.com`
- `eu-west-1`: `https://s3.eu-west-1.amazonaws.com`

**Or just use**: `https://s3.amazonaws.com` (works everywhere)

---

**This uses AWS S3 directly - no Supabase, no Railway Storage needed!**
