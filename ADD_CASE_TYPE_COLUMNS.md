# Add Case Type Columns to Database

The Lab Prescriptions table needs two new columns for separate upper and lower case types.

## EASIEST METHOD: Run Script from Your Computer (Recommended!)

Since finding the Railway SQL editor is difficult, we'll use a simple script instead.

### Step 1: Get Your Database URL

1. Go to **Railway** → Your project
2. Click on the **Postgres** service (database icon)
3. Click the **"Variables"** tab
4. Find `DATABASE_URL` (or `DATABASE_PUBLIC_URL`)
5. **Click the copy icon** next to it

### Step 2: Open PowerShell

1. Press **Windows Key + X**
2. Click **"Windows PowerShell"** or **"Terminal"**

### Step 3: Run These Commands

Copy and paste these one at a time (replace `YOUR_URL_HERE` with what you copied):

```powershell
cd C:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro
```

```powershell
$env:DATABASE_URL="YOUR_URL_HERE"
```

(Paste your database URL between the quotes - it should look like: `postgresql://user:password@host:port/database`)

```powershell
node add-case-type-columns.js
```

### Step 4: Done!

You should see:
```
✅ Connected
✅ Columns added
✅ Made case_type nullable
✅ SUCCESS! All columns are present.
```

---

## Alternative: Railway CLI (If Script Doesn't Work)

If the script method doesn't work, try Railway CLI:

### Step 1: Install Railway CLI
```powershell
npm install -g @railway/cli
```

### Step 2: Login
```powershell
railway login
```

### Step 3: Link to Project
```powershell
cd C:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro
railway link
```
Select your project when prompted.

### Step 4: Run SQL
```powershell
railway run psql $DATABASE_URL -c "ALTER TABLE lab_prescriptions ADD COLUMN IF NOT EXISTS case_type_upper TEXT, ADD COLUMN IF NOT EXISTS case_type_lower TEXT; ALTER TABLE lab_prescriptions ALTER COLUMN case_type DROP NOT NULL;"
```

---

## Alternative: Railway SQL Editor (If You Can Find It)

If you can find the Query tab in Railway:

1. Go to **Railway** → Your project
2. Click on the **Postgres** service
3. Look for **"Query"**, **"SQL"**, or **"Query Editor"** tab
4. Run this SQL:

```sql
ALTER TABLE lab_prescriptions 
ADD COLUMN IF NOT EXISTS case_type_upper TEXT,
ADD COLUMN IF NOT EXISTS case_type_lower TEXT;

ALTER TABLE lab_prescriptions 
ALTER COLUMN case_type DROP NOT NULL;
```

---

**After adding the columns, Railway will auto-redeploy and your app will work!**
