# ✅ QUICK FIX CHECKLIST - Do These Steps Now

## ⚡ 5-Minute Fix to Restore Your 170 Patients

### Step 1: Get Railway Postgres URL (1 minute)
- [ ] Go to Railway Dashboard → **Postgres** service
- [ ] Click **"Variables"** tab  
- [ ] Find `DATABASE_URL` or `POSTGRES_URL`
- [ ] Click 👁️ eye icon to reveal
- [ ] **COPY** the entire connection string
  - Should contain `railway.internal` or `railway.app`
  - Should NOT contain `supabase.com`

### Step 2: Update Web Service (1 minute)
- [ ] Go to Railway Dashboard → **web** service
- [ ] Click **"Variables"** tab
- [ ] Find `DATABASE_URL`
- [ ] Click to edit
- [ ] **PASTE** the Railway Postgres URL from Step 1
- [ ] Click **Save**

### Step 3: Verify USE_MEM_STORAGE (30 seconds)
- [ ] Still in web service Variables
- [ ] Check if `USE_MEM_STORAGE` exists
- [ ] If it's set to `1`, delete it or set to empty
- [ ] If it doesn't exist, you're good!

### Step 4: Wait for Redeploy (2 minutes)
- [ ] Go to **"Deployments"** tab
- [ ] Watch for new deployment starting
- [ ] Wait until it shows **"Active"** (green)

### Step 5: Verify It Worked (1 minute)
- [ ] Go to **"Logs"** tab
- [ ] Look for: `📝 Storage mode: POSTGRESQL DATABASE`
- [ ] Open your app URL
- [ ] Log in
- [ ] **Check patient count** - should show ~170 patients!

---

## 🆘 If It Didn't Work

### Still seeing 0 patients?
1. Double-check `DATABASE_URL` in web service points to Railway Postgres (not Supabase)
2. Check logs for errors
3. Run verification script:
   ```powershell
   $env:DATABASE_URL="your_railway_postgres_url"; npm run verify-data-restored
   ```

### Still seeing test patients only?
- Your `DATABASE_URL` is still pointing to Supabase
- Go back to Step 2 and make sure you pasted the Railway Postgres URL

### Office filter issue?
- See `RECOVER_DATA_NOW.md` Step 5 for office mismatch fix

---

## 📋 What I Created For You

1. **`RECOVER_DATA_NOW.md`** - Detailed step-by-step guide
2. **`QUICK_FIX_CHECKLIST.md`** - This file (quick reference)
3. **`scripts/compare-databases.ts`** - Compare Railway vs Supabase
4. **`scripts/verify-data-restored.ts`** - Verify after fix

---

**The fix is literally just changing one variable in Railway Dashboard. Your data is safe - it's just pointing to the wrong database!**
