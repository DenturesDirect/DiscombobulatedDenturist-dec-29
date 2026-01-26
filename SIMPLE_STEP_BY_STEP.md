# 📋 Simple Step-by-Step: Check Where Your Patients Are

## What We're Doing

We're going to check if your patient data is in Railway database or Supabase database. Follow these steps EXACTLY.

---

## Step 1: Open PowerShell

1. Press **Windows key**
2. Type: `powershell`
3. Press **Enter**
4. PowerShell window opens

---

## Step 2: Go to Your Project Folder

**Copy and paste this EXACT command** (then press Enter):

```powershell
cd "c:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro"
```

**You should see:** The prompt changes to show your project folder path

---

## Step 3: Get Your Railway Database URL

1. **Open a web browser**
2. **Go to:** https://railway.app/dashboard
3. **Click on your project** (the one with Postgres)
4. **Click on "Postgres" service** (the database)
5. **Click "Variables" tab**
6. **Find "DATABASE_URL"**
7. **Click the copy button** next to DATABASE_URL (or select and copy the whole thing)
8. **It looks like:** `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

---

## Step 4: Run the Check Script

**In PowerShell, type this EXACT command** (replace `YOUR_DATABASE_URL_HERE` with what you copied):

```powershell
$env:DATABASE_URL="YOUR_DATABASE_URL_HERE"; npm run check-patients
```

**Example** (yours will be different):
```powershell
$env:DATABASE_URL="postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway"; npm run check-patients
```

**Press Enter**

---

## Step 5: Read the Results

**You'll see one of these:**

### ✅ If you see patients listed:
- **Good!** Your patients ARE in Railway database
- **The problem** might be the app not showing them (different issue)
- **Tell me:** "I see X patients in Railway"

### ❌ If you see "No patients found":
- **Problem!** Patients are NOT in Railway database
- **Next step:** We need to check Supabase
- **Tell me:** "No patients in Railway"

---

## Step 6: If No Patients in Railway, Check Supabase

**Only do this if Step 5 showed "No patients found"**

### 6a: Check if you have Supabase

1. **In Railway dashboard** (same place as before)
2. **Click on "Web" service** (not Postgres)
3. **Click "Variables" tab**
4. **Look for:** `SUPABASE_URL` or `SUPABASE_PROJECT_URL`
5. **If you see it:** Copy the value
6. **If you DON'T see it:** You might not have Supabase set up

### 6b: If you have SUPABASE_URL

**The SUPABASE_URL looks like:** `https://xxxxx.supabase.co`

**To get the database connection string:**
1. **Go to:** https://supabase.com/dashboard
2. **Click on your project** (if you have one)
3. **Go to:** Project Settings → Database
4. **Find:** "Connection string" section
5. **Select:** "URI" tab
6. **Copy** the connection string
7. **It looks like:** `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

### 6c: Run Supabase Check

**In PowerShell, type this** (replace with your Supabase connection string):

```powershell
$env:SUPABASE_DATABASE_URL="YOUR_SUPABASE_CONNECTION_STRING_HERE"; npm run check-supabase-patients
```

**Press Enter**

---

## Step 7: Tell Me What You Found

**After running the checks, tell me:**

1. **How many patients in Railway?** (from Step 5)
2. **How many patients in Supabase?** (from Step 6, if you ran it)
3. **Which database has your data?**

---

## Troubleshooting

### "Command not found" or "npm not found"
- You need to install Node.js first
- Tell me and I'll help

### "DATABASE_URL not set"
- Make sure you copied the ENTIRE connection string
- Make sure you pasted it between the quotes
- Try again

### "Connection failed"
- Check that you copied the DATABASE_URL correctly
- Make sure Railway database is running
- Try again

---

## Quick Reference

**Check Railway database:**
```powershell
cd "c:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro"
$env:DATABASE_URL="paste_railway_url_here"; npm run check-patients
```

**Check Supabase database:**
```powershell
cd "c:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro"
$env:SUPABASE_DATABASE_URL="paste_supabase_url_here"; npm run check-supabase-patients
```

---

**Start with Step 1 and go through each step. Tell me when you're done or if you get stuck!**
