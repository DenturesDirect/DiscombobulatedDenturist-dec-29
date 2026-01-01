# 🚀 Railway CLI - Quick Start Guide

## ✅ Step 1: DONE - Railway CLI Installed!

---

## Step 2: Login to Railway

**Run this in your PowerShell:**

```powershell
railway login
```

**What will happen:**
1. Your browser will open automatically
2. Railway will ask you to authorize the CLI
3. Click **"Authorize"** or **"Allow"**
4. Return to PowerShell - you should see "Logged in successfully!"

**If browser doesn't open:**
- Copy the URL that appears in PowerShell
- Paste it into your browser manually
- Authorize it

---

## Step 3: Navigate to Project

**Run:**
```powershell
cd DentureFlowPro
```

---

## Step 4: Link to Your Railway Project

**Run:**
```powershell
railway link
```

**What will happen:**
1. You'll see a list of your Railway projects
2. Use arrow keys to select your project (probably "protective-ambition")
3. Press **Enter** to confirm

---

## Step 5: Run SQL to Create Tables

**Run this command:**
```powershell
railway run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

**OR if that doesn't work, try:**
```powershell
railway run psql $DATABASE_URL -f create_tables.sql
```

**OR if file input doesn't work, we'll use a different method (I'll help you with that).**

---

## Step 6: Verify Tables Created

**Run:**
```powershell
railway run --service Postgres psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

You should see **11** (the number of tables created).

---

## Quick Copy-Paste Commands

Run these one at a time:

```powershell
# 1. Login (opens browser)
railway login

# 2. Go to project
cd DentureFlowPro

# 3. Link to Railway project
railway link

# 4. Create all tables
railway run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

---

## Need Help?

If any step fails, tell me:
- What command you ran
- What error message you saw
- I'll help you fix it!

---

**Start with Step 2: Run `railway login` in your PowerShell!** 🚀
