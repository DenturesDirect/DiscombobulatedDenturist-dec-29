# 🚨 Fix Login Issues - Step by Step

## The Problem
Site is deployed but nobody can log in. This is usually because:
1. Database connection is still failing (IPv6 issue)
2. Staff accounts don't exist in the database
3. Staff accounts exist but don't have passwords

---

## 🔍 Step 1: Diagnose the Issue

Run the diagnostic tool to see exactly what's wrong:

```bash
cd DentureFlowPro
npm run diagnose-login
```

This will tell you:
- ✅ If database connection works
- ✅ If staff accounts exist
- ✅ What needs to be fixed

---

## 🔧 Step 2: Fix Based on Diagnostic Results

### If Database Connection is Failing:

**The problem:** Your `DATABASE_URL` still has IPv6 or isn't using the pooler.

**The fix:**
1. Go to **Supabase Dashboard** → Your Project → **Project Settings** → **Database**
2. Scroll to **"Connection string"** section
3. Click **"Session"** tab (NOT "URI")
4. Copy the connection string (contains `pooler.supabase.com`)
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Go to **Railway** → Your Service → **Variables**
7. Update `DATABASE_URL` with the pooled connection string
8. **Redeploy** (Railway usually auto-redeploys when you change variables)

### If Staff Accounts Don't Exist:

**The problem:** Accounts weren't created because database connection failed during startup.

**The fix:**
1. **First, fix the database connection** (see above)
2. **Redeploy your app** - the `seedStaffAccounts()` function will run on startup
3. Check logs - you should see:
   ```
   ✅ Created account for damien@denturesdirect.ca
   ✅ Created account for michael@denturesdirect.ca
   ...etc
   ```

### If Accounts Exist But Have No Passwords:

**The problem:** Accounts were created but passwords weren't set.

**The fix:**
1. **Redeploy your app** - the seed function will set passwords for accounts without them
2. Or use the emergency password reset endpoint (see below)

---

## 🆘 Emergency Fix: Create Accounts Manually

If redeploying doesn't work, you can manually create accounts using the emergency reset endpoint:

### Option 1: Use Emergency Reset Endpoint

The app has an emergency password reset endpoint that can create accounts if they don't exist. However, it requires the account to already exist.

### Option 2: Create Accounts via SQL

If you have access to Supabase SQL Editor:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL (replace `YOUR_PASSWORD_HASH` with a bcrypt hash):

```sql
-- First, make sure you have the offices
INSERT INTO offices (id, name) 
VALUES 
  ('dentures-direct-id', 'Dentures Direct'),
  ('toronto-smile-centre-id', 'Toronto Smile Centre')
ON CONFLICT (id) DO NOTHING;

-- Then create staff accounts (you'll need to hash passwords first)
-- Use an online bcrypt generator or the app's hashPassword function
```

**Easier way:** Just fix the database connection and redeploy - the app will create accounts automatically!

---

## ✅ Step 3: Verify It's Fixed

After fixing and redeploying:

1. **Check Railway logs:**
   - Should see: `✅ Database migrations completed`
   - Should see: `✅ Created account for damien@denturesdirect.ca`
   - Should NOT see: `ENETUNREACH` errors

2. **Try logging in:**
   - Email: `damien@denturesdirect.ca`
   - Password: `TempPassword123!`

3. **If login still fails:**
   - Run `npm run diagnose-login` again
   - Check what it says
   - Share the output if you need help

---

## 🎯 Quick Checklist

- [ ] Database connection works (no ENETUNREACH errors)
- [ ] Using pooled connection string (contains `pooler.supabase.com`)
- [ ] Staff accounts exist in database
- [ ] Staff accounts have passwords
- [ ] App has been redeployed after fixing DATABASE_URL
- [ ] Can log in with damien@denturesdirect.ca / TempPassword123!

---

## 🔍 What to Check in Railway Logs

After redeploying, look for:

**✅ Good signs:**
```
✅ Database migrations completed
✅ Using persistent storage - data will be saved
✅ Created account for damien@denturesdirect.ca
✅ Created account for michael@denturesdirect.ca
...etc
```

**❌ Bad signs:**
```
❌ Migration error: connect ENETUNREACH...
❌ Error seeding account for damien@denturesdirect.ca: connect ENETUNREACH...
```

If you see ENETUNREACH errors, the database connection is still broken - you need to fix the DATABASE_URL.

---

## 💡 Most Common Issue

**90% of login issues are because DATABASE_URL is still using IPv6 or direct connection.**

**The fix is always the same:**
1. Get pooled connection string from Supabase (Session tab)
2. Update DATABASE_URL in Railway
3. Redeploy

Once the database connection works, accounts will be created automatically on startup, and login will work!

---

**Run `npm run diagnose-login` first to see exactly what's wrong!** 🔍
