# 🔧 Fix: Railway Auto-Detecting "KEY" as Secret

## The Problem

Railway automatically treats variables with **"KEY"** in the name as **secrets**, even if you don't mark them as secrets. This causes build failures because secrets aren't available during build.

## The Fix

**Rename the variable in Railway:**

### Step 1: Delete Old Variable
1. Go to Railway → web service → Variables
2. **Delete** `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Add New Variable (Without "KEY")
1. Click **"+ New Variable"**
2. **Name**: `SUPABASE_SERVICE_ROLE` (NO "KEY" in the name!)
3. **Value**: `sb_secret_oIPr01I9ubUelbOqAWsNJA_AZTyjFhX`
4. **Save**

### Step 3: Redeploy
Railway should auto-deploy, or click "Redeploy"

---

**The code now supports both names, but use `SUPABASE_SERVICE_ROLE` to avoid Railway's secret detection.**
