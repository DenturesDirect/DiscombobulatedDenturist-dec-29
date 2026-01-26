# Patient Data Backup Instructions

## ⚠️ IMPORTANT: Backup Your Patient Data Before Pushing Changes!

Your patient data is stored in PostgreSQL. Before making any changes, back it up!

---

## Quick Backup (Local Development)

If you have `DATABASE_URL` set in your `.env` file:

```bash
npm run backup-data
```

---

## Backup from Railway

### Option 1: Using Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Run backup script with Railway's DATABASE_URL**:
   ```bash
   railway run npm run backup-data
   ```

3. **Download the backup folder** from Railway's file system or check logs

### Option 2: Export DATABASE_URL and Run Locally

1. **Get your DATABASE_URL from Railway:**
   - Go to Railway dashboard → Your project → Variables
   - Copy the `DATABASE_URL` value

2. **Run backup locally:**
   ```bash
   DATABASE_URL="your_railway_database_url" npm run backup-data
   ```

### Option 3: Direct PostgreSQL Dump (Most Reliable)

If you have `psql` installed:

```bash
# Get DATABASE_URL from Railway dashboard, then:
pg_dump "your_database_url" > backup-$(date +%Y%m%d-%H%M%S).sql
```

Or using Railway CLI:
```bash
railway connect postgres
# Then in psql:
\copy (SELECT * FROM patients) TO 'patients.csv' CSV HEADER;
\copy (SELECT * FROM clinical_notes) TO 'clinical_notes.csv' CSV HEADER;
\copy (SELECT * FROM patient_files) TO 'patient_files.csv' CSV HEADER;
# etc.
```

---

## What Gets Backed Up

✅ **All Patient Records** - Names, contact info, treatment status
✅ **All Clinical Notes** - Complete note content with dates
✅ **All Lab Notes** - Lab work notes
✅ **All Admin Notes** - Administrative notes
✅ **All Tasks** - Pending and completed tasks
✅ **All Patient Files** - Photo/document URLs and metadata
✅ **All Lab Prescriptions** - Prescription details
✅ **Offices** - Office information

## Backup Location

Backups are saved to: `DentureFlowPro/backups/backup-[timestamp]/`

Each backup includes:
- `patients.json` - All patient records
- `clinical-notes.json` - All clinical notes  
- `lab-notes.json` - All lab notes
- `admin-notes.json` - All admin notes
- `tasks.json` - All tasks
- `patient-files.json` - **All files with URLs** ⚠️ Important!
- `lab-prescriptions.json` - All prescriptions
- `offices.json` - All offices
- `summary.json` - Summary statistics
- `patient-file-urls.csv` - CSV with all file URLs for easy reference
- `README.md` - Backup information

## ⚠️ Important Notes About File URLs

The backup includes **URLs to your photos/files**, but **NOT the actual files themselves**.

- File URLs point to your storage service (Railway Storage, Supabase Storage, or Replit Storage)
- If you change storage services, existing URLs may break
- The backup preserves URLs so you know what files exist
- You may need to migrate actual files if changing storage services

## Before Making Changes

**ALWAYS run a backup before:**
- ✅ Pushing major code changes
- ✅ Changing storage services  
- ✅ Updating database schema
- ✅ Any deployment
- ✅ Making changes that could affect data

## Restoring Data

If you need to restore:
1. JSON files can be imported back into PostgreSQL
2. File URLs in backup show where files are stored
3. If storage service changed, update file URLs accordingly

---

## Quick Commands

**Local backup:**
```bash
npm run backup-data
```

**Railway backup:**
```bash
railway run npm run backup-data
```

**PostgreSQL dump:**
```bash
pg_dump $DATABASE_URL > backup.sql
```

---

**Run backup now before pushing changes!**
