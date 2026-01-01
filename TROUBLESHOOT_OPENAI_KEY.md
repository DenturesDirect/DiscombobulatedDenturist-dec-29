# 🔍 Troubleshoot OpenAI Key Error

## You're Seeing This Error:
"OpenAI API key not configured. Please add AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY to your secrets."

---

## Step-by-Step Fix

### Step 1: Verify Variable is Added Correctly

1. Go to Railway → **web service** (not the project, the SERVICE)
2. Click **"Variables"** tab
3. Look for `OPENAI_API_KEY` in the list
4. Check:
   - ✅ Name is exactly: `OPENAI_API_KEY` (no spaces, no typos)
   - ✅ Value starts with: `sk-` (your actual key)
   - ✅ It's in the **web service**, not PostgreSQL

**If it's NOT there:**
- Click "New Variable"
- Name: `OPENAI_API_KEY`
- Value: (paste your key from https://platform.openai.com/api-keys)
- Click "Add"

---

### Step 2: Restart Railway Service

**Railway should auto-restart, but let's force it:**

1. Railway → web service → **"Deployments"** tab
2. Click the **three dots (⋯)** on the latest deployment
3. Click **"Redeploy"** or **"Restart"**

**OR trigger a rebuild:**
- Make a tiny change to any file
- Commit and push
- Railway rebuilds automatically

---

### Step 3: Check Railway Logs

After restart, check if it sees the key:

1. Railway → web service → **Deployments** tab
2. Click on the latest deployment
3. Click **"View Logs"** or **"Logs"**
4. Look for:
   - ✅ `🤖 Using direct OpenAI API key` = **WORKING!**
   - ❌ `❌ No OpenAI API key configured!` = **NOT WORKING**

---

### Step 4: Common Mistakes

- ❌ Added to **PostgreSQL** service instead of **web service**
- ❌ Added to **project level** instead of **web service**
- ❌ Variable name has typo: `OPENAI_API_KE` (missing Y)
- ❌ Variable name has spaces: `OPENAI_API_KEY ` (trailing space)
- ❌ Added to **wrong Railway project**

---

## Quick Test

After restarting, try creating a clinical note again.

**If it still doesn't work:**
1. Check Railway logs (see Step 3)
2. Tell me what you see in the logs
3. I'll help you fix it!
