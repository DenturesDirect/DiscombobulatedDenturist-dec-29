# 🔒 Make Supabase Bucket Private

## The Problem

**Bucket is public, but it needs to be PRIVATE** for security.

---

## Fix: Make Bucket Private

### Step 1: Go to Bucket Settings

1. **Supabase → Storage** (left sidebar)
2. **Click on your bucket** (`patient-files` or whatever you named it)
3. **This opens the bucket details page**

### Step 2: Change to Private

1. **Look for "Settings" or "Bucket Settings" tab**
2. **Find "Public bucket" or "Public access" toggle**
3. **Make sure it's UNCHECKED** (not public)
4. **OR find "Private" option and select it**
5. **Click "Save" or "Update"**

---

## Alternative: Delete and Recreate

If you can't change the setting:

1. **Delete the current bucket** (if it's empty)
2. **Create a new bucket:**
   - Name: `patient-files`
   - **Public bucket: UNCHECKED** (make it private)
   - Click "Create"

---

## After Making It Private

1. **Redeploy Railway** (if needed)
2. **Try uploading a photo** - should work now!

---

**Go to Supabase → Storage → Click your bucket → Make it private (uncheck "Public bucket")!**
