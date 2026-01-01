# 🔍 Check Supabase Storage Setup

## What's Needed

For photo uploads to work, you need these 3 variables in Railway:

1. `SUPABASE_URL` - Your Supabase project URL
2. `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
3. `SUPABASE_STORAGE_BUCKET` - Bucket name (optional, defaults to "patient-files")

---

## Quick Check

**Go to Railway → web service → Variables tab**

**Do you see:**
- ✅ `SUPABASE_URL`?
- ✅ `SUPABASE_SERVICE_ROLE_KEY`?
- ✅ `SUPABASE_STORAGE_BUCKET`? (optional)

**If YES:** Supabase is configured, but the bucket might not exist
**If NO:** Supabase isn't configured yet

---

## If Supabase Variables Exist

**The bucket might not be created yet:**

1. Go to Supabase dashboard
2. Click Storage
3. Check if `patient-files` bucket exists
4. If not, create it:
   - Click "New bucket"
   - Name: `patient-files`
   - Make it **private** (not public)
   - Click Create

---

## If Supabase Variables Don't Exist

**You need to set them up:**

1. **Get Supabase credentials:**
   - Go to Supabase dashboard
   - Settings → API
   - Copy:
     - Project URL → `SUPABASE_URL`
     - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

2. **Add to Railway:**
   - Railway → web service → Variables
   - Add both variables

3. **Create bucket:**
   - Supabase → Storage → New bucket
   - Name: `patient-files`
   - Private
   - Create

4. **Redeploy Railway**

---

**Check Railway Variables and tell me what you see!**
