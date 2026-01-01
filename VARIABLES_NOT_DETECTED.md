# ❌ Variables Not Detected

## What the Debug Endpoint Shows:
```json
{
  "hasSupabase": false,
  "serviceType": "ObjectStorageService",
  "supabaseUrl": "❌ Missing",
  "supabaseKey": "❌ Missing"
}
```

**This means Railway isn't reading the variables.**

---

## Fix: Check Where Variables Are Set

### Railway has TWO places to set variables:

1. **Project-level Variables** (applies to all services)
2. **Service-level Variables** (only for that service)

### The Problem:
Variables might be set at the **project level**, but the **web service** needs them at the **service level**.

---

## Solution: Set Variables in the Web Service

### Step 1: Go to the Correct Project
- Project with URL: `web-production-8fe06.up.railway.app`

### Step 2: Click on "web" Service
- **NOT** the project settings
- **Click on the "web" service itself**

### Step 3: Go to Variables Tab
- Make sure you're in the **web service's Variables tab**
- **NOT** the project's Variables tab

### Step 4: Add Variables
- Click **"+ New Variable"**
- Add:
  - **Name**: `SUPABASE_URL`
  - **Value**: `https://qhexbhorylsvlpjkchkg.supabase.co`
- Click **"+ New Variable"** again
- Add:
  - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
  - **Value**: `sb_secret_oIPr01I9ubUelbOqAWsNJA_AZTyjFhX`

### Step 5: Redeploy
- Railway should auto-redeploy
- Or click "Redeploy" button

### Step 6: Check Again
- Visit: `https://web-production-8fe06.up.railway.app/api/debug/storage`
- Should now show: `"hasSupabase": true`

---

**The key: Variables must be in the WEB SERVICE, not just the project!**
