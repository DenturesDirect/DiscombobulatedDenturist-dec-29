# 🔐 Fix Login Issues

## Quick Check

After Railway redeploys, visit:
```
https://your-app-url.railway.app/api/debug/auth
```

This will show you what's wrong.

## Common Issues

### 1. Missing SESSION_SECRET

**Symptoms:**
- App crashes on startup
- Error: "SESSION_SECRET environment variable is required"

**Fix:**
1. Go to Railway → web service → Variables
2. Add:
   - **Name**: `SESSION_SECRET`
   - **Value**: `dentures-direct-secret-key-2024-change-later`
3. Redeploy

### 2. User Account Not Seeded

**Symptoms:**
- Login says "Invalid credentials"
- Debug endpoint shows `userExists: false`

**Fix:**
1. Check Railway logs for "👥 Checking staff accounts..."
2. If you see errors, the database might not be connected
3. Make sure `DATABASE_URL` is set in Railway Variables

### 3. Wrong Password

**Default passwords:**
- All staff accounts start with: `TempPassword123!`
- Emails:
  - `damien@denturesdirect.ca` (admin)
  - `michael@denturesdirect.ca`
  - `luisa@denturesdirect.ca`
  - `info@denturesdirect.ca` (Caroline)

**To reset password:**
- Log in as admin (`damien@denturesdirect.ca`)
- Go to Admin → Reset Password
- Or ask admin to reset it

### 4. Database Connection Issue

**Symptoms:**
- Debug endpoint shows `databaseUrl: false`
- Logs show database errors

**Fix:**
1. Check Railway → Postgres service
2. Copy the `DATABASE_URL` from Postgres service Variables
3. Add it to web service Variables
4. Redeploy

### 5. Sessions Table Missing

**Symptoms:**
- Login works but immediately logs out
- Session errors in logs

**Fix:**
- The app now auto-creates the sessions table
- If still broken, check Railway logs for session errors

---

## Step-by-Step Fix

1. **Check debug endpoint:**
   ```
   https://your-app-url.railway.app/api/debug/auth
   ```

2. **Check Railway Variables:**
   - `SESSION_SECRET` ✅
   - `DATABASE_URL` ✅
   - `NODE_ENV` = `production` ✅

3. **Check Railway Logs:**
   - Look for "👥 Checking staff accounts..."
   - Look for any errors

4. **Try logging in:**
   - Email: `damien@denturesdirect.ca`
   - Password: `TempPassword123!`

5. **If still broken:**
   - Share the debug endpoint output
   - Share relevant log errors
