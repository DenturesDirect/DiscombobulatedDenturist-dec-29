# 🚀 Complete Setup: Railway + Supabase Storage

## Step 1: Deploy to Railway (10 minutes)

### 1.1 Sign Up & Add Payment
1. Go to **https://railway.app/**
2. Sign up/Login with **GitHub**
3. Add payment method ($5/month plan)
   - Profile → Account Settings → Billing
   - Add credit card

### 1.2 Deploy App
1. Click **"New Project"**
2. Click **"Deploy from GitHub repo"**
3. Select: **`DenturesDirect/DiscombobulatedDenturist-dec-29`**
4. Wait 2-3 minutes for deployment

### 1.3 Add PostgreSQL Database
1. In Railway project, click **"+ New"**
2. Click **"Database"** → **"Add PostgreSQL"**
3. Railway creates it automatically

### 1.4 Connect Database
1. Click on your **Web Service**
2. Go to **"Settings"** tab
3. Scroll to **"Service Connect"**
4. Find **PostgreSQL** and click **"Connect"**
5. Railway automatically sets `DATABASE_URL`

### 1.5 Set Environment Variables (Temporary)
1. Click on your **Web Service** → **"Variables"** tab
2. Add these:
   ```
   SESSION_SECRET = dentures-direct-secret-key-2024-change-later
   NODE_ENV = production
   PORT = 5000
   ```

### 1.6 Set Up Database Tables
1. Click **"Deployments"** → Latest → **"Shell"**
2. Run: `npm run db:push`
3. Wait for "✓ Push completed"

---

## Step 2: Set Up Supabase Storage (5 minutes)

### 2.1 Create Supabase Project
1. Go to **https://supabase.com/**
2. Sign up/Login
3. Click **"New Project"**
4. Fill in:
   - **Name**: `DentureFlowPro` (or whatever)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"**
6. Wait 2-3 minutes for provisioning

### 2.2 Create Storage Bucket
1. In Supabase dashboard, go to **"Storage"** (left sidebar)
2. Click **"New bucket"**
3. Fill in:
   - **Name**: `patient-files`
   - **Public bucket**: **UNCHECKED** (keep it private!)
   - **File size limit**: `100MB` (or higher if needed)
   - **Allowed MIME types**: Leave empty (allows all types)
4. Click **"Create bucket"**

### 2.3 Get API Keys
1. Go to **"Settings"** → **"API"**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **KEEP THIS SECRET!**

### 2.4 Set Up Storage Policies (Security)
1. Go to **"Storage"** → **"Policies"**
2. Click on **"patient-files"** bucket
3. Click **"New Policy"**
4. Create policy for **"SELECT"** (read files):
   - Policy name: `Allow authenticated reads`
   - Allowed operation: `SELECT`
   - Policy definition:
     ```sql
     (bucket_id = 'patient-files'::text)
     ```
   - With check expression:
     ```sql
     (bucket_id = 'patient-files'::text)
     ```
5. Create policy for **"INSERT"** (upload files):
   - Policy name: `Allow authenticated uploads`
   - Allowed operation: `INSERT`
   - Policy definition:
     ```sql
     (bucket_id = 'patient-files'::text)
     ```
6. Create policy for **"UPDATE"** (update files):
   - Policy name: `Allow authenticated updates`
   - Allowed operation: `UPDATE`
   - Policy definition:
     ```sql
     (bucket_id = 'patient-files'::text)
     ```
7. Create policy for **"DELETE"** (delete files):
   - Policy name: `Allow authenticated deletes`
   - Allowed operation: `DELETE`
   - Policy definition:
     ```sql
     (bucket_id = 'patient-files'::text)
     ```

**Note:** These policies allow any authenticated user. For production, you may want to add user-specific checks.

---

## Step 3: Update Railway Environment Variables

1. Go back to Railway → Your **Web Service** → **"Variables"**
2. Add these new variables:
   ```
   SUPABASE_URL = https://xxxxx.supabase.co (from Step 2.3)
   SUPABASE_SERVICE_ROLE_KEY = eyJ... (from Step 2.3 - service_role key)
   SUPABASE_STORAGE_BUCKET = patient-files
   ```
3. Railway will automatically redeploy

---

## Step 4: Test the Setup

1. Get your Railway URL:
   - Web Service → Settings → Domains
   - Copy the URL (like: `https://your-app.up.railway.app`)

2. Open the URL in browser

3. Login:
   - Email: `damien@denturesdirect.ca`
   - Password: `TempPassword123!`

4. Test file upload:
   - Go to a patient
   - Try uploading a photo
   - Should work with Supabase Storage!

---

## ✅ Done!

Your setup:
- ✅ **Railway**: App + Database ($5/month)
- ✅ **Supabase Storage**: File storage (~$2-4/month)
- ✅ **Total**: ~$7-9/month

**Your app is now ready for production with scalable file storage!**

---

## 🆘 Troubleshooting

**File upload fails?**
- Check Supabase Storage policies are set correctly
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check Railway logs for errors

**Can't access files?**
- Verify storage policies allow SELECT operation
- Check bucket name matches `SUPABASE_STORAGE_BUCKET`

**Database connection issues?**
- Make sure PostgreSQL is connected in Railway
- Verify `DATABASE_URL` is set automatically



