# 🔑 Get Supabase Credentials from API Keys Page

## What You're Seeing

You're on the **new API keys format**. Supabase has two formats:
- **New format:** "Publishable and secret API keys" (what you're seeing)
- **Legacy format:** "Legacy anon, service_role API keys" (what we might need)

---

## Step 1: Find Project URL

The Project URL might be:
1. **At the very top of this page** (above the tabs)
2. **On the "Legacy" tab** - click "Legacy anon, service_role API keys" tab
3. **In Settings → General** - you saw it there as part of the Project ID

**If you can't find it on this page:**
- Go back to **Settings → General**
- Your Project ID is: `qhexbhorylsvlpjkchkg`
- Your Project URL is: `https://qhexbhorylsvlpjkchkg.supabase.co`

---

## Step 2: Get the Secret Key

**Option A: Use the New Secret Key (Recommended)**
1. In the **"Secret keys"** section
2. Find the key that starts with `sb_secret_oIPr0...`
3. Click the **eye icon (👁️)** to reveal it
4. Click the **copy icon** to copy it
5. This is your `SUPABASE_SERVICE_ROLE_KEY`

**Option B: Use Legacy Keys (If new format doesn't work)**
1. Click the **"Legacy anon, service_role API keys"** tab
2. Find the `service_role` key
3. Click the eye icon to reveal it
4. Copy it

---

## Step 3: Add to Railway

1. **Railway → web service → Variables**
2. Add:
   - `SUPABASE_URL` = `https://qhexbhorylsvlpjkchkg.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (the secret key you copied)

---

**Try the new secret key first. If it doesn't work, use the legacy service_role key!**
