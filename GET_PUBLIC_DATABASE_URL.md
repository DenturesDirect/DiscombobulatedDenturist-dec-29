# 🔍 Get Public DATABASE_URL (Not Internal!)

## The Problem

The DATABASE_URL you copied uses `postgres.railway.internal` which only works **inside** Railway's network. We need the **public** DATABASE_URL that works from your computer.

---

## How to Get the Public DATABASE_URL

### Option 1: From Web Service Variables (Easiest!)

1. **Go to Railway dashboard**
2. **Click on "web" service** (NOT Postgres)
3. **Go to "Variables" tab**
4. **Look for `DATABASE_URL`**
5. **Copy that one** - it should have a public hostname (not `.railway.internal`)

The public DATABASE_URL will look like:
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

**NOT:**
```
postgresql://postgres:password@postgres.railway.internal:5432/railway
```

---

### Option 2: From Postgres Service - Public Connection

1. **Go to Railway dashboard**
2. **Click on "Postgres" service**
3. **Go to "Variables" tab**
4. **Look for a variable like `PUBLIC_DATABASE_URL` or `DATABASE_URL` with a public hostname**
5. **Or check the "Connect" button** - it might show the public connection string

---

### Option 3: Use Railway CLI to Get It

Run this command:

```powershell
npx @railway/cli variables --service Postgres
```

Look for `DATABASE_URL` with a public hostname.

---

## After You Get the Public DATABASE_URL

1. **Set it as environment variable:**
   ```powershell
   $env:DATABASE_URL="<paste the PUBLIC DATABASE_URL here>"
   ```

2. **Run the script:**
   ```powershell
   node create-tables.js
   ```

---

**Get the DATABASE_URL from the "web" service Variables tab - that one should work!** 🚀
