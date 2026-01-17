# 🔍 How to Run the Database Diagnostic

## Option 1: Run Locally (Recommended - Easiest)

### Step 1: Open Terminal/Command Prompt

**Windows:**
- Press `Win + X` and select "Windows PowerShell" or "Terminal"
- OR press `Win + R`, type `powershell`, press Enter

**Mac/Linux:**
- Press `Cmd + Space` (Mac) or `Ctrl + Alt + T` (Linux)
- Type "Terminal" and press Enter

### Step 2: Navigate to Your Project

```bash
cd "C:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro"
```

**Or if you're already in the Dental_Saas folder:**
```bash
cd DentureFlowPro
```

### Step 3: Run the Diagnostic

```bash
npm run check-db
```

**That's it!** The script will:
- Check your `.env` file (if you have one locally)
- Analyze your connection string
- Tell you what's wrong and how to fix it

---

## Option 2: Run in Railway (If You Have Shell Access)

### Step 1: Access Railway Shell

1. Go to https://railway.app/
2. Select your project
3. Click on your service
4. Go to **"Deployments"** tab
5. Click on the latest deployment
6. Look for **"Shell"** or **"Console"** button
7. Click it to open a terminal

### Step 2: Run the Diagnostic

```bash
npm run check-db
```

**Note:** This will check the `DATABASE_URL` environment variable that Railway has set.

---

## Option 3: Check Railway Environment Variables Directly

If you can't run the script, you can check your `DATABASE_URL` directly:

1. Go to Railway → Your Project → Your Service
2. Click **"Variables"** tab
3. Find `DATABASE_URL`
4. Check if it contains:
   - ❌ `2600:1f18` (IPv6 address - BAD)
   - ❌ `db.xxx.supabase.co:5432` (direct connection - might not work)
   - ✅ `pooler.supabase.com:6543` (pooled connection - GOOD)

---

## What You'll See

### If Connection is Good:
```
✅ Using pooled connection - This should work!
✅ Connection successful!
```

### If Connection Needs Fixing:
```
❌ Using IPv6 direct connection - This will fail!
❌ Connection failed: connect ENETUNREACH...
📋 Next Steps:
   1. Go to Supabase Dashboard...
   2. Get pooled connection string...
```

---

## Troubleshooting

### "Command not found" or "npm: command not found"
- Make sure Node.js is installed
- Try: `node --version` (should show v18 or higher)
- If not installed: Download from https://nodejs.org/

### "Cannot find module 'dotenv'"
- The script will still work - it just won't load `.env` file
- It will use environment variables from Railway instead

### "DATABASE_URL is not set"
- The script is checking your local `.env` file
- If you don't have one locally, that's okay
- The script will still tell you what format to use
- You need to update it in Railway Variables

---

## Quick Check Without Running Script

You can also just check your Railway Variables:

1. **Railway** → Your Service → **Variables**
2. Look at `DATABASE_URL`
3. If it contains `pooler.supabase.com` → ✅ Good!
4. If it contains `2600:1f18` or IPv6 → ❌ Needs fixing!

---

## After Running Diagnostic

The script will give you:
1. ✅ What's wrong (if anything)
2. 📋 Step-by-step instructions to fix it
3. 🔧 Exact connection string format you need

Then follow the steps it provides!
