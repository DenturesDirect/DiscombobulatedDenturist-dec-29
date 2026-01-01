# ✅ Add OPENAI_API_KEY to Railway

## Step 1: Get Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in (or create account)
3. Click **"Create new secret key"**
4. Give it a name (like "DentureFlowPro")
5. **Copy the key** (you won't see it again!)

---

## Step 2: Add to Railway

1. Go to Railway: https://railway.app
2. Click on your **web service** (the one you're using)
3. Click **"Variables"** tab
4. Click **"New Variable"** button
5. Fill in:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** (paste your key)
6. Click **"Add"**

---

## Step 3: Wait for Rebuild

Railway will automatically:
- ✅ Detect the new variable
- ✅ Rebuild your app
- ✅ Deploy the new version

**Wait 2-3 minutes**, then try creating a clinical note!

---

## That's It!

Once Railway finishes rebuilding, your AI should work.

**Need help?** Tell me what you see or if you get stuck!
