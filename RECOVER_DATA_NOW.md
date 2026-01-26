# 🚨 EMERGENCY DATA RECOVERY GUIDE

## Your Situation
- ✅ Your real patient data (~170 patients) is in **Railway Postgres**
- ❌ Your app is currently pointing to **Supabase Postgres** (empty/test data)
- 🔧 **Fix:** Change `DATABASE_URL` in Railway web service to point to Railway Postgres

---

## Step 1: Get Railway Postgres Connection String

1. **Go to Railway Dashboard**: https://railway.app
2. **Click on your project** (DentureFlowPro)
3. **Click on the "Postgres" service** (the database icon, not "web")
4. **Click the "Variables" tab**
5. **Find and copy one of these variables:**
   - `DATABASE_URL` (preferred)
   - `POSTGRES_URL` 
   - `POSTGRES_PRIVATE_URL`
   - `DATABASE_PRIVATE_URL`

   **The connection string should look like:**
   ```
   postgresql://postgres:password@postgres.railway.internal:5432/railway
   ```
   OR
   ```
   postgresql://postgres:password@something.railway.app:5432/railway
   ```

6. **Click the 👁️ eye icon** to reveal the full connection string
7. **Copy the ENTIRE string** (you'll need it in Step 2)

---

## Step 2: Update Web Service DATABASE_URL

1. **Still in Railway Dashboard**, click on the **"web" service** (the GitHub icon)
2. **Click the "Variables" tab**
3. **Find `DATABASE_URL`** in the list
4. **Click on `DATABASE_URL`** to edit it
5. **Replace the entire value** with the Railway Postgres connection string you copied in Step 1
6. **Click "Save"** or press Enter

   ⚠️ **IMPORTANT:** Make sure you're replacing it with the Railway Postgres URL, NOT keeping the Supabase URL!

7. **Verify `USE_MEM_STORAGE` is NOT set to `1`**
   - If you see `USE_MEM_STORAGE` in the variables list, make sure its value is empty or not set to `1`
   - If it's set to `1`, delete it or set it to empty

---

## Step 3: Wait for Redeploy

- Railway **automatically redeploys** when you change environment variables
- **Wait 1-2 minutes** for the redeploy to complete
- You can watch the progress in the "Deployments" tab

---

## Step 4: Verify It Worked

### Check Railway Logs:
1. **Go to web service → "Logs" tab**
2. **Look for these messages:**
   ```
   📝 Storage mode: POSTGRESQL DATABASE
   ✅ Using persistent storage - data will be saved
   ```
   ❌ **If you see:** `📝 Storage mode: IN-MEMORY` → Something is wrong, go back to Step 2

### Check Your App:
1. **Open your app** (the Railway URL)
2. **Log in**
3. **Check patient count** - You should see ~170 patients now!

---

## Step 5: If Patients Still Don't Show (Office Mismatch)

If you see the correct patient count in logs but still see "0 patients" in the app, it might be an office filter issue.

### Quick Fix - Check Office Distribution:

1. **Go to Railway Postgres service → "Data" or "Query" tab**
2. **Run these queries:**

```sql
-- Check how many offices exist
SELECT COUNT(*) FROM offices;

-- Check patient distribution by office
SELECT office_id, COUNT(*) as patient_count 
FROM patients 
GROUP BY office_id 
ORDER BY patient_count DESC;

-- Check which office your user account is assigned to
SELECT id, username, office_id, can_view_all_offices 
FROM users;
```

3. **If your user's `office_id` doesn't match the office where patients are stored:**
   - Note your user ID from the query above
   - Note the `office_id` where most patients are stored
   - Run this update (replace `YOUR_USER_ID` and `CORRECT_OFFICE_ID`):

```sql
UPDATE users 
SET office_id = 'CORRECT_OFFICE_ID' 
WHERE id = 'YOUR_USER_ID';
```

---

## Troubleshooting

### "Cannot connect to database" error in logs:
- ✅ Check that the Railway Postgres connection string is correct
- ✅ Make sure Railway Postgres service is "Online" (green dot)
- ✅ Verify you copied the ENTIRE connection string (including password)

### Still seeing test patients only:
- ✅ Double-check that `DATABASE_URL` in web service points to Railway Postgres (not Supabase)
- ✅ Check that `USE_MEM_STORAGE` is not set to `1`
- ✅ Wait for full redeploy (check Deployments tab)

### Patients show but office filter is wrong:
- ✅ Follow Step 5 above to fix office assignment

---

## After Recovery: Security Cleanup

⚠️ **IMPORTANT:** You shared a Supabase connection string with credentials. After your data is restored:

1. **Rotate Supabase database password:**
   - Go to Supabase Dashboard → Project Settings → Database
   - Change the database password
   - Update any remaining Supabase connection strings

2. **Rotate `SESSION_SECRET` in Railway:**
   - Railway web service → Variables → `SESSION_SECRET`
   - Generate a new random string and replace it

3. **Consider removing unused Supabase variables** from Railway (if you're not using Supabase anymore)

---

## Quick Reference: Which Database Am I Using?

**Railway Postgres connection strings contain:**
- `railway.internal` OR
- `railway.app` OR  
- `postgres.railway.internal`

**Supabase connection strings contain:**
- `supabase.com` OR
- `pooler.supabase.com`

**Check your current `DATABASE_URL` in Railway web service → Variables to see which one you're using!**

---

## Need Help?

If you're stuck, run this diagnostic script locally:

```powershell
# Check Railway Postgres
$env:RAILWAY_DB_URL="your_railway_postgres_url"; npm run compare-databases

# Check Supabase Postgres  
$env:SUPABASE_DB_URL="your_supabase_url"; npm run compare-databases

# Check both
$env:RAILWAY_DB_URL="railway_url"; $env:SUPABASE_DB_URL="supabase_url"; npm run compare-databases
```

This will show you exactly which database has your real data.
