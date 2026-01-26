# 🚨 START HERE - Data Recovery Guide

## Your Situation
- ✅ **Your 170 patients ARE SAFE** - they're in Railway Postgres
- ❌ **Your app is pointing to the wrong database** (Supabase, which is empty)
- 🔧 **Fix:** Change one variable in Railway Dashboard (5 minutes)

---

## ⚡ Quick Fix (Do This First)

**Open `QUICK_FIX_CHECKLIST.md`** and follow the 5 steps. It takes about 5 minutes.

The fix is literally:
1. Copy Railway Postgres connection string
2. Paste it into web service `DATABASE_URL`
3. Wait for redeploy
4. Done!

---

## 📚 What I Created For You

### Quick Reference
- **`QUICK_FIX_CHECKLIST.md`** - 5-minute step-by-step checklist ⭐ START HERE
- **`RECOVER_DATA_NOW.md`** - Detailed recovery guide with troubleshooting

### Diagnostic Tools (run locally)
```powershell
# Compare Railway vs Supabase databases
$env:RAILWAY_DB_URL="railway_url"; $env:SUPABASE_DB_URL="supabase_url"; npm run compare-databases

# Verify data after fix
$env:DATABASE_URL="railway_postgres_url"; npm run verify-data-restored

# Diagnose office scope issues (if patients don't show)
$env:DATABASE_URL="railway_postgres_url"; npm run fix-office-scope
```

---

## 🎯 The Problem (Simple Explanation)

Your app uses **one database** - whatever `DATABASE_URL` points to.

**Right now:**
- `DATABASE_URL` in Railway web service = Supabase URL ❌
- Your real data = Railway Postgres ✅
- Result = App shows empty/test database

**After fix:**
- `DATABASE_URL` in Railway web service = Railway Postgres URL ✅
- Your real data = Railway Postgres ✅
- Result = App shows your 170 patients! 🎉

---

## 🆘 If Something Goes Wrong

### Still seeing 0 patients after fix?
1. Check Railway logs for: `📝 Storage mode: POSTGRESQL DATABASE`
2. Verify `DATABASE_URL` points to Railway Postgres (not Supabase)
3. Run: `npm run verify-data-restored`

### Office filter issue (patients exist but don't show)?
1. Run: `npm run fix-office-scope`
2. Follow the SQL recommendations it provides
3. See `RECOVER_DATA_NOW.md` Step 5 for details

### Need to compare databases?
1. Get Railway Postgres URL from Railway → Postgres → Variables
2. Get Supabase URL from Railway → web → Variables (current `DATABASE_URL`)
3. Run: `npm run compare-databases` with both URLs

---

## 🔒 Security Note

After your data is restored, you should:
1. Rotate the Supabase database password (you shared credentials)
2. Rotate `SESSION_SECRET` in Railway
3. See `RECOVER_DATA_NOW.md` "Security Cleanup" section

---

## ✅ Success Checklist

After following `QUICK_FIX_CHECKLIST.md`:
- [ ] Railway logs show: `📝 Storage mode: POSTGRESQL DATABASE`
- [ ] App shows ~170 patients (not 9 test patients)
- [ ] Can log in and see patient data
- [ ] Office filter works correctly

---

**Your data is safe - it's just pointing to the wrong place! The fix takes 5 minutes.**
