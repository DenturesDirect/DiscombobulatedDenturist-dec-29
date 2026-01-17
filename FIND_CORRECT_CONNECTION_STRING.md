# 🔍 Find the Correct Connection String

## What You're Seeing

You mentioned:
- There's a **"Session pooler"** tab (not "Session")
- It doesn't show port 6000 (or 6543)

## Let's Find the Right One

### Step 1: Check All Tabs

In Supabase → Project Settings → Database → Connection string section, you should see tabs like:
- **"URI"** - Direct connection (port 5432) - DON'T USE
- **"Session"** or **"Session pooler"** - Pooled connection
- **"Transaction"** - Another pooled option

### Step 2: What Port Should It Have?

The pooled connection strings should have:
- Port **6543** (for pooler)
- OR port **5432** but with `pooler.supabase.com` in the hostname

### Step 3: Check the Hostname

Look at the connection string - what does the hostname say?

**✅ GOOD (Use This):**
- `pooler.supabase.com` or `aws-0-xxx.pooler.supabase.com`
- Port can be 6543 OR 5432 (if it's pooler.supabase.com, port 5432 is fine)

**❌ BAD (Don't Use):**
- `db.xxx.supabase.co` (direct connection)
- IPv6 address

---

## Alternative: Use Transaction Mode

If "Session pooler" doesn't work, try:

1. Click the **"Transaction"** tab (if available)
2. Copy that connection string
3. It should also use the pooler

---

## What to Look For

The connection string should contain:
- `pooler.supabase.com` in the hostname
- Your project reference (like `qhexbhorylsvlpjkchkg`)
- Port 6543 OR 5432 (both work if it's pooler)
- `?pgbouncer=true` at the end

---

## Quick Check

**Copy the connection string from the "Session pooler" tab and tell me:**
1. What's the hostname? (does it say `pooler.supabase.com`?)
2. What port does it show? (5432 or 6543?)
3. Does it end with `?pgbouncer=true`?

If it has `pooler.supabase.com` in it, **use that one** - the port number (5432 vs 6543) doesn't matter as much if it's going through the pooler.

---

**The key is `pooler.supabase.com` in the hostname, not necessarily the port number!**
