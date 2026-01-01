# 🤖 Set Up Google AI API Key

## What This Is For

The `GOOGLE_AI_API_KEY` is used for:
- **AI-powered clinical notes** - Formats and processes voice-to-text dictation
- **HIPAA-compliant** - Google AI Studio has zero data retention

**Note**: The app works without this, but AI features won't be available.

---

## Step 1: Get Your API Key

1. **Go to Google AI Studio**
   - Visit: **https://aistudio.google.com/**
   - Sign in with your Google account

2. **Get Your API Key**
   - Click **"Get API Key"** in the left sidebar
   - Click **"Create API Key"**
   - Choose **"Create API key in new project"** (or select existing project)
   - **Copy the API key** that appears
   - **Important**: Save this key somewhere safe!

---

## Step 2: Add to Railway

1. **Go to Railway dashboard**
   - Visit: https://railway.app/
   - Click on your project

2. **Click on "web" service**

3. **Go to "Variables" tab**

4. **Click "+ New Variable"**

5. **Add the variable:**
   - **Key/Name**: `GOOGLE_AI_API_KEY`
   - **Value**: Paste your API key from Google AI Studio
   - Click **"Add"** or **"Save"**

6. **Railway will automatically redeploy**
   - Wait for deployment to finish
   - Your app will now have AI features enabled!

---

## Verify It's Working

After adding the API key:
1. Go to your app: https://web-production-8fe06.up.railway.app
2. Log in
3. Try creating a clinical note
4. The AI formatting should work!

---

## Cost

- **Google AI Studio** has a **free tier**
- Free tier includes generous usage
- You'll only pay if you exceed free limits
- Perfect for getting started!

---

## Quick Summary

1. **Get API key**: https://aistudio.google.com/ → Get API Key
2. **Add to Railway**: web service → Variables → Add `GOOGLE_AI_API_KEY`
3. **Done!** AI features will work after redeploy

---

**That's it! Simple and free to get started!** 🚀
