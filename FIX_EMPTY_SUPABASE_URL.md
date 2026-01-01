# 🔧 Fix Empty SUPABASE_URL

## The Problem

**SUPABASE_URL variable exists but has NO value** (no web address after it)

Railway needs the actual URL, not just the variable name!

---

## Fix: Add the Value

### Step 1: Edit SUPABASE_URL

1. **Railway → web service → Variables tab**
2. **Find `SUPABASE_URL` in the list**
3. **Click the three dots (⋯) next to it**
4. **Click "Edit"**
5. **In the "Value" field, enter:**
   ```
   https://qhexbhorylsvlpjkchkg.supabase.co
   ```
6. **Click "Save" or "Update"**

---

### Step 2: Verify SUPABASE_SERVICE_ROLE_KEY

1. **Find `SUPABASE_SERVICE_ROLE_KEY`**
2. **Click three dots (⋯) → Edit**
3. **Make sure it has a value** (your secret key from Supabase)
4. **If empty, paste your service_role key**
5. **Save**

---

### Step 3: Redeploy

1. **Railway → Deployments**
2. **Three dots (⋯) → Redeploy**
3. **Wait 2-3 minutes**

---

## After Redeploy

**Check logs for:**
- ✅ `💾 Using Supabase Storage for file uploads` = GOOD!

---

**Edit SUPABASE_URL and add the value: `https://qhexbhorylsvlpjkchkg.supabase.co`**
