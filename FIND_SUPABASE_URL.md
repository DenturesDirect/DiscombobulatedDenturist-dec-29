# 🔍 Find Supabase Project URL

## Step-by-Step

### Step 1: Open Settings
1. In Supabase dashboard, look at the **left sidebar**
2. Click the **gear icon** (⚙️) at the bottom - that's "Settings"

### Step 2: Go to API Settings
1. In Settings, you'll see a list of options
2. Click **"API"** (usually near the top)

### Step 3: Find Project URL
1. At the top of the API page, you'll see:
   - **Project URL** - This is what you need!
   - It looks like: `https://qhexbhorylsvlpjkchkg.supabase.co`
   - (Your project ID will be different)

2. **Copy this URL** - this is your `SUPABASE_URL`

---

## Also Get Service Role Key

On the same API page, scroll down to **"Project API keys"** section:

1. You'll see two keys:
   - `anon` `public` - ❌ Don't use this one
   - `service_role` `secret` - ✅ **Use this one!**

2. Click the **eye icon** 👁️ next to `service_role` to reveal it
3. **Copy the service_role key** - this is your `SUPABASE_SERVICE_ROLE_KEY`

---

## Quick Visual Guide

```
Supabase Dashboard
  └── Left Sidebar
      └── ⚙️ Settings (gear icon at bottom)
          └── API
              ├── Project URL ← Copy this
              └── Project API keys
                  └── service_role (secret) ← Copy this (click 👁️ to reveal)
```

---

**That's it!** You'll have both values you need for Railway.
