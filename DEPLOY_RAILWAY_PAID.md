# 🚂 Deploy to Railway ($5/month - Fast & Reliable)

## Step 1: Sign Up & Add Payment (2 minutes)

1. Go to: **https://railway.app/**
2. Click **"Start a New Project"** or **"Login"**
3. Sign up/Login with **GitHub** (same account)
4. **Add payment method:**
   - Click your profile → **"Account Settings"**
   - Go to **"Billing"** tab
   - Add credit card (you'll be charged $5/month)
   - This unlocks the Developer plan

---

## Step 2: Deploy from GitHub (3 minutes)

1. In Railway dashboard, click **"New Project"**
2. Click **"Deploy from GitHub repo"**
3. Find and select: **`DenturesDirect/DiscombobulatedDenturist-dec-29`**
4. Railway will automatically:
   - Detect it's a Node.js app
   - Start building
   - Deploy it
5. **Wait 2-3 minutes** for first deployment

---

## Step 3: Add PostgreSQL Database (1 minute)

1. In your Railway project, click **"+ New"** button
2. Click **"Database"**
3. Select **"Add PostgreSQL"**
4. Railway creates it automatically
5. **Note:** Database is included in $5/month plan!

---

## Step 4: Connect Database to App (30 seconds)

1. Click on your **Web Service** (the one that's not PostgreSQL)
2. Go to **"Settings"** tab
3. Scroll down to **"Service Connect"** section
4. Find your **PostgreSQL** service
5. Click **"Connect"** next to it
6. Railway automatically sets `DATABASE_URL` for you!

---

## Step 5: Set Environment Variables (2 minutes)

1. Click on your **Web Service**
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add these:

   **Variable 1: SESSION_SECRET**
   - Key: `SESSION_SECRET`
   - Value: `dentures-direct-secret-key-2024-change-later`
   - Click "Add"

   **Variable 2: NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Click "Add"

   **Variable 3: PORT**
   - Key: `PORT`
   - Value: `5000`
   - Click "Add"

   **Variable 4: GOOGLE_AI_API_KEY** (Optional - for AI features)
   - Key: `GOOGLE_AI_API_KEY`
   - Value: Your API key from https://aistudio.google.com/
   - Click "Add" (or skip if you don't have it yet)

**IMPORTANT:** Don't add `DATABASE_URL` - Railway sets it automatically when you connect the database!

---

## Step 6: Set Up Database Tables (2 minutes)

1. Click on your **Web Service**
2. Go to **"Deployments"** tab
3. Click on the **latest deployment** (top one)
4. Look for **"Shell"** button and click it
   - (Or: Click "View Logs" → Look for terminal/shell option)
5. In the shell terminal, type:
   ```bash
   npm run db:push
   ```
6. Press Enter
7. Wait for "✓ Push completed" or similar success message

**Alternative if Shell doesn't work:**
- Copy `DATABASE_URL` from Railway (PostgreSQL → Variables)
- Run locally:
  ```powershell
  cd DentureFlowPro
  $env:DATABASE_URL="<paste from Railway>"
  npm run db:push
  ```

---

## Step 7: Get Your Live URL (30 seconds)

1. Click on your **Web Service**
2. Go to **"Settings"** tab
3. Scroll to **"Domains"** section
4. You'll see a URL like: `https://your-app-name.up.railway.app`
5. **Click it** or copy it!
6. Your app is live! 🎉

---

## Step 8: Test It!

1. Open your Railway URL in browser
2. Login with:
   - Email: `damien@denturesdirect.ca`
   - Password: `TempPassword123!`
3. **Share the URL with your staff!**

---

## ✅ DONE!

Your app is now:
- ✅ Live on the internet (fast & reliable!)
- ✅ Using a real database (data saves permanently)
- ✅ No sleeping (stays awake 24/7)
- ✅ Fast response times
- ✅ Ready for your staff to use and find bugs
- ✅ Accessible from anywhere

---

## 💰 What You're Paying For

**$5/month gets you:**
- ✅ Developer plan (better than free tier)
- ✅ PostgreSQL database included
- ✅ No sleeping (always awake)
- ✅ Faster performance
- ✅ Better reliability
- ✅ More resources

**Worth it for:**
- Staff actively using the app
- No slow wake-up times
- Better user experience
- Production-ready performance

---

## 🆘 Troubleshooting

**Build failed?**
- Check "Deployments" → "View Logs"
- Make sure all code is pushed to GitHub

**Database not working?**
- Make sure PostgreSQL is connected (Step 4)
- Check that you ran `npm run db:push` (Step 6)
- Verify DATABASE_URL is set (Railway does this automatically)

**Can't find Shell?**
- Try: Deployments → Latest → "View Logs" → Look for terminal option
- Or run `npm run db:push` locally with DATABASE_URL from Railway

**App shows errors?**
- Check the logs in Railway
- Make sure all environment variables are set
- Verify database connection is working

---

## 🚀 Next Steps

1. **Share URL with staff** - They can start testing!
2. **Change default passwords** - After first login
3. **Add real data** - Start using it for real patients
4. **Find and fix bugs** - As your staff uses it

**You're all set!** 🎉

