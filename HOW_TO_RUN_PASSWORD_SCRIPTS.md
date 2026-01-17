# 🚀 How to Run Password Encoding Scripts

## Quick Answer

You have 3 options to run these scripts:

1. **Run locally** (if you have the code on your computer)
2. **Run in Railway Shell** (access via Railway dashboard)
3. **Use Railway CLI** (if you have it installed)

---

## Option 1: Run Locally (Easiest if you have the code)

### Prerequisites
- You need the code on your computer
- Node.js installed (version 18+)
- Navigate to the `DentureFlowPro` folder

### Steps

1. **Open terminal/command prompt** in the `DentureFlowPro` folder

2. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```

3. **Run the interactive setup script:**
   ```bash
   npm run setup-supabase
   ```

4. **Follow the prompts** - it will ask for:
   - Supabase project reference ID
   - Region
   - Port
   - Database password

5. **Copy the generated connection string**

6. **Go to Railway → Your Service → Variables → Update DATABASE_URL**

---

## Option 2: Run in Railway Shell (Recommended if code is only on Railway)

### Steps

1. **Go to Railway Dashboard**
   - Visit https://railway.app/
   - Select your project
   - Click on your **web service** (the one running your app)

2. **Open Railway Shell**
   - Click **"Deployments"** tab
   - Click on the **latest deployment**
   - Look for **"Shell"** button or **"Open Shell"** option
   - This opens a terminal in your Railway container

3. **Navigate to the project directory** (usually already there, but check):
   ```bash
   pwd  # Check current directory
   ls   # List files - should see package.json
   ```

4. **Run the script:**
   ```bash
   npm run setup-supabase
   ```

5. **Follow the prompts** and copy the output connection string

6. **Update Railway Variables**
   - In Railway dashboard, go to your service → **"Variables"** tab
   - Update `DATABASE_URL` with the connection string
   - Save (auto-redeploys)

---

## Option 3: Use Railway CLI (Advanced)

If you have Railway CLI installed:

1. **Install Railway CLI** (if not installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link to your project:**
   ```bash
   railway link
   ```

4. **Run shell command:**
   ```bash
   railway run npm run setup-supabase
   ```

---

## Option 4: Manual Method (No scripts needed)

If you can't run the scripts, you can manually URL-encode your password:

### Step 1: Get Your Password Encoded

**Using Node.js** (if you have it):
```bash
node -e "console.log(encodeURIComponent('your-password-here'))"
```

**Or use an online encoder:**
- Go to https://www.urlencoder.org/
- Paste your password
- Copy the encoded result

### Step 2: Build Connection String Manually

1. **Get template from Supabase:**
   - Supabase Dashboard → Project Settings → Database
   - Click "Session" tab
   - Copy connection string (has `[YOUR-PASSWORD]` placeholder)

2. **Replace `[YOUR-PASSWORD]` with the URL-encoded password**

3. **Update Railway Variables:**
   - Railway → Your Service → Variables
   - Update `DATABASE_URL`

---

## Which Option Should I Use?

**Use Option 1 (Local)** if:
- ✅ You have the code on your computer
- ✅ You have Node.js installed
- ✅ You want the easiest experience

**Use Option 2 (Railway Shell)** if:
- ✅ Code is only on Railway (not locally)
- ✅ You don't have Node.js locally
- ✅ You want to run it in the same environment

**Use Option 3 (CLI)** if:
- ✅ You're comfortable with command line tools
- ✅ You have Railway CLI installed
- ✅ You want to automate things

**Use Option 4 (Manual)** if:
- ✅ Scripts aren't working
- ✅ You just want a quick fix
- ✅ You understand URL encoding

---

## Troubleshooting

### "npm: command not found" in Railway Shell

The shell might not have npm. Try:
```bash
which npm
which node
```

If not found, Railway Shell might not be suitable. Use Option 4 (Manual) instead.

### "Cannot find module" errors

Make sure you're in the right directory:
```bash
cd DentureFlowPro  # or wherever package.json is
```

### Script doesn't run

Try running it directly with tsx:
```bash
npx tsx scripts/interactive-supabase-setup.ts
```

---

## Quick Reference

**Interactive setup:**
```bash
npm run setup-supabase
```

**Command-line helper:**
```bash
npm run build-connection "template" "password"
```

**Check database connection:**
```bash
npm run check-db
```

---

## Still Stuck?

If none of these options work, use **Option 4 (Manual)** or consider switching to **Railway PostgreSQL** (see `MIGRATE_TO_RAILWAY_DB.md`) - no password encoding needed!
