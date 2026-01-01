# 🐛 App Crashed After Database Connection

## Check the Logs Again

The error might be different now. Let's see what happened:

1. Click on **"web"** service
2. Go to **"Deployments"** tab
3. Click **latest deployment** → **"View Logs"**
4. Scroll to the **very bottom**
5. Copy the **last 20-30 lines** and share them

---

## Common Issues After Connecting Database

### Issue 1: DATABASE_URL Format Wrong
**Error:** Connection string error or invalid format

**Fix:**
- Make sure you copied `${{ Postgres.DATABASE_URL }}` exactly
- Don't add quotes or change it
- It should be exactly: `${{ Postgres.DATABASE_URL }}`

### Issue 2: Database Not Ready
**Error:** Connection refused or timeout

**Fix:**
- Make sure Postgres service shows "Online" (green)
- Wait a minute for database to fully start
- Try redeploying

### Issue 3: Tables Don't Exist Yet
**Error:** Table doesn't exist or relation error

**Fix:**
- You need to run `npm run db:push` first
- Go to Deployments → Latest → Shell
- Run: `npm run db:push`

### Issue 4: Wrong Variable Name
**Error:** DATABASE_URL not found

**Fix:**
- Check Variables tab
- Make sure it's exactly `DATABASE_URL` (not `DATABASE_URL_` or anything else)
- Value should be exactly: `${{ Postgres.DATABASE_URL }}`

---

## Quick Fix Checklist

1. ✅ Postgres service is "Online" (green)
2. ✅ `DATABASE_URL` variable exists in web service
3. ✅ Value is exactly: `${{ Postgres.DATABASE_URL }}`
4. ✅ No extra quotes or spaces

---

## Share the Error

**Copy the error from the logs and share it here!**

The error will tell us exactly what's wrong.
