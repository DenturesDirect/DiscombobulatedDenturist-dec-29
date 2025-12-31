# 🆘 Railway Troubleshooting - App Crashed

## ❌ "Crashed" Status = Something Went Wrong

If your Railway app shows **"Crashed"**, here's how to fix it:

---

## Step 1: Check the Logs

1. Click on your **Web Service**
2. Go to **"Deployments"** tab
3. Click on the **latest deployment** (the one that crashed)
4. Click **"View Logs"**
5. **Scroll to the bottom** - the error is usually at the end

---

## Common Errors & Fixes

### Error 1: "DATABASE_URL must be set"
**Problem:** Database not connected

**Fix:**
1. Make sure PostgreSQL service exists
2. Connect it to your Web Service (Settings → Service Connect → Connect)
3. Verify `DATABASE_URL` appears in Variables tab
4. Redeploy

---

### Error 2: "SESSION_SECRET must be set"
**Problem:** Missing environment variable

**Fix:**
1. Go to Web Service → Variables tab
2. Add: `SESSION_SECRET = dentures-direct-secret-key-2024-change-later`
3. Railway will auto-redeploy

---

### Error 3: "Port 5000 already in use" or "EADDRINUSE"
**Problem:** Port conflict

**Fix:**
1. Go to Variables tab
2. Make sure `PORT = 5000` is set
3. Railway should handle this automatically, but verify it's set

---

### Error 4: "Cannot find module" or "Module not found"
**Problem:** Missing dependencies or build issue

**Fix:**
1. Check that `package.json` is correct
2. Railway should auto-install dependencies
3. Check build logs for npm install errors
4. Try redeploying

---

### Error 5: "Google AI API key not configured"
**Problem:** Missing optional API key (but shouldn't crash)

**Fix:**
- This is optional - the app should still start
- If it's crashing, check the logs for the real error
- The app should work without it (AI features just won't work)

---

### Error 6: Build Failed
**Problem:** Build process failed

**Fix:**
1. Check build logs
2. Make sure `package.json` has correct build script
3. Verify all dependencies are listed
4. Check for TypeScript errors

---

## Quick Fix Checklist

1. ✅ **Check logs** - See what the actual error is
2. ✅ **Verify environment variables:**
   - `SESSION_SECRET` is set
   - `NODE_ENV = production`
   - `PORT = 5000`
   - `DATABASE_URL` is set (if using database)
3. ✅ **Check database connection:**
   - PostgreSQL service exists
   - Connected to Web Service
   - `DATABASE_URL` is in Variables
4. ✅ **Try redeploying:**
   - Go to Deployments
   - Click "Redeploy" on latest deployment

---

## How to Get Help

**Share the error message from the logs:**
1. Copy the last 20-30 lines from the logs
2. Look for lines that say "Error:" or "Failed:"
3. The error message will tell us exactly what's wrong

---

## Most Common Issue

**90% of crashes are:**
- Missing `SESSION_SECRET` environment variable
- Database not connected (missing `DATABASE_URL`)

**Quick fix:**
1. Go to Variables tab
2. Add `SESSION_SECRET = any-random-string-here`
3. Make sure database is connected
4. Redeploy

---

## Still Stuck?

**Share:**
1. The error message from the logs (last 10-20 lines)
2. Which step you're on
3. What environment variables you've set

I'll help you fix it! 🚀
