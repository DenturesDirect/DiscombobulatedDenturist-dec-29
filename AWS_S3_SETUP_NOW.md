# ⚡ Use AWS S3 Directly - 5 Minute Setup

## Your Code Already Works With AWS S3!

Your code supports S3-compatible storage. We just need to point it at AWS S3.

## Step 1: Create AWS Account & S3 Bucket (3 minutes)

1. **Go to**: https://aws.amazon.com/s3/
2. **Click "Create a free account"** (or sign in if you have one)
3. **Go to S3 Console**: https://s3.console.aws.amazon.com/
4. **Click "Create bucket"**
5. **Bucket name**: `dental-patient-files` (must be globally unique)
6. **Region**: `us-east-1` (or closest to you)
7. **Uncheck "Block all public access"** (or keep private - your choice)
8. **Click "Create bucket"**

## Step 2: Create Access Keys (2 minutes)

1. **Go to**: https://console.aws.amazon.com/iam/
2. **Click "Users"** → **"Create user"**
3. **Username**: `railway-storage`
4. **Click "Next"**
5. **Select "Attach policies directly"**
6. **Search**: `S3FullAccess` → **Select it**
7. **Click "Next"** → **"Create user"**
8. **Click the user** → **"Security credentials" tab**
9. **Click "Create access key"**
10. **Select "Application running outside AWS"**
11. **Click "Next"** → **"Create access key"**
12. **COPY BOTH VALUES** (you won't see secret again!):
    - Access Key ID
    - Secret Access Key

## Step 3: Add to Railway (1 minute)

1. **Railway** → **Your project** → **Web service** → **Variables**
2. **Add 3 variables:**
   - `RAILWAY_STORAGE_ACCESS_KEY_ID` = (AWS Access Key ID)
   - `RAILWAY_STORAGE_SECRET_ACCESS_KEY` = (AWS Secret Access Key)
   - `RAILWAY_STORAGE_ENDPOINT` = `https://s3.amazonaws.com`
   - `RAILWAY_STORAGE_BUCKET_NAME` = `dental-patient-files` (your bucket name)

## Step 4: Wait for Deploy

Railway auto-deploys. Check logs - should see: `💾 Using Railway Storage Buckets`

## Done!

Your photos will work. The code already supports AWS S3 - we just configured it.

---

**AWS Free Tier**: 5GB storage, 20,000 GET requests/month - FREE for 12 months!
