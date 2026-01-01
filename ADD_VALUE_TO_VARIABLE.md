# ✅ Add Value to SUPABASE_URL Variable

## How to Add the Value

### Step 1: Edit the Variable

1. **Railway → web service → Variables tab**
2. **Find `SUPABASE_URL` in the list**
3. **Click the three dots (⋯) on the right side of that row**
4. **Click "Edit"** (or "Update")
5. **A dialog/form will open**

### Step 2: Enter the Value

In the form that opens:
- **Name field:** Should already say `SUPABASE_URL` (don't change this)
- **Value field:** Enter this:
  ```
  https://qhexbhorylsvlpjkchkg.supabase.co
  ```
- **Click "Save" or "Update"**

### Step 3: Verify

After saving, you should see:
- `SUPABASE_URL` = `https://qhexbhorylsvlpjkchkg.supabase.co`

The value should now appear next to the variable name!

---

## Also Check SUPABASE_SERVICE_ROLE_KEY

1. **Find `SUPABASE_SERVICE_ROLE_KEY`**
2. **Click three dots (⋯) → Edit**
3. **Make sure Value field has your secret key** (starts with `sb_secret_...`)
4. **Save**

---

## Then Redeploy

1. **Deployments → Three dots (⋯) → Redeploy**
2. **Wait 2-3 minutes**
3. **Check logs for: `💾 Using Supabase Storage`**

---

**Click the three dots (⋯) next to SUPABASE_URL → Edit → Add the URL in the Value field → Save!**
