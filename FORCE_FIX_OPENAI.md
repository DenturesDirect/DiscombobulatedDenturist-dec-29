# 🔧 Force Fix OpenAI Key - Railway Not Seeing It

## The Problem
Railway logs show: `❌ No OpenAI API key configured!`

This means Railway isn't seeing the `OPENAI_API_KEY` variable.

---

## Step-by-Step Fix

### Step 1: Delete the Variable and Recreate It

1. Railway → web service → **Variables** tab
2. Find `OPENAI_API_KEY` (or `OPEN_API_KEY` if it still has the typo)
3. Click **three dots (⋯)** → **Delete**
4. Click **"+ New Variable"**
5. Name: `OPENAI_API_KEY` (exact spelling, all caps)
6. Value: (paste your OpenAI key - starts with `sk-`)
7. Click **"Add"**

---

### Step 2: Force a Full Redeploy

**Option A: Manual Redeploy**
1. Go to **Deployments** tab
2. Click **three dots (⋯)** on latest deployment
3. Click **"Redeploy"**

**Option B: Trigger New Deploy (More Reliable)**
1. Make a tiny change to any file (add a space)
2. Commit and push to GitHub
3. Railway will rebuild from scratch and pick up the variable

---

### Step 3: Verify in Logs

After redeploy, check logs:
1. Deployments → Latest → View Logs
2. Look for: `🤖 Using direct OpenAI API key`
3. If you see that, it's working!

---

## Common Issues

- ❌ Variable added to **project level** instead of **web service**
- ❌ Variable name has typo or spaces
- ❌ Railway didn't restart after adding variable
- ❌ Variable was added but Railway cached the old config

---

## Nuclear Option: Full Rebuild

If nothing works:
1. Delete `OPENAI_API_KEY` variable
2. Make a tiny code change (add a comment)
3. Commit and push
4. Wait for Railway to rebuild
5. Add `OPENAI_API_KEY` variable again
6. Railway should auto-redeploy

---

**Try deleting and recreating the variable, then force a redeploy!**
