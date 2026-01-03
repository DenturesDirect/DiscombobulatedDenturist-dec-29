# ⚠️ URGENT: Add text_notifications Column

Your app is crashing because the `text_notifications` column is missing from the `patients` table.

## Quick Fix (2 minutes)

### Step 1: Open Railway Postgres
1. Go to **Railway** → Your project
2. Click on the **Postgres** service (the database icon)
3. Click the **"Query"** tab (or "SQL Editor" or "Data" tab)

### Step 2: Run This SQL
Copy and paste this into the SQL editor:

```sql
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS text_notifications BOOLEAN DEFAULT false NOT NULL;
```

### Step 3: Click "Run" or Press Enter
The column will be added instantly.

### Step 4: Verify It Worked
Run this to check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'text_notifications';
```

You should see one row returned.

---

## Alternative: Railway Shell

If you can't find the Query tab:

1. Go to **Postgres** service → **"Shell"** tab
2. Run:
   ```bash
   psql $DATABASE_URL -c "ALTER TABLE patients ADD COLUMN IF NOT EXISTS text_notifications BOOLEAN DEFAULT false NOT NULL;"
   ```

---

**After adding the column, Railway will auto-redeploy and your app will work!**
