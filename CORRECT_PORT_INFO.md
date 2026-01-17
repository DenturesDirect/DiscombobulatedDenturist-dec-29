# ✅ Correct Port Information

## I Was Wrong - Here's the Truth

**Session Mode (Session Pooler)** = Port **5432** ✅
**Transaction Mode** = Port **6543**

Supabase changed this in February 2025:
- Port 5432 = Session Mode (what you want!)
- Port 6543 = Transaction Mode only

---

## What Matters

**The port number doesn't matter as much as the HOSTNAME!**

Your connection string should have:
- `pooler.supabase.com` in the hostname (this is the key!)
- Port 5432 is CORRECT for Session Mode
- Your actual password (not `[YOUR-PASSWORD]`)

---

## Your Connection String Should Look Like:

```
postgresql://postgres.qhexbhorylsvlpjkchkg:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Notice:**
- ✅ `pooler.supabase.com` in hostname
- ✅ Port `5432` (correct for Session Mode!)
- ✅ `?pgbouncer=true` at the end

---

## So What's the Real Problem?

If you're using port 5432 with `pooler.supabase.com`, that's CORRECT.

The error "Tenant or user not found" means:
- ✅ Connection is working (reaching Supabase)
- ❌ Password is wrong

---

## Fix

1. Use the **"Session pooler"** tab connection string (port 5432 is fine!)
2. Make sure it has `pooler.supabase.com` in it
3. Replace `[YOUR-PASSWORD]` with your actual database password
4. If you don't know the password: Reset it in Supabase → Database → Reset password
5. Update `DATABASE_URL` in Railway

**Port 5432 with pooler.supabase.com is correct! The issue is the password.**
