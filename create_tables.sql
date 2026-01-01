-- Create all database tables for DentureFlowPro
-- Run this SQL in Railway's Postgres "Query" or "Data" tab

-- 1. Sessions table (for user sessions)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  password VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  role VARCHAR DEFAULT 'staff',
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Login attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Patients table (no dependencies)
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date_of_birth TEXT,
  phone TEXT,
  email TEXT,
  is_cdcp BOOLEAN DEFAULT false NOT NULL,
  work_insurance BOOLEAN DEFAULT false NOT NULL,
  copay_discussed BOOLEAN DEFAULT false NOT NULL,
  current_tooth_shade TEXT,
  requested_tooth_shade TEXT,
  photo_url TEXT,
  upper_denture_type TEXT,
  lower_denture_type TEXT,
  assigned_to TEXT,
  next_step TEXT,
  due_date TIMESTAMP,
  last_step_completed TEXT,
  last_step_date TIMESTAMP,
  email_notifications BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 5. Appointments table (depends on patients)
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id),
  appointment_date TIMESTAMP NOT NULL,
  appointment_type TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 6. Clinical notes table (depends on patients, appointments)
CREATE TABLE IF NOT EXISTS clinical_notes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id),
  appointment_id VARCHAR REFERENCES appointments(id),
  content TEXT NOT NULL,
  note_date TIMESTAMP,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 7. Tasks table (depends on patients)
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT NOT NULL,
  patient_id VARCHAR REFERENCES patients(id),
  due_date TIMESTAMP,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 8. Patient files table (depends on patients)
CREATE TABLE IF NOT EXISTS patient_files (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  description TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 9. Lab notes table (depends on patients)
CREATE TABLE IF NOT EXISTS lab_notes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id),
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 10. Admin notes table (depends on patients)
CREATE TABLE IF NOT EXISTS admin_notes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id),
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 11. Lab prescriptions table (depends on patients)
CREATE TABLE IF NOT EXISTS lab_prescriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id),
  lab_name TEXT NOT NULL,
  case_type TEXT NOT NULL,
  arch TEXT NOT NULL,
  fabrication_stage TEXT NOT NULL,
  deadline TIMESTAMP,
  digital_files TEXT[],
  design_instructions TEXT,
  existing_denture_reference TEXT,
  bite_notes TEXT,
  shipping_instructions TEXT,
  special_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Done! All tables created.
-- You can verify by running: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
