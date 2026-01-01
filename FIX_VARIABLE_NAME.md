# 🔧 Fix Variable Name Typo

## The Problem

You have: `OPEN_API_KEY` (missing the "I")
Code needs: `OPENAI_API_KEY` (with "I")

---

## Fix Option 1: Rename Existing Variable

1. In Railway → web service → Variables tab
2. Click the **three dots (⋯)** next to `OPEN_API_KEY`
3. Click **"Edit"** or **"Rename"**
4. Change the name to: `OPENAI_API_KEY`
5. Make sure the value is still your OpenAI key (starts with `sk-`)
6. Click **"Save"**
7. Go to **Deployments** tab → three dots (⋯) → **Redeploy**

---

## Fix Option 2: Delete and Recreate

1. Click the **three dots (⋯)** next to `OPEN_API_KEY`
2. Click **"Delete"** or **"Remove"**
3. Click **"+ New Variable"**
4. Name: `OPENAI_API_KEY` (with the "I"!)
5. Value: (paste your OpenAI key)
6. Click **"Add"**
7. Go to **Deployments** tab → three dots (⋯) → **Redeploy**

---

## After Fixing

Check Railway logs - you should see:
✅ `🤖 Using direct OpenAI API key`

Then try creating a clinical note again!
