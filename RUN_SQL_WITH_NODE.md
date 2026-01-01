# 🚀 Run SQL Using Node.js (No psql Needed!)

## The Problem

`psql` isn't installed on your computer, but we can use Node.js instead!

---

## Solution: Use Node.js Script

I've created a Node.js script that will:
1. Connect to your Railway database
2. Read the SQL file
3. Execute all the SQL statements
4. Create all 11 tables

---

## Step 1: Get DATABASE_URL from Railway

1. **Go to Railway dashboard** in your browser
2. **Click on "Postgres" service**
3. **Go to "Variables" tab**
4. **Copy the `DATABASE_URL` value**

---

## Step 2: Run the Node.js Script

**In PowerShell, run:**

```powershell
$env:DATABASE_URL="<paste the DATABASE_URL here>"
node create-tables.js
```

**Replace `<paste the DATABASE_URL here>` with the actual DATABASE_URL you copied!**

---

## Example

```powershell
$env:DATABASE_URL="postgresql://postgres:password@host:port/database"
node create-tables.js
```

---

## What You'll See

The script will:
- Connect to the database
- Execute all SQL statements
- Show progress for each table
- List all created tables at the end

---

## After Tables Are Created

1. Go to Railway dashboard
2. Click on **"web"** service
3. Click **"Restart"** on the crashed deployment
4. Your app should start successfully! 🎉

---

**Get the DATABASE_URL from Railway, then run the script!** 🚀
