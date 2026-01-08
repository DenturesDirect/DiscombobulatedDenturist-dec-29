-- Add payment status columns to patients table
-- Run this SQL in your Supabase or Railway database

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS exam_paid TEXT,
ADD COLUMN IF NOT EXISTS repair_paid TEXT,
ADD COLUMN IF NOT EXISTS new_denture_paid TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('exam_paid', 'repair_paid', 'new_denture_paid');