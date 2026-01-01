# 🔍 Get DATABASE_URL from Railway

## The DATABASE_URL is Already in Railway!

Since it's already set as a variable in Railway's web service, let's get it:

---

## Option 1: Use Railway CLI (Easiest!)

Run this command:

```powershell
npx @railway/cli variables --service web
```

This will show all variables. Look for `DATABASE_URL` and copy it.

---

## Option 2: Copy from Railway Dashboard

1. **Go to Railway dashboard**
2. **Click on "web" service**
3. **Go to "Variables" tab**
4. **Find `DATABASE_URL`**
5. **Click the copy icon** (or copy the value)
6. **Paste it here** - I'll help you use it

---

## After You Get It

1. **Set it locally:**
   ```powershell
   $env:DATABASE_URL="<paste the DATABASE_URL here>"
   ```

2. **Run the script:**
   ```powershell
   node create-tables.js
   ```

---

**Run `npx @railway/cli variables --service web` to see the DATABASE_URL!** 🚀
