# 🚨 START HERE - Railway-Only Recovery Guide

## Deployment Model: Railway Only

This app uses **Railway Postgres** for the database and **Railway Storage** for files. **Supabase is not used at runtime.** Do not add Supabase env vars for production; the app has no runtime dependency on Supabase.

- **DATABASE_URL** must point **only** to Railway Postgres (never to Supabase for app runtime)
- **RAILWAY_STORAGE_*** must be set for document uploads/downloads

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
# Baseline before changes
npm run baseline-diagnostics

# Verify database and storage
npm run check-db
npm run diagnose-storage

# Repair file URLs to canonical format
npm run repair-file-urls -- --dry-run   # preview
npm run repair-file-urls                # apply

# Migrate legacy Supabase files to Railway (if needed)
npm run migrate-storage
```

---

## 🎯 The Problem (Simple Explanation)

Your app uses **one database** - whatever `DATABASE_URL` points to.

**Required:**
- `DATABASE_URL` = Railway Postgres connection string
- `RAILWAY_STORAGE_ACCESS_KEY_ID`, `RAILWAY_STORAGE_SECRET_ACCESS_KEY`, `RAILWAY_STORAGE_ENDPOINT` = Railway Storage credentials

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
Use `npm run compare-databases` with **separate** URLs (e.g. from env files). Do not point the app's `DATABASE_URL` at Supabase; keep it on Railway Postgres only.

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
