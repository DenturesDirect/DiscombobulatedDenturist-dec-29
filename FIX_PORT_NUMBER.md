# 🔧 Fix Port Number in Connection String

## The Problem

You're using port **5432** but you need port **6543** for the pooled connection.

## The Fix

Your connection string should look like this:

```
postgresql://postgres.qhexbhorylsvlpjkchkg:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Key parts:**
- `pooler.supabase.com` (not `db.xxx.supabase.co`)
- Port: **6543** (not 5432)
- Ends with: `?pgbouncer=true`

---

## How to Get the Correct Connection String

1. **Go to Supabase Dashboard** → Your Project
2. **Project Settings** → **Database**
3. Scroll to **"Connection string"** section
4. Click **"Session"** tab (NOT "URI")
5. Copy the connection string
6. It should already have port **6543** in it
7. Replace `[YOUR-PASSWORD]` with your actual password
8. Update `DATABASE_URL` in Railway Variables

---

## Port Reference

- **5432** = Direct connection (old, might not work)
- **6543** = Pooled connection (use this!)
- **6000** = Not used for Supabase

---

**Make sure your connection string has `:6543` in it, not `:5432`!**
