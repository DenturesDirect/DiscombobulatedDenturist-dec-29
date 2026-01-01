# 🔧 Fix: "secret SUPABASE_SERVICE_ROLE_KEY not found"

## The Problem

Railway is trying to use `SUPABASE_SERVICE_ROLE_KEY` as a **secret** during the **build phase**, but secrets are only available at **runtime**.

Error: `failed to solve: secret SUPABASE_SERVICE_ROLE_KEY not found`

## The Solution

**Make sure the variables are set as REGULAR environment variables, NOT secrets.**

### Step 1: Check Variable Type in Railway

1. Go to Railway project → "web" service → **Variables** tab
2. Look at `SUPABASE_SERVICE_ROLE_KEY`
3. **Is there a lock icon 🔒 or "Secret" label?**
   - If YES → It's set as a secret (WRONG for build)
   - If NO → It's a regular variable (CORRECT)

### Step 2: If It's a Secret, Convert to Regular Variable

1. **Delete** `SUPABASE_SERVICE_ROLE_KEY` (if it's marked as secret)
2. **Delete** `SUPABASE_URL` (if it's marked as secret)
3. Wait 10 seconds
4. Click **"+ New Variable"**
5. **Name**: `SUPABASE_URL`
6. **Value**: `https://qhexbhorylsvlpjkchkg.supabase.co`
7. **DO NOT** check "Secret" or "Encrypted" checkbox
8. Click **Save**
9. Click **"+ New Variable"** again
10. **Name**: `SUPABASE_SERVICE_ROLE_KEY`
11. **Value**: `sb_secret_oIPr01I9ubUelbOqAWsNJA_AZTyjFhX`
12. **DO NOT** check "Secret" or "Encrypted" checkbox
13. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"**
3. Build should now succeed

---

**The key: Variables must be REGULAR variables, not secrets, because they're needed at build time (even though we only use them at runtime).**
