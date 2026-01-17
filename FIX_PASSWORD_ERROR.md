# 🔴 FIX: "Tenant or user not found" Error

## The Problem

Your logs show:
```
❌ Error: Tenant or user not found
```

This means:
- ✅ Connection to Supabase is working (no more ENETUNREACH!)
- ❌ But the **password in your DATABASE_URL is wrong**

---

## ✅ The Fix

### Step 1: Get Your Correct Database Password

**Option A: Reset Database Password (Easiest)**

1. Go to **Supabase Dashboard** → Your Project
2. Click **Project Settings** (gear icon) → **Database**
3. Scroll to **"Database password"** section
4. Click **"Reset database password"**
5. **Copy the new password** (save it somewhere safe!)

**Option B: Use Existing Password**

If you know your database password, use that.

---

### Step 2: Get the Pooled Connection String

1. Still in **Project Settings** → **Database**
2. Scroll to **"Connection string"** section
3. Click **"Session"** tab
4. Copy the connection string
5. **IMPORTANT:** Replace `[YOUR-PASSWORD]` with the password you just got/reset

The connection string should look like:
```
postgresql://postgres.qhexbhorylsvlpjkchkg:YOUR_ACTUAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Make sure:**
- `YOUR_ACTUAL_PASSWORD` is replaced with the real password (no brackets!)
- It contains `pooler.supabase.com`
- Port is `6543`

---

### Step 3: Update Railway

1. Go to **Railway** → Your Service → **Variables**
2. Find `DATABASE_URL`
3. **Replace the entire value** with the connection string (with correct password)
4. **Save** (Railway will auto-redeploy)

---

### Step 4: Wait and Check

1. Wait 2-3 minutes for redeploy
2. Check Railway logs - you should see:
   ```
   ✅ Database migrations completed
   ✅ Created account for damien@denturesdirect.ca
   ```
3. **NO MORE** "Tenant or user not found" errors!

---

## 🎯 Quick Checklist

- [ ] Reset database password in Supabase (or use existing one)
- [ ] Got pooled connection string from Supabase (Session tab)
- [ ] Replaced `[YOUR-PASSWORD]` with actual password (no brackets!)
- [ ] Updated `DATABASE_URL` in Railway Variables
- [ ] Saved and waited for redeploy
- [ ] Checked logs - no more "Tenant or user not found"
- [ ] Tried logging in - should work!

---

## ⚠️ Common Mistakes

1. **Leaving `[YOUR-PASSWORD]` in the string** - Must replace with actual password!
2. **Using old password** - If you reset it, use the NEW one
3. **Extra spaces** - Make sure no spaces before/after the connection string
4. **Wrong connection string** - Must use "Session" tab, not "URI" tab

---

**The password is wrong in your DATABASE_URL. Reset it in Supabase and update Railway!** 🔧
