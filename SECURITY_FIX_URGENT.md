# 🚨 URGENT: Security Fix - Rotate Supabase Service Role Key

## The Problem
Your Supabase service role key is **exposed in documentation files** that are committed to GitHub. This is a **critical security issue**.

## Immediate Steps

### Step 1: Rotate Your Supabase Service Role Key (5 minutes)

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to API Settings**
   - Left sidebar → **Settings** → **API**
   - Or: Project Settings → API

3. **Rotate the Service Role Key**
   - Find the **"service_role"** key (starts with `sb_secret_...`)
   - Click **"Reset"** or **"Rotate"** button
   - **Copy the NEW key** (you'll need it for Step 2)

4. **Important:** The old key (`sb_secret_oIPr01I9ubUelbOqAWsNJA_AZTyjFhX`) is now **INVALID**

### Step 2: Update Railway with New Key (2 minutes)

1. **Go to Railway Dashboard**
   - https://railway.app/
   - Select your project

2. **Update the Environment Variable**
   - Click on your **Web Service**
   - Go to **Variables** tab
   - Find `SUPABASE_SERVICE_ROLE_KEY`
   - Click **Edit**
   - **Replace** with the NEW key from Step 1
   - Click **Save**

3. **Railway will auto-redeploy** (wait 2-3 minutes)

### Step 3: Verify It Works (1 minute)

1. **Check Railway Logs**
   - Should show: `💾 Using Supabase Storage`

2. **Test File Upload**
   - Try uploading a photo in your app
   - Should work with the new key

## After Rotation

✅ **Old key is invalid** - can't be used anymore
✅ **New key is secure** - only in Railway (not in code)
✅ **App should work normally** - no changes needed

## Why This Happened

The service role key was accidentally included in documentation files (`.md` files) that were committed to GitHub. **Never put secrets in code or documentation!**

## Prevention

- ✅ **Always use environment variables** for secrets
- ✅ **Never commit secrets** to git
- ✅ **Use Railway's secret management** (Variables tab)
- ❌ **Never put secrets in `.md` files**
- ❌ **Never put secrets in code comments**

---

**After rotating the key, the old exposed key will be useless. Your app will be secure again!**
