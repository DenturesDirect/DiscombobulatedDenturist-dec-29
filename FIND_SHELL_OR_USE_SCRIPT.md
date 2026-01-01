# Can't Find Shell? Use This Script Instead!

Since you can't find the Shell tab, let's just run the script from your computer. It's actually easier!

---

## Step-by-Step (2 minutes)

### Step 1: Get Your Database URL

1. **Go to Railway** → Your project
2. Click on the **Postgres** service (database icon)
3. Click the **"Variables"** tab
4. **Find `DATABASE_PUBLIC_URL`** (or `DATABASE_URL` if that's all you see)
5. **Click the copy icon** next to it (or click to reveal, then copy)

### Step 2: Open PowerShell

1. Press **Windows Key + X**
2. Click **"Windows PowerShell"** or **"Terminal"**

### Step 3: Run These Commands

Copy and paste these one at a time (replace `YOUR_URL_HERE` with what you copied):

```powershell
cd C:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro
```

```powershell
$env:DATABASE_URL="YOUR_URL_HERE"
```

(Paste your database URL between the quotes)

```powershell
node add-text-notifications.js
```

### Step 4: Done!

You should see:
```
✅ Connected
✅ Column added successfully
✅ Verification: Column exists
```

---

## If You Still Can't Find It

**Alternative:** Just tell me and I can help you:
1. Find the exact location in Railway
2. Or create a different method

The script method above should work though - just need that database URL from the Variables tab!

---

## What the Shell Tab Looks Like

If you want to keep looking for it:
- It's usually a **black box icon** or **`>_`** symbol
- Might be called **"Terminal"** instead of "Shell"
- Usually at the **top** of the Postgres service page
- Next to tabs like "Variables", "Settings", "Metrics"

But honestly, the script method is easier! 😊
