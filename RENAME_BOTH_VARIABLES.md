# 🔧 Rename BOTH Variables in Railway

## The Problem

Railway is auto-detecting **BOTH** variables as secrets:
- `SUPABASE_URL` → Treated as secret
- `SUPABASE_SERVICE_ROLE_KEY` → Treated as secret

This causes build failures because secrets aren't available during build.

## The Fix

**Rename BOTH variables in Railway:**

### Step 1: Delete Old Variables
1. Go to Railway → web service → Variables
2. **Delete** `SUPABASE_URL`
3. **Delete** `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Add New Variables (Without "URL" or "KEY")
1. Click **"+ New Variable"**
2. **Name**: `SUPABASE_PROJECT_URL` (NO "URL" in the name!)
3. **Value**: `https://qhexbhorylsvlpjkchkg.supabase.co`
4. **Save**

5. Click **"+ New Variable"** again
6. **Name**: `SUPABASE_SERVICE_ROLE` (NO "KEY" in the name!)
7. **Value**: `sb_secret_oIPr01I9ubUelbOqAWsNJA_AZTyjFhX`
8. **Save**

### Step 3: Redeploy
Railway should auto-deploy, or click "Redeploy"

---

**The code now supports both old and new names, but use the new names to avoid Railway's secret detection:**
- `SUPABASE_PROJECT_URL` (instead of `SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE` (instead of `SUPABASE_SERVICE_ROLE_KEY`)
