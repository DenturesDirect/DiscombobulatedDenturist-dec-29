# 🔧 Fix Railpack Reverting to Nixpacks

## The Problem

**Railway keeps reverting to Nixpacks** when you select Railpack in the dashboard.

---

## What I Just Did

✅ **Removed builder specification from `railway.json`**
- This lets Railway auto-detect the build method
- Should stop forcing Nixpacks

---

## Now Try Again

1. **Wait for Railway to finish rebuilding** (from the code change)
2. **Go to Railway → web service → Settings → Build**
3. **Change to Railpack again**
4. **Save**

**It should stick now!**

---

## If It Still Reverts

**Check for:**
1. **`railway.toml` file** - Does it exist? (might be forcing Nixpacks)
2. **Railway cache** - Try clearing and redeploying
3. **Other config files** - Any files that might specify Nixpacks?

---

**Try changing to Railpack again after Railway rebuilds!**
