# ⚡ Quick Switch to Railway PostgreSQL (5 minutes)

## Step 1: Create Railway PostgreSQL (1 min)

1. Railway → Your Project
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Wait 30 seconds for it to provision

---

## Step 2: Copy Connection String (30 sec)

1. Click the **PostgreSQL service** (the one you just created)
2. **Variables** tab
3. Find **`DATABASE_URL`**
4. **Copy it** (Railway created it automatically)

---

## Step 3: Update Your App (1 min)

1. Go to your **App service** (not the database)
2. **Variables** tab
3. Find **`DATABASE_URL`**
4. **Paste** the Railway PostgreSQL connection string
5. **Save**

---

## Step 4: Wait & Test (2 min)

1. Wait 2-3 minutes for auto-redeploy
2. Check logs - should see:
   ```
   ✅ Database migrations completed
   ✅ Created account for damien@denturesdirect.ca
   ```
3. **Login:**
   - Email: `damien@denturesdirect.ca`
   - Password: `TempPassword123!`

**Done!** 🎉

---

## That's It!

No data to migrate. Everything creates automatically. Login will work immediately.
