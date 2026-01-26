# 🚀 Run Migration from Browser (No CLI Needed!)

## Simple Way to Run Migration

You don't need Railway CLI! Just use your browser.

## Step 1: Make Sure Variables Are Set

**In Railway Web service Variables, you should have:**
- ✅ `RAILWAY_STORAGE_ACCESS_KEY_ID`
- ✅ `RAILWAY_STORAGE_SECRET_ACCESS_KEY`
- ✅ `RAILWAY_STORAGE_ENDPOINT`
- ✅ `RAILWAY_STORAGE_BUCKET_NAME`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Wait for Railway to Deploy

Railway will auto-deploy after you add variables. Wait 1-2 minutes.

## Step 3: Trigger Migration from Browser

**Open your Railway app URL** (the one you use to access your app)

**Then in browser console** (F12 → Console tab), paste this:

```javascript
fetch('/api/migrate-storage', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

**Or use this simpler method:**

1. **Open your app** in browser
2. **Make sure you're logged in** (as damien@denturesdirect.ca)
3. **Open browser console** (Press F12, click "Console" tab)
4. **Paste this command:**
   ```javascript
   fetch('/api/migrate-storage', { method: 'POST', credentials: 'include' }).then(r => r.json()).then(console.log)
   ```
5. **Press Enter**

## Step 4: Check Railway Logs

1. **Go to Railway** → **Web service** → **Logs**
2. **Watch for migration progress**
3. **You'll see:**
   - `📄 Processing: filename`
   - `📥 Downloading from Supabase`
   - `📤 Uploading to Railway Storage`
   - `✅ Uploaded to Railway`
   - `📊 Migration Summary`

## What Happens

- Migration runs in the background
- Downloads files from Supabase
- Uploads to Railway Storage
- Updates database URLs
- Shows progress in Railway logs

---

**Much easier than CLI! Just trigger it from your browser!**
