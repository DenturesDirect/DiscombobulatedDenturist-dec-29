# 🔧 Enable Gemini API in Google Cloud

## The Problem

The error says the model isn't found. This might mean:
1. The API isn't enabled in your Google Cloud project
2. The API key doesn't have the right permissions

---

## Solution: Enable Gemini API

Even though you created the API key in Google AI Studio, you might need to enable the API in Google Cloud Console.

---

## Step 1: Go to Google Cloud Console

1. **Visit**: https://console.cloud.google.com/
2. **Select your project** (the one you created when getting the API key)
   - If you don't see it, look for a project with a name like "My First Project" or similar

---

## Step 2: Enable Generative Language API

1. **Go to "APIs & Services"** → **"Library"**
2. **Search for**: "Generative Language API"
3. **Click on it**
4. **Click "Enable"**
5. **Wait for it to enable** (takes a few seconds)

---

## Step 3: Verify API Key Permissions

1. **Go to "APIs & Services"** → **"Credentials"**
2. **Find your API key** (the one you're using)
3. **Click on it**
4. **Check "API restrictions"**:
   - Should be set to "Don't restrict key" OR
   - Should include "Generative Language API"
5. **Save if you made changes**

---

## Step 4: Wait and Test

1. **Wait 1-2 minutes** for changes to propagate
2. **Railway should have redeployed** with `gemini-pro` model
3. **Try creating a clinical note again**

---

## Alternative: Check API Key in Google AI Studio

1. **Go back to**: https://aistudio.google.com/
2. **Check if your API key is active**
3. **Try creating a new API key** if needed
4. **Make sure it's for the right project**

---

## Quick Checklist

- ✅ API key created in Google AI Studio
- ✅ Generative Language API enabled in Google Cloud Console
- ✅ API key has access to Generative Language API
- ✅ Model changed to `gemini-pro` (deployed)

---

**Try enabling the API in Google Cloud Console first!** 🚀
