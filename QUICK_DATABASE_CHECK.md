# ⚡ Quick Database Check (5 minutes)

## Fastest Way to Verify Where Your Data Is

### Option 1: Check Railway Variables (30 seconds)

1. **Railway Dashboard** → Your project → **Web Service** → **Variables**
2. **Find `DATABASE_URL`**
3. **Look at the hostname:**

   - Contains `railway` → **Railway PostgreSQL** ✅
   - Contains `supabase` → **Supabase** ⚠️
   - Contains `neon` → **Neon** ⚠️
   - Not found → **In-Memory (no database!)** ❌

---

### Option 2: Run Check Script (1 minute)

1. **Railway Dashboard** → Your project → **Web Service**
2. **Click "Deployments"** → **Latest deployment** → **"Shell"** button
3. **Run:**
   ```bash
   node check-database.js
   ```
4. **It will tell you exactly where your database is!**

---

### Option 3: Check Railway PostgreSQL Directly (2 minutes)

1. **Railway Dashboard** → Your project
2. **Look for "PostgreSQL" service** (separate from Web Service)
3. **If it exists:**
   - Click on it
   - Go to **"Data"** tab
   - **See tables?** → Your data is there! ✅
4. **If it doesn't exist:**
   - Your database is somewhere else (Supabase/Neon) or you're using in-memory

---

### Option 4: Check App Logs (1 minute)

1. **Railway** → **Web Service** → **Deployments** → **Latest** → **View Logs**
2. **Search for:**
   - `📝 Storage mode: POSTGRESQL DATABASE` → Using database ✅
   - `📝 Storage mode: IN-MEMORY` → No database ❌
   - `💾 Using PostgreSQL session storage` → Using database ✅

---

## What You Should See

### ✅ If Using Railway PostgreSQL:
- `DATABASE_URL` contains `railway.internal` or `railway.app`
- PostgreSQL service exists in Railway
- Tables visible in Railway → PostgreSQL → Data tab

### ⚠️ If Using Supabase:
- `DATABASE_URL` contains `supabase.co`
- Tables visible in Supabase Dashboard → Table Editor

### ❌ If Using In-Memory:
- No `DATABASE_URL` in Railway Variables
- Logs show "IN-MEMORY" storage
- **Data will be lost on restart!**

---

## Verify Data is Actually There

**After identifying your database:**

1. **Add a test patient** in your app
2. **Go to your database** (Railway/Supabase/Neon)
3. **Check the `patients` table**
4. **If you see the test patient:**
   **→ That's where your data is stored!** ✅

---

**The fastest check: Railway → Web Service → Variables → Look at DATABASE_URL!**
