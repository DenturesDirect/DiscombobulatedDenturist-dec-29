# 🔧 Database URL Fix (Railway-Only Deployment)

## Target: Railway Postgres Only

For this app, `DATABASE_URL` **must** point **only** to **Railway PostgreSQL**. Do not point it at Supabase or other providers—this causes split-brain behavior and document loading failures. Scripts and docs must not re-point `DATABASE_URL` to Supabase; the app database is Railway only.

### Run the Diagnostic

```bash
npm run check-db
```

Or:

```bash
npx tsx scripts/check-database-connection.ts
```

This will:
- ✅ Check if DATABASE_URL is set
- ✅ Detect the host type (railway, supabase, or unknown)
- ✅ Test the actual connection
- ✅ Confirm you're using Railway Postgres

### Correct Format

`DATABASE_URL` should look like one of:

```
postgresql://postgres:password@postgres.railway.internal:5432/railway
postgresql://postgres:password@something.railway.app:5432/railway
```

If it contains `supabase.co` or `pooler.supabase.com`, the app is using the wrong database.

### How to Fix

1. **Railway Dashboard** → Your project → **PostgreSQL** service
2. **Variables** tab → Copy `DATABASE_URL` (or the connection string)
3. **Web Service** → **Variables** tab → Set `DATABASE_URL` to the Railway Postgres URL
4. Redeploy and verify logs show: `DB host type: railway`

### Baseline Before Changes

Run `npm run baseline-diagnostics` to capture current config before making changes (for rollback documentation).
