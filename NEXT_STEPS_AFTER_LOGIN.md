# ✅ Next Steps After Login

## Step 1: Link to Your Railway Project

Run this command:

```powershell
npx @railway/cli link
```

**What will happen:**
1. You'll see a list of your Railway projects
2. Use **arrow keys** (↑↓) to select your project
3. It's probably called **"protective-ambition"** or similar
4. Press **Enter** to confirm

---

## Step 2: Create All Tables

After linking, run this command:

```powershell
npx @railway/cli run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

**What will happen:**
1. Railway will connect to your Postgres database
2. It will run the SQL file to create all 11 tables
3. You'll see success messages for each table created
4. Wait for it to finish!

---

## If the File Path Doesn't Work

If you get an error about the file not found, try this instead:

```powershell
npx @railway/cli run --service Postgres psql $DATABASE_URL -c "CREATE TABLE IF NOT EXISTS sessions (sid VARCHAR PRIMARY KEY, sess JSONB NOT NULL, expire TIMESTAMP NOT NULL); CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire); CREATE TABLE IF NOT EXISTS users (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR UNIQUE, password VARCHAR, first_name VARCHAR, last_name VARCHAR, role VARCHAR DEFAULT 'staff', profile_image_url VARCHAR, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()); CREATE TABLE IF NOT EXISTS login_attempts (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR NOT NULL, success BOOLEAN NOT NULL, ip_address VARCHAR, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS patients (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, date_of_birth TEXT, phone TEXT, email TEXT, is_cdcp BOOLEAN DEFAULT false NOT NULL, work_insurance BOOLEAN DEFAULT false NOT NULL, copay_discussed BOOLEAN DEFAULT false NOT NULL, current_tooth_shade TEXT, requested_tooth_shade TEXT, photo_url TEXT, upper_denture_type TEXT, lower_denture_type TEXT, assigned_to TEXT, next_step TEXT, due_date TIMESTAMP, last_step_completed TEXT, last_step_date TIMESTAMP, email_notifications BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS appointments (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), appointment_date TIMESTAMP NOT NULL, appointment_type TEXT, status TEXT NOT NULL DEFAULT 'scheduled', notes TEXT, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS clinical_notes (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), appointment_id VARCHAR REFERENCES appointments(id), content TEXT NOT NULL, note_date TIMESTAMP, created_by TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS tasks (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, assignee TEXT NOT NULL, patient_id VARCHAR REFERENCES patients(id), due_date TIMESTAMP, priority TEXT NOT NULL DEFAULT 'normal', status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS patient_files (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), filename TEXT NOT NULL, file_url TEXT NOT NULL, file_type TEXT, description TEXT, uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS lab_notes (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), content TEXT NOT NULL, created_by TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS admin_notes (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), content TEXT NOT NULL, created_by TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS lab_prescriptions (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), lab_name TEXT NOT NULL, case_type TEXT NOT NULL, arch TEXT NOT NULL, fabrication_stage TEXT NOT NULL, deadline TIMESTAMP, digital_files TEXT[], design_instructions TEXT, existing_denture_reference TEXT, bite_notes TEXT, shipping_instructions TEXT, special_notes TEXT, status TEXT NOT NULL DEFAULT 'draft', sent_at TIMESTAMP, created_by TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL);"
```

(This is all the SQL in one command - it's long but it works!)

---

## Step 3: Verify Tables Created

After creating tables, verify with:

```powershell
npx @railway/cli run --service Postgres psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

You should see **11** (the number of tables).

---

## Step 4: Restart Your Web Service

After tables are created:
1. Go to Railway dashboard in your browser
2. Click on **"web"** service
3. Click **"Restart"** on the crashed deployment
4. The app should start successfully! 🎉

---

## Quick Summary

```powershell
# 1. Link to project
npx @railway/cli link

# 2. Create tables
npx @railway/cli run --service Postgres psql $DATABASE_URL -f create_tables.sql

# 3. Verify (optional)
npx @railway/cli run --service Postgres psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

**Start with Step 1: Run `npx @railway/cli link`** 🚀
