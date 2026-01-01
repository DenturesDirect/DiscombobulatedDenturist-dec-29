# 📸 Set Up Supabase Storage for Photos

## Step 1: Get Supabase Credentials

1. **In Supabase dashboard, click "Settings" (gear icon) in the left sidebar**
2. **Click "API"**
3. **Copy these two values:**
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role key** (under "Project API keys") → This is your `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Important:** Use the `service_role` key, NOT the `anon` key!

---

## Step 2: Create Storage Bucket

1. **In Supabase dashboard, click "Storage" in the left sidebar**
2. **Click "New bucket"**
3. **Fill in:**
   - **Name:** `patient-files`
   - **Public bucket:** ❌ **UNCHECKED** (make it private)
   - **File size limit:** Leave default or set to 10MB
   - **Allowed MIME types:** Leave empty (allows all)
4. **Click "Create bucket"**

---

## Step 3: Add to Railway

1. **Go to Railway → web service → Variables tab**
2. **Add these 3 variables:**

   **Variable 1:**
   - Name: `SUPABASE_URL`
   - Value: (paste your Project URL from Step 1)

   **Variable 2:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (paste your service_role key from Step 1)

   **Variable 3 (optional):**
   - Name: `SUPABASE_STORAGE_BUCKET`
   - Value: `patient-files`

3. **Click "Add" for each one**

---

## Step 4: Redeploy

1. **Railway will auto-redeploy** when you add variables
2. **Wait 2-3 minutes**
3. **Try uploading a photo** - it should work!

---

## That's It!

After adding the variables and redeploying, photo uploads will work.

**Note:** The security warnings about RLS (Row Level Security) are fine for now - your app uses service_role key which bypasses RLS anyway. You can fix those later if needed.
