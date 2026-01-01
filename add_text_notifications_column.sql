-- Add text_notifications column to patients table
-- Run this in Railway Postgres SQL Editor or via psql

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS text_notifications BOOLEAN DEFAULT false NOT NULL;

-- Verify it was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'text_notifications';
