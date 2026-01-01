# ✅ Correct Supabase URL

## Your URL

```
https://qhexbhorylsvlpjkchkg.supabase.co
```

**This is correct!**

---

## Add to Railway

### Step 1: Edit SUPABASE_URL

1. **Railway → web service → Variables tab**
2. **Find `SUPABASE_URL`**
3. **Click three dots (⋯) → Edit**
4. **In Value field, enter:**
   ```
   https://qhexbhorylsvlpjkchkg.supabase.co
   ```
5. **Save**

---

### Step 2: Verify SUPABASE_SERVICE_ROLE_KEY

1. **Find `SUPABASE_SERVICE_ROLE_KEY`**
2. **Make sure it has a value** (your secret key from Supabase)
3. **If empty, edit and add it**

---

### Step 3: Redeploy

1. **Railway → Deployments → Redeploy**
2. **Wait 2-3 minutes**
3. **Check logs for: `💾 Using Supabase Storage`**

---

## After That

**Try uploading a photo - should work!**

---

**Add that URL to SUPABASE_URL variable, then redeploy!**
