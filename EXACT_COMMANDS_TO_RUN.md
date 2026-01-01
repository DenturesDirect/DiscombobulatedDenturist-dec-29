# ✅ Exact Commands to Run

## You Have the DATABASE_URL!

Now run these **two commands** in PowerShell:

---

## Command 1: Set the Environment Variable

**Copy and paste this entire line** (it's all one line):

```powershell
$env:DATABASE_URL="postgresql://postgres:OsVPLpeawimURGdEWgZNMVmxJzlkpzdj@postgres.railway.internal:5432/railway"
```

**Press Enter** after pasting.

---

## Command 2: Run the Script

**Then run:**

```powershell
node create-tables.js
```

**Press Enter** and wait for it to finish!

---

## What You'll See

The script will:
1. Connect to the database
2. Create all 11 tables
3. Show you a list of created tables
4. Say "✅ All tables created successfully!"

---

## Quick Copy-Paste (Run Both)

```powershell
$env:DATABASE_URL="postgresql://postgres:OsVPLpeawimURGdEWgZNMVmxJzlkpzdj@postgres.railway.internal:5432/railway"
node create-tables.js
```

**Run them one at a time - wait for the first to finish before running the second!**

---

## After It's Done

1. Go to Railway dashboard
2. Click on **"web"** service  
3. Click **"Restart"** on the crashed deployment
4. Your app should start! 🎉

---

**Run those two commands now!** 🚀
