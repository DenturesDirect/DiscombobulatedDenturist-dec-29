# Add text_notifications Column to Database

The `text_notifications` column is missing from your `patients` table. Here's how to add it:

## Option 1: Railway SQL Editor (Easiest)

1. **Go to Railway** → Your project → **Postgres** service
2. Click **"Query"** or "SQL Editor"** tab
3. **Paste this SQL:**
   ```sql
   ALTER TABLE patients 
   ADD COLUMN IF NOT EXISTS text_notifications BOOLEAN DEFAULT false NOT NULL;
   ```
4. **Click "Run"** or press Enter
5. **Done!** The app should work now.

## Option 2: Railway Shell

1. **Go to Railway** → Your project → **Postgres** service
2. Click **"Shell"** tab
3. **Run:**
   ```bash
   psql $DATABASE_URL -c "ALTER TABLE patients ADD COLUMN IF NOT EXISTS text_notifications BOOLEAN DEFAULT false NOT NULL;"
   ```

## Option 3: Local Script

1. **Get your DATABASE_URL** from Railway:
   - Go to Postgres service → Variables
   - Copy `DATABASE_URL` (use the PUBLIC one, not internal)

2. **Run locally:**
   ```powershell
   cd DentureFlowPro
   $env:DATABASE_URL="your-database-url-here"
   node add-text-notifications.js
   ```

## Verify It Worked

After adding the column, the app should start without errors. You can also check in Railway SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'text_notifications';
```

Should return one row with the column info.
