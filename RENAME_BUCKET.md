# 📝 How to Rename Supabase Storage Bucket

## Step-by-Step

### Step 1: Go to Storage
1. **Supabase dashboard → Storage** (left sidebar)
2. You'll see your bucket listed

### Step 2: Open Bucket Settings
1. **Click on your bucket** (the one with capitals)
2. This opens the bucket details page

### Step 3: Rename
1. Look for **"Settings"** or **"Bucket Settings"** tab
2. Find the **"Name"** field
3. **Change it to:** `patient-files` (lowercase, hyphen)
4. **Click "Save"** or "Update"

---

## If You Don't See Rename Option

**Alternative: Delete and Recreate**
1. **Delete the old bucket** (with capitals)
2. **Create a new bucket:**
   - Name: `patient-files`
   - Private (unchecked)
   - Create

---

## After Renaming

1. **Redeploy Railway:**
   - Railway → web service → Deployments
   - Three dots (⋯) → Redeploy

2. **Try uploading a photo** - should work now!

---

**Go to Supabase → Storage → Click your bucket → Rename to `patient-files`**
