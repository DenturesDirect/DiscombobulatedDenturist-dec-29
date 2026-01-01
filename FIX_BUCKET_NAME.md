# 🔧 Fix Bucket Name Issue

## The Problem

**Bucket names are case-sensitive!**

The code expects: `patient-files` (lowercase with hyphen)

If you created it as `PATIENT_FILES` or `PATIENT FILES` or anything else, it won't match.

---

## Solution Options

### Option 1: Rename Bucket (Easiest) ✅

1. **Go to Supabase → Storage**
2. **Click on your bucket** (whatever you named it)
3. **Rename it to:** `patient-files` (lowercase, hyphen)
4. **Save**

**This is the easiest option!**

---

### Option 2: Add Variable to Railway

If you want to keep your bucket name:

1. **Railway → web service → Variables**
2. **Add new variable:**
   - **Name:** `SUPABASE_STORAGE_BUCKET`
   - **Value:** (exact bucket name you created, e.g., `PATIENT_FILES`)
3. **Add**

**Then redeploy Railway.**

---

## Recommendation

**Rename the bucket to `patient-files`** - it's simpler and matches what the code expects.

---

**What did you name the bucket? I can help you fix it!**
