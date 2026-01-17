# 🔌 Reconnect Supabase to Railway - Complete Guide

## Quick Summary

You need to get the **pooled connection string** from Supabase and update the `DATABASE_URL` environment variable in Railway. This guide walks you through it step-by-step.

**⚠️ Getting "password authentication failed" errors?** This is usually due to special characters in passwords needing URL encoding. See `FIX_PASSWORD_ENCODING.md` for the solution - or use `npm run setup-supabase` to automatically handle it!

---

## ✅ Step-by-Step Instructions

### Step 1: Get Your Supabase Pooled Connection String

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in with your account
   - Select your project (the one you want to reconnect)

2. **Navigate to Database Settings**
   - Click **"Project Settings"** (gear icon at the bottom of left sidebar)
   - Click **"Database"** in the settings menu

3. **Find the Connection String Section**
   - Scroll down to find **"Connection string"** section
   - You'll see **TABS** at the top:
     - ❌ **"URI"** - Direct connection (don't use this)
     - ✅ **"Session"** or **"Session pooler"** - **USE THIS ONE!**
     - ✅ **"Transaction"** - Alternative option (also works)

4. **Copy the Pooled Connection String**
   - Click on the **"Session"** tab
   - You'll see a connection string like:
     ```
     postgresql://postgres.qhexbhorylsvlpjkchkg:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - **Key features you should see:**
     - ✅ `pooler.supabase.com` in the hostname (THIS IS CRITICAL!)
     - ✅ Port `6543` (or sometimes `5432` if it's the newer pooler)
     - ✅ `?pgbouncer=true` at the end

5. **Replace the Password Placeholder**
   - The connection string will have `[YOUR-PASSWORD]` or `[PASSWORD]`
   - **Replace it with your actual database password**
   - If you don't know your password:
     - In the same Database settings page, find **"Database password"** section
     - Click **"Reset database password"**
     - Copy the new password
     - Use it in your connection string

6. **Final Connection String Should Look Like:**
   ```
   postgresql://postgres.qhexbhorylsvlpjkchkg:YourActualPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   - No `[YOUR-PASSWORD]` placeholder
   - Has `pooler.supabase.com` in the hostname
   - Has `?pgbouncer=true` at the end

---

### Step 2: Update Railway Environment Variable

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/
   - Log in with your account
   - Select your project

2. **Open Your Service**
   - Click on your **web service** (the one running your app)
   - If you have multiple services, make sure you're selecting the correct one

3. **Navigate to Variables Tab**
   - Click on **"Variables"** tab
   - You should see a list of environment variables

4. **Find and Update DATABASE_URL**
   - Look for `DATABASE_URL` in the list
   - Click on it to edit
   - **Replace the entire value** with the pooled connection string you copied from Supabase
   - **Make absolutely sure:**
     - ✅ No extra spaces before or after
     - ✅ Password is replaced (no `[YOUR-PASSWORD]` placeholder)
     - ✅ The string has `pooler.supabase.com` in it
   - Click **"Save"** or **"Update"**

5. **Railway Will Auto-Redeploy**
   - Railway automatically redeploys when you change environment variables
   - You'll see a new deployment start automatically
   - Wait 2-3 minutes for it to complete

---

### Step 3: Verify the Connection

1. **Check Railway Logs**
   - Go to **"Deployments"** tab
   - Click on the latest deployment
   - Click **"Logs"** tab
   - Look for these messages:
     ```
     ✅ Database migrations completed
     ✅ Using persistent storage - data will be saved
     ```
   - **You should NOT see:**
     - ❌ `ENETUNREACH` errors
     - ❌ `ETIMEDOUT` errors
     - ❌ `connection refused` errors
     - ❌ IPv6 address errors

2. **Test the Connection (Optional)**
   - If you want to verify locally:
     ```bash
     # Set your DATABASE_URL temporarily
     export DATABASE_URL="your-connection-string-here"
     
     # Run the check script
     npm run check-db
     ```
   - Or check Railway logs after deployment - they should show successful database connection

3. **Test Login**
   - Visit your Railway app URL
   - Try logging in with a staff account:
     - Email: `damien@denturesdirect.ca`
     - Password: `TempPassword123!` (or your custom password)
   - If login works, the database connection is successful! ✅

---

## 🔍 Troubleshooting

### Problem: Can't Find "Session" Tab in Supabase

**Solution:**
- Make sure you're in **Project Settings** → **Database** (not SQL Editor)
- Scroll down - it might be below the password section
- If you still don't see tabs, look for a dropdown or section called "Connection pooling"

### Problem: Connection String Has IPv6 Address

**Symptoms:**
- Connection string has something like: `2600:1f18:2e13:9d3b:3676:ed9c:3af6:404f`
- This is the WRONG connection string format

**Solution:**
- Use the **"Session"** tab connection string instead
- It should have `pooler.supabase.com` in it, NOT an IPv6 address

### Problem: Still Getting Connection Errors After Update

**Check these:**
1. **Did Railway redeploy?**
   - Check the Deployments tab - should see a new deployment after you changed the variable
   - If not, manually trigger a redeploy

2. **Is the password correct?**
   - Make sure you replaced `[YOUR-PASSWORD]` with the actual password
   - Try resetting the password in Supabase and updating it again

3. **Is the connection string format correct?**
   - Must have `pooler.supabase.com` in the hostname
   - Must have `?pgbouncer=true` at the end
   - No extra spaces or characters

4. **Check Railway Logs:**
   - Look for specific error messages
   - Common issues:
     - `password authentication failed` = Wrong password
     - `ENETUNREACH` = Still using wrong connection string
     - `connection refused` = Port or hostname issue

### Problem: DATABASE_URL Variable Not Showing Up in Railway

**Solution:**
1. Make sure you're looking in the correct service
2. If you have a Railway PostgreSQL database connected, Railway might have auto-set `DATABASE_URL` to point to that instead
3. You may need to manually add `DATABASE_URL` as a custom variable
4. Railway might also have it in a different location - check Settings → Variables

---

## 📋 Quick Checklist

Before you start, make sure you have:
- [ ] Access to Supabase dashboard (login works)
- [ ] Access to Railway dashboard (login works)
- [ ] Know which Supabase project to use
- [ ] Know which Railway project/service to update

During setup:
- [ ] Got pooled connection string from Supabase (Session tab)
- [ ] Replaced `[YOUR-PASSWORD]` with actual password
- [ ] Connection string has `pooler.supabase.com` in hostname
- [ ] Updated `DATABASE_URL` in Railway Variables
- [ ] Railway redeployed after variable change
- [ ] Checked logs - no connection errors
- [ ] Tested login - it works!

---

## 🎯 What Success Looks Like

After completing these steps, you should see in Railway logs:
```
📝 Storage mode: POSTGRESQL DATABASE
✅ Using persistent storage - data will be saved
✅ Database migrations completed
```

And when you try to log in:
- ✅ Login page loads
- ✅ Entering credentials works
- ✅ You're redirected to the dashboard
- ✅ No authentication errors

---

## 💡 Why This Works

**The Problem:**
- Direct Supabase connections (URI tab) use IPv6 addresses or direct database connections
- Railway may have trouble reaching these connections
- This causes `ENETUNREACH` or `ETIMEDOUT` errors

**The Solution:**
- Pooled connections (Session tab) use Supabase's connection pooler
- The pooler uses a stable hostname (`pooler.supabase.com`)
- Railway can reliably connect to this hostname
- Connection pooling also handles multiple connections efficiently

---

## 🆘 Still Need Help?

If you're still having issues after following this guide:

1. **Check Railway Logs:**
   - Copy the exact error message
   - Look for lines that mention "database", "connection", or "ENETUNREACH"

2. **Verify Your Connection String:**
   - Show the first 100 characters (hiding the password)
   - Check if it has `pooler.supabase.com` in it

3. **Double-Check Variables:**
   - Make sure `DATABASE_URL` is set correctly
   - No typos or extra spaces
   - Password is correct

---

**You've got this! Once you update that `DATABASE_URL` with the pooled connection string, everything should work.** 🚀
