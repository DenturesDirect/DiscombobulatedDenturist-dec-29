# 🔧 OpenAI Key Not Working - Fix

## The Problem

The code reads `OPENAI_API_KEY` when the server **starts**. If you added it after Railway was already running, it won't see it.

---

## Fix: Restart Railway Service

**Railway should auto-restart when you add a variable, but sometimes it doesn't.**

### Option 1: Manual Restart
1. Go to Railway → web service
2. Click **"Deployments"** tab
3. Click the **three dots** (⋯) on the latest deployment
4. Click **"Redeploy"** or **"Restart"**

### Option 2: Trigger a New Deploy
1. Make a tiny change to any file (add a space)
2. Commit and push to GitHub
3. Railway will rebuild and pick up the new variable

---

## Double-Check the Variable

1. Railway → web service → **Variables** tab
2. Make sure you see:
   - ✅ Name: `OPENAI_API_KEY` (exact spelling, no spaces)
   - ✅ Value: `sk-...` (starts with `sk-`)
3. If it's not there, add it again

---

## Check Railway Logs

1. Railway → web service → **Deployments** tab
2. Click on the latest deployment
3. Click **"View Logs"**
4. Look for:
   - ✅ `🤖 Using direct OpenAI API key` = GOOD
   - ❌ `❌ No OpenAI API key configured!` = BAD

---

## Common Mistakes

- ❌ Variable name has a typo: `OPENAI_API_KE` (missing Y)
- ❌ Variable name has spaces: `OPENAI_API_KEY ` (trailing space)
- ❌ Added to wrong service (added to PostgreSQL instead of web service)
- ❌ Added to wrong Railway project

---

## Quick Test

After restarting, check Railway logs. You should see:
```
🤖 Using direct OpenAI API key
```

If you see that, it's working! If not, the variable isn't being read.
