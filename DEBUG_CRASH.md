# 🐛 Debugging Railway Crash

## Step 1: Get the Error Message

1. In Railway, click on your **Web Service**
2. Go to **"Deployments"** tab
3. Click on the **latest deployment** (the crashed one)
4. Click **"View Logs"**
5. **Scroll all the way to the bottom**
6. Look for lines that say:
   - `Error:`
   - `Failed:`
   - `Cannot`
   - `Missing`
   - `undefined`

## Step 2: Copy the Error

Copy the **last 30-50 lines** from the logs and share them here.

---

## Common Crashes & Quick Fixes

### Missing SESSION_SECRET
**Error:** `SESSION_SECRET` or session-related error

**Fix:**
- Go to Variables tab
- Add: `SESSION_SECRET = any-random-string-here-12345`

### Database Connection Failed
**Error:** `DATABASE_URL` or `connection` or `ECONNREFUSED`

**Fix:**
- Make sure PostgreSQL is connected (Settings → Service Connect)
- Verify `DATABASE_URL` is in Variables tab

### Port Already in Use
**Error:** `EADDRINUSE` or `port 5000`

**Fix:**
- Add: `PORT = 5000` in Variables
- Railway should handle this, but verify it's set

### Module Not Found
**Error:** `Cannot find module` or `Module not found`

**Fix:**
- Check that all dependencies are in package.json
- Railway should auto-install, but may need redeploy

### Build Failed
**Error:** Build-related errors

**Fix:**
- Check build logs
- Verify package.json is correct

---

## Quick Checklist

Before sharing logs, verify:
- [ ] `SESSION_SECRET` is set in Variables
- [ ] `NODE_ENV = production` is set
- [ ] `PORT = 5000` is set
- [ ] `DATABASE_URL` exists (if using database)
- [ ] PostgreSQL service is connected

---

## Share the Error

**Copy and paste the last 20-30 lines from the logs here**, and I'll tell you exactly how to fix it!
