# ✅ Check API Key Settings

## Good News!

I can see:
- ✅ **API is Enabled** (`generativelanguage.googleapis.com`)
- ✅ **Project: dentureflowpro2**

The API is enabled, so let's check your API key settings.

---

## Step 1: Go to Credentials

1. **In Google Cloud Console** (where you are now)
2. **Click "Credentials"** in the left sidebar (under "APIs & Services")
3. **OR click the link** "Credentials in APIs and services" (in the yellow banner)

---

## Step 2: Find Your API Key

1. **Look for "API keys"** section
2. **Find the API key** you're using (the one you added to Railway)
3. **Click on it** to open its settings

---

## Step 3: Check API Restrictions

1. **Look for "API restrictions"** section
2. **It should be set to:**
   - ✅ **"Don't restrict key"** (recommended for testing)
   - OR
   - ✅ **"Restrict key"** with "Generative Language API" selected

3. **If it's restricted to the wrong API**, change it:
   - Click **"Restrict key"**
   - Make sure **"Generative Language API"** is checked
   - **Save**

---

## Step 4: Verify the API Key

1. **Copy the API key** from Google Cloud Console
2. **Compare it** with what's in Railway:
   - Railway → web service → Variables
   - Check `GOOGLE_AI_API_KEY`
   - Make sure they match!

---

## Alternative: Try a Different Model

If the API key settings look correct, the model name might still be wrong. Let me check what models are actually available.

---

**Go to Credentials and check your API key settings!** 🔍
