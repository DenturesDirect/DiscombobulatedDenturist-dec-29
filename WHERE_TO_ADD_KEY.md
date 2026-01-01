# 📍 Where to Add OPENAI_API_KEY in Railway

## Exact Steps

### Step 1: Go to Railway Dashboard
1. Open: https://railway.app
2. Sign in

### Step 2: Find Your Project
1. You'll see your project(s) listed
2. Click on the **project** you're using (the one with web service)

### Step 3: Click on Web Service
1. Inside the project, you'll see services listed:
   - **Web Service** ← Click this one!
   - PostgreSQL (don't click this)
   - (maybe others)
2. Click on **"Web Service"** (or whatever your web service is called)

### Step 4: Go to Variables Tab
1. You'll see tabs at the top:
   - Deployments
   - Metrics
   - Variables ← **Click this!**
   - Settings
   - etc.
2. Click **"Variables"** tab

### Step 5: Add the Variable
1. Click **"New Variable"** button (usually top right)
2. Fill in:
   - **Name:** `OPENAI_API_KEY` (exact spelling, all caps)
   - **Value:** (paste your key from OpenAI - starts with `sk-`)
3. Click **"Add"** or **"Save"**

### Step 6: Restart
1. Go to **"Deployments"** tab
2. Click the **three dots (⋯)** on the latest deployment
3. Click **"Redeploy"**

---

## Visual Guide

```
Railway Dashboard
  └── Your Project
      └── Web Service ← CLICK HERE
          └── Variables Tab ← CLICK HERE
              └── New Variable Button
                  └── Name: OPENAI_API_KEY
                  └── Value: sk-...
                  └── Add
```

---

## Important: NOT These Places

❌ **Don't add to:**
- Project level (the project itself)
- PostgreSQL service
- Any other service

✅ **DO add to:**
- **Web Service** → **Variables** tab

---

**That's it!** After adding and restarting, it should work.
