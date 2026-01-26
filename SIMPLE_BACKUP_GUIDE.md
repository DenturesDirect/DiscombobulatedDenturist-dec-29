# Simple Patient Data Backup Guide

## 🎯 Easiest Method: Get DATABASE_URL from Railway

### Step 1: Get Your Database URL (Public Connection String)

⚠️ **IMPORTANT:** You need the **PUBLIC** connection string, not the internal one!

**Option A: From Railway Postgres Service (Recommended)**
1. Go to https://railway.app
2. Click on your project
3. Click on the **"Postgres"** service (the database icon)
4. Click the **"Connect"** or **"Data"** tab
5. Look for **"Public Network"** or **"Connection String"** section
6. Copy the connection string that contains a public hostname (NOT `railway.internal`)
   - Should look like: `postgresql://postgres:password@something.railway.app:5432/railway`
   - OR: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

**Option B: From Railway Postgres Variables**
1. Go to Railway → **Postgres** service → **"Variables"** tab
2. Look for `DATABASE_URL` or `POSTGRES_URL` 
3. If it says `railway.internal`, look for another variable like `PUBLIC_DATABASE_URL` or `POSTGRES_PUBLIC_URL`
4. If only internal URL exists, you may need to enable "Public Networking" in Postgres settings

**Option C: Use Railway CLI (if installed)**
```powershell
railway connect postgres
```

### Step 2: Run Backup Locally

**Navigate to the project folder first:**
```powershell
cd DentureFlowPro
```

**Then run the backup with quotes around the URL:**
```powershell
$env:DATABASE_URL="postgresql://postgres:password@public-hostname.railway.app:5432/railway"; npm run backup-data
```

**Example (with quotes!):**
```powershell
$env:DATABASE_URL="postgresql://postgres:yourpassword@containers-us-west-123.railway.app:5432/railway"; npm run backup-data
```

⚠️ **Note:** If you only have the internal URL (`railway.internal`), you cannot run backups locally. Instead:
- Run the backup from Railway itself (use Railway's shell/CLI)
- OR enable Public Networking on your Postgres service in Railway

### Step 3: Find Your Backup
Your backup will be saved to:
```
DentureFlowPro/backups/backup-[timestamp]/
```

Inside you'll find:
- `patients.json` - All your patients
- `patient-files.json` - All file URLs (photos, documents)
- `clinical-notes.json` - All clinical notes
- `summary.json` - Quick overview
- `patient-file-urls.csv` - CSV file with all file URLs

---

## 📋 What Gets Backed Up

✅ All patient records  
✅ All clinical notes  
✅ All lab notes  
✅ All admin notes  
✅ All tasks  
✅ **All patient files/photos (with URLs)**  
✅ All lab prescriptions  

---

## ⚠️ Important Notes

- The backup includes **URLs to your photos/files**, not the actual files
- File URLs point to your storage service
- Keep the backup folder safe - it's your patient data!

---

## 🆘 Troubleshooting

**"DATABASE_URL not set" error?**
- Make sure you copied the entire URL from Railway
- Make sure there are no extra spaces
- Try wrapping it in quotes: `"your_url_here"`

**"Cannot connect to database" error?**
- Check that your DATABASE_URL is correct
- Make sure your Railway database is running
- The URL should start with `postgresql://`
- **If you see `ENOTFOUND postgres.railway.internal`:** You're using the internal URL. Get the public connection string from Railway Postgres → Connect tab, or enable Public Networking.

**"ENOTFOUND postgres.railway.internal" error?**
- This means you're using Railway's internal hostname, which only works inside Railway
- Get the **public** connection string from Railway Postgres service → Connect/Data tab
- The public URL will have a hostname like `something.railway.app` (NOT `railway.internal`)

---

**That's it! Your patient data will be backed up to JSON files you can save/print.**
