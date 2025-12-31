# 🚀 Deploy to Render (FREE - No Credit Card Needed!)

## Step 1: Sign Up for Render (2 minutes)

1. Go to: **https://render.com/**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (use the same account)
4. Verify your email if needed

---

## Step 2: Create Web Service (3 minutes)

1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Click **"Connect account"** next to GitHub (if not already connected)
4. Find and select: **`DenturesDirect/DiscombobulatedDenturist-dec-29`**
5. Click **"Connect"**

---

## Step 3: Configure Web Service (2 minutes)

Fill in these settings:

- **Name**: `dentureflowpro` (or whatever you want)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: Leave empty (or `DentureFlowPro` if needed)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: **Free** (select this!)

Click **"Create Web Service"**

---

## Step 4: Add PostgreSQL Database (1 minute)

1. While the web service is building, click **"New +"** again
2. Select **"PostgreSQL"**
3. Name it: `dentureflowpro-db` (or whatever)
- **Plan**: **Free** (select this!)
- **Region**: Same as your web service
4. Click **"Create Database"**
5. **Wait for it to provision** (takes 1-2 minutes)

---

## Step 5: Get Database URL (30 seconds)

1. Click on your **PostgreSQL** service
2. Go to **"Connections"** tab
3. Copy the **"Internal Database URL"** (looks like: `postgresql://user:pass@host:5432/dbname`)
4. **Save this somewhere** - you'll need it!

---

## Step 6: Set Environment Variables (2 minutes)

1. Go back to your **Web Service**
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"** and add these:

   **Variable 1:**
   - Key: `DATABASE_URL`
   - Value: `[Paste the Internal Database URL from Step 5]`
   - Click "Save"

   **Variable 2:**
   - Key: `SESSION_SECRET`
   - Value: `dentures-direct-secret-key-2024-change-later`
   - Click "Save"

   **Variable 3:**
   - Key: `NODE_ENV`
   - Value: `production`
   - Click "Save"

   **Variable 4:**
   - Key: `PORT`
   - Value: `5000`
   - Click "Save"

4. After adding all variables, Render will **automatically redeploy**

---

## Step 7: Set Up Database Tables (2 minutes)

**Option A: Using Render Shell**
1. Go to your **Web Service**
2. Click **"Shell"** tab (or look for terminal/shell option)
3. Type: `npm run db:push`
4. Press Enter
5. Wait for "✓ Push completed"

**Option B: Run Locally**
1. Copy the `DATABASE_URL` from Render
2. In your local terminal:
   ```powershell
   cd DentureFlowPro
   $env:DATABASE_URL="<paste the DATABASE_URL here>"
   npm run db:push
   ```

---

## Step 8: Get Your Live URL (30 seconds)

1. Go to your **Web Service**
2. Look at the top - you'll see a URL like: `https://dentureflowpro.onrender.com`
3. **Click it** or copy it!
4. Your app is live! 🎉

---

## Step 9: Login & Test

1. Open your Render URL
2. Login with:
   - Email: `damien@denturesdirect.ca`
   - Password: `TempPassword123!`
3. **Share the URL with your staff!**

---

## ✅ DONE!

Your app is now:
- ✅ Live on the internet (FREE!)
- ✅ Using a real database (data saves permanently)
- ✅ Ready for your staff to use and find bugs
- ✅ Accessible from anywhere

---

## 🆘 Troubleshooting

**Build failed?**
- Check the "Logs" tab in your web service
- Make sure build command is: `npm install && npm run build`

**Database connection failed?**
- Make sure you used the **Internal Database URL** (not External)
- Check that DATABASE_URL is set correctly

**App shows errors?**
- Check the "Logs" tab
- Make sure all environment variables are set
- Make sure you ran `npm run db:push`

**Can't find Shell?**
- Run `npm run db:push` locally with the DATABASE_URL from Render

---

## 💡 Render Free Tier Notes

- **Free tier includes:**
  - 750 hours/month (enough for 24/7 operation)
  - Free PostgreSQL database
  - Automatic SSL (HTTPS)
  - Sleeps after 15 minutes of inactivity (wakes up on first request)

- **If your app sleeps:**
  - First request takes ~30 seconds to wake up
  - Subsequent requests are fast
  - This is normal for free tier!



