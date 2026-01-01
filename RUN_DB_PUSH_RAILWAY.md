# 🚀 How to Run `npm run db:push` on Railway

## I See Your Deployment Page!

I can see you're on the Deployments tab. The Shell button might be hidden or in a menu.

---

## Method 1: Check the Three-Dots Menu

1. **Look at the crashed deployment** (the red box at the top)
2. **Click the three dots** (⋮) on the right side of that deployment
3. **Look for "Shell" or "Open Shell"** in the menu
4. Click it if you see it

---

## Method 2: Use Railway CLI (Recommended - Easiest!)

This is the most reliable way:

### Step 1: Install Railway CLI
```powershell
npm install -g @railway/cli
```

### Step 2: Login to Railway
```powershell
railway login
```
This will open a browser - just approve it.

### Step 3: Link to Your Project
```powershell
cd DentureFlowPro
railway link
```
Select your project when prompted.

### Step 4: Run the Command
```powershell
railway run npm run db:push
```

This will run the command in Railway's environment with all the right environment variables!

---

## Method 3: Run Locally (Also Works!)

If you prefer, you can run it from your computer:

### Step 1: Get DATABASE_URL from Railway
1. Click on **"Postgres"** service (left sidebar)
2. Go to **"Variables"** tab
3. Copy the `DATABASE_URL` value

### Step 2: Run Locally
```powershell
cd DentureFlowPro
$env:DATABASE_URL="<paste the DATABASE_URL here>"
npm run db:push
```

---

## Which Method Should You Use?

- **Method 2 (Railway CLI)** - Best if you want to run it in Railway's environment
- **Method 3 (Local)** - Easiest if you just want to get it done quickly

Both will work! Choose whichever is easier for you.

---

## After Running `npm run db:push`

Once it completes:
1. You should see: `✓ Push completed` or similar
2. Go back to Railway dashboard
3. Click **"Restart"** on the crashed deployment
4. The app should start successfully!

---

## Quick Summary

**Easiest:** Use Railway CLI
```powershell
npm install -g @railway/cli
railway login
cd DentureFlowPro
railway link
railway run npm run db:push
```

**Alternative:** Run locally
```powershell
cd DentureFlowPro
$env:DATABASE_URL="<from Railway Postgres Variables>"
npm run db:push
```
