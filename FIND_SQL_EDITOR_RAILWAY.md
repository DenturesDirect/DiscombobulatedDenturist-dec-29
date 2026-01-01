# 🔍 Find SQL Editor in Railway Postgres

## I See the Form Interface!

You're seeing the "Create table" form, which only creates one table at a time. We need to find the **SQL Query Editor** instead.

---

## Look for These Options:

### Option 1: Check Other Tabs
1. In the **"Database"** tab, you're on **"Data"** sub-tab
2. **Look for other sub-tabs** like:
   - **"Query"** 
   - **"SQL"**
   - **"Query Editor"**
   - Or a **"Run SQL"** button

### Option 2: Check the Top Menu
1. Look at the **top of the page** (above the tabs)
2. Look for buttons like:
   - **"Query"**
   - **"SQL Editor"**
   - **"Run Query"**
   - **"Execute SQL"**

### Option 3: Check the Three-Dots Menu
1. Look for a **three-dots menu (⋮)** near the "Create table" form
2. It might have a **"Query"** or **"SQL"** option

---

## Alternative: Use Railway CLI (Easiest!)

If you can't find the SQL editor, use Railway CLI to run the SQL directly:

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
cd DentureFlowPro
railway link
```
Select your project when prompted.

### Step 4: Run SQL File
```powershell
railway run psql $DATABASE_URL -f create_tables.sql
```

Or paste the SQL directly:
```powershell
railway run psql $DATABASE_URL -c "CREATE TABLE IF NOT EXISTS sessions (sid VARCHAR PRIMARY KEY, sess JSONB NOT NULL, expire TIMESTAMP NOT NULL); CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire); CREATE TABLE IF NOT EXISTS users (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR UNIQUE, password VARCHAR, first_name VARCHAR, last_name VARCHAR, role VARCHAR DEFAULT 'staff', profile_image_url VARCHAR, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()); CREATE TABLE IF NOT EXISTS login_attempts (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR NOT NULL, success BOOLEAN NOT NULL, ip_address VARCHAR, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS patients (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, date_of_birth TEXT, phone TEXT, email TEXT, is_cdcp BOOLEAN DEFAULT false NOT NULL, work_insurance BOOLEAN DEFAULT false NOT NULL, copay_discussed BOOLEAN DEFAULT false NOT NULL, current_tooth_shade TEXT, requested_tooth_shade TEXT, photo_url TEXT, upper_denture_type TEXT, lower_denture_type TEXT, assigned_to TEXT, next_step TEXT, due_date TIMESTAMP, last_step_completed TEXT, last_step_date TIMESTAMP, email_notifications BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS appointments (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), appointment_date TIMESTAMP NOT NULL, appointment_type TEXT, status TEXT NOT NULL DEFAULT 'scheduled', notes TEXT, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS clinical_notes (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), appointment_id VARCHAR REFERENCES appointments(id), content TEXT NOT NULL, note_date TIMESTAMP, created_by TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS tasks (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, assignee TEXT NOT NULL, patient_id VARCHAR REFERENCES patients(id), due_date TIMESTAMP, priority TEXT NOT NULL DEFAULT 'normal', status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS patient_files (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), filename TEXT NOT NULL, file_url TEXT NOT NULL, file_type TEXT, description TEXT, uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS lab_notes (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), content TEXT NOT NULL, created_by TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS admin_notes (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), content TEXT NOT NULL, created_by TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL); CREATE TABLE IF NOT EXISTS lab_prescriptions (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), patient_id VARCHAR NOT NULL REFERENCES patients(id), lab_name TEXT NOT NULL, case_type TEXT NOT NULL, arch TEXT NOT NULL, fabrication_stage TEXT NOT NULL, deadline TIMESTAMP, digital_files TEXT[], design_instructions TEXT, existing_denture_reference TEXT, bite_notes TEXT, shipping_instructions TEXT, special_notes TEXT, status TEXT NOT NULL DEFAULT 'draft', sent_at TIMESTAMP, created_by TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL);"
```

---

## Alternative: Use a Database Client

If Railway doesn't have a SQL editor, you can connect with a database client:

1. **Get connection string:**
   - Postgres service → **"Variables"** tab
   - Copy `DATABASE_URL`

2. **Use a client like:**
   - **pgAdmin** (free, desktop app)
   - **DBeaver** (free, desktop app)
   - **TablePlus** (paid, but great UI)
   - **Postico** (Mac only)

3. **Connect and run the SQL** from `create_tables.sql`

---

## What I Recommend

**Try this order:**
1. **First:** Look around the "Database" tab for a "Query" button or sub-tab
2. **If not found:** Use **Railway CLI** (Option 2 above) - it's the most reliable
3. **Last resort:** Use a database client

---

## Tell Me What You See

Can you see:
- Any "Query" or "SQL" buttons?
- Any other sub-tabs besides "Data", "Extensions", "Credentials"?
- A menu or dropdown with SQL options?

If not, let's use Railway CLI - it's actually easier! 😊
