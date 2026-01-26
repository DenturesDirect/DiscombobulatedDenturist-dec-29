# How to Move Patients to Correct Office

This guide explains how to use the `move-patients-to-office.ts` script to fix patients that were assigned to the wrong office.

## Where to Run the Script

**Run this script from your terminal/command prompt in the project root directory:**

```
c:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro\
```

### Step-by-Step Instructions

#### 1. Open Terminal/Command Prompt

- **Windows**: Open PowerShell or Command Prompt
- **Mac/Linux**: Open Terminal

#### 2. Navigate to Project Directory

```bash
cd "c:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro"
```

#### 3. Get Your Database URL

You need your `DATABASE_URL` from Railway:

- Go to your Railway dashboard
- Select your database service
- Copy the `DATABASE_URL` connection string (it looks like: `postgresql://user:password@host:port/database`)

**Option A: Set it temporarily (recommended for one-time use)**
```bash
# Windows PowerShell:
$env:DATABASE_URL="your_database_url_here"

# Windows Command Prompt:
set DATABASE_URL=your_database_url_here

# Mac/Linux:
export DATABASE_URL="your_database_url_here"
```

**Option B: Add to .env file (if you have one)**
Create or edit `.env` file in the project root:
```
DATABASE_URL=your_database_url_here
```

#### 4. Find the Patient IDs You Need to Move

You need to identify which patients belong to Toronto Smile Centre but are currently in Dentures Direct.

**Option A: From the Database**
- Connect to your database and run:
```sql
SELECT id, name, office_id 
FROM patients 
WHERE office_id = (SELECT id FROM offices WHERE name = 'Dentures Direct')
ORDER BY name;
```

**Option B: From the Application UI**
- Log into the application
- Go to Active Patients page
- Filter by "Dentures Direct" office
- Identify the Toronto Smile Centre patients (you'll need to check each patient's details or notes to confirm)
- Note down their patient IDs (you can see these in the URL when viewing a patient: `/patient/{id}`)

#### 5. Test with Dry Run First (Recommended!)

Always test first to see what will change:

```bash
# Windows PowerShell:
npm run move-patients-to-office -- --office "Toronto Smile Centre" --patients "patient-id-1,patient-id-2,patient-id-3" --dry-run

# Windows Command Prompt (if PowerShell doesn't work):
npm run move-patients-to-office -- --office "Toronto Smile Centre" --patients "patient-id-1,patient-id-2" --dry-run
```

Replace `patient-id-1,patient-id-2,patient-id-3` with the actual patient IDs you found.

#### 6. Run the Actual Migration

Once you've verified the dry run looks correct, run it for real (remove `--dry-run`):

```bash
npm run move-patients-to-office -- --office "Toronto Smile Centre" --patients "patient-id-1,patient-id-2,patient-id-3"
```

The script will:
- Wait 3 seconds (you can press Ctrl+C to cancel)
- Update all related records (patients, appointments, notes, tasks, files, etc.)
- Show you a summary of what was changed

## Alternative: Using a JSON File

If you have many patient IDs, you can create a JSON file:

**Create `patient-ids.json` in the project root:**
```json
[
  "patient-id-1",
  "patient-id-2",
  "patient-id-3"
]
```

Then run:
```bash
npm run move-patients-to-office -- --office "Toronto Smile Centre" --patients-file patient-ids.json
```

## Troubleshooting

**Error: DATABASE_URL not set**
- Make sure you've set the environment variable or added it to `.env`
- In PowerShell, use `$env:DATABASE_URL="..."` (with quotes)
- In Command Prompt, use `set DATABASE_URL=...` (no quotes)

**Error: Office not found**
- Check the exact office name spelling (case-sensitive)
- The script will show you available offices if it can't find the one you specified

**Error: Patient IDs not found**
- Double-check the patient IDs are correct
- Make sure you're using the actual UUIDs from the database, not names

## What Gets Updated

The script updates these tables for each patient:
- ✅ `patients` - The main patient record
- ✅ `appointments` - All appointments
- ✅ `clinical_notes` - All clinical notes
- ✅ `tasks` - All tasks
- ✅ `patient_files` - All uploaded files
- ✅ `lab_notes` - All lab notes
- ✅ `admin_notes` - All admin notes
- ✅ `lab_prescriptions` - All lab prescriptions

All records are moved atomically - if one fails, none are updated.
