# Complete Step-by-Step Deployment Guide

## 🚀 Deploying to Railway (Step-by-Step)

### STEP 1: Sign Up for Railway
1. Go to: **https://railway.app/**
2. Click **"Start a New Project"** or **"Login"**
3. Choose **"Login with GitHub"** (easiest option)
4. Authorize Railway to access your GitHub

---

### STEP 2: Prepare Your Code (If Not Already on GitHub)

**If your code is NOT on GitHub yet:**

1. Go to **https://github.com/** and sign in
2. Click the **"+"** icon → **"New repository"**
3. Name it: `Dental_Saas` (or whatever you want)
4. Make it **Private** (recommended)
5. Click **"Create repository"**
6. Follow GitHub's instructions to push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/Dental_Saas.git
   git push -u origin main
   ```

**If your code IS already on GitHub:**
- Skip to STEP 3

---

### STEP 3: Deploy to Railway

1. In Railway, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select your `Dental_Saas` repository
4. Railway will start deploying automatically
5. Wait for it to finish (takes 2-5 minutes)

---

### STEP 4: Add PostgreSQL Database

1. In your Railway project, click **"+ New"** button
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will create the database automatically
5. **IMPORTANT**: Railway will automatically set `DATABASE_URL` - you don't need to do anything!

---

### STEP 5: Set Environment Variables

1. Click on your **Web Service** (not the database)
2. Go to the **"Variables"** tab
3. Click **"+ New Variable"** and add these one by one:

   **Variable 1: SESSION_SECRET**
   - Name: `SESSION_SECRET`
   - Value: Generate one by running this locally:
     ```powershell
     # In PowerShell, run:
     [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
     ```
     Or use: `your-super-secret-random-string-here-make-it-long-and-random-12345`

   **Variable 2: NODE_ENV**
   - Name: `NODE_ENV`
   - Value: `production`

   **Variable 3: GOOGLE_AI_API_KEY** (Optional - for AI features)
   - Name: `GOOGLE_AI_API_KEY`
   - Value: Your API key from https://aistudio.google.com/
   - (You can add this later if you don't have it yet)

   **Variable 4: PORT**
   - Name: `PORT`
   - Value: `5000`

4. **DON'T add DATABASE_URL** - Railway adds it automatically when you connect the PostgreSQL service!

---

### STEP 6: Connect Database to Your App

1. In your Railway project, you should see two services:
   - Your Web Service (the app)
   - PostgreSQL (the database)
2. Click on your **Web Service**
3. Go to **"Settings"** tab
4. Scroll down to **"Service Connect"** section
5. Find your PostgreSQL service and click **"Connect"**
6. This automatically sets `DATABASE_URL` for you!

---

### STEP 7: Set Up Database Schema

**Option A: Using Railway Shell (Easiest)**
1. Click on your **Web Service**
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Logs"** or **"Shell"** button
5. In the shell, run:
   ```bash
   npm run db:push
   ```
6. Wait for it to complete

**Option B: Run Locally**
1. In Railway, go to your PostgreSQL service
2. Go to **"Variables"** tab
3. Copy the `DATABASE_URL` value
4. In your local terminal, run:
   ```powershell
   cd DentureFlowPro
   $env:DATABASE_URL="<paste the DATABASE_URL here>"
   npm run db:push
   ```

---

### STEP 8: Get Your Live URL

1. In Railway, click on your **Web Service**
2. Go to **"Settings"** tab
3. Scroll to **"Domains"** section
4. You'll see a URL like: `https://your-app-name.up.railway.app`
5. **Click the URL** to open your live app!

---

### STEP 9: Test Your Deployment

1. Open your Railway URL in a browser
2. Try logging in with:
   - Email: `damien@denturesdirect.ca`
   - Password: `TempPassword123!`
3. If it works, you're done! 🎉

---

## 🆘 Troubleshooting

**Problem: Build fails**
- Check the "Deployments" tab → "View Logs"
- Make sure all dependencies are in `package.json`

**Problem: Database connection fails**
- Make sure PostgreSQL service is connected to your Web Service
- Check that `DATABASE_URL` is set (Railway should do this automatically)

**Problem: App shows errors**
- Check the logs in Railway
- Make sure all environment variables are set correctly

**Problem: Can't access the site**
- Make sure the deployment finished successfully (green checkmark)
- Check that PORT is set to 5000

---

## ✅ Checklist

- [ ] Signed up for Railway
- [ ] Code is on GitHub
- [ ] Deployed to Railway
- [ ] Added PostgreSQL database
- [ ] Connected database to web service
- [ ] Set SESSION_SECRET
- [ ] Set NODE_ENV=production
- [ ] Set PORT=5000
- [ ] Ran `npm run db:push` to set up schema
- [ ] Got live URL
- [ ] Tested login

---

## 🎯 You're Done!

Once everything is set up, you can:
- Add real patient data
- Access your app from anywhere
- Share the URL with your team
- Data will be saved permanently in the database




