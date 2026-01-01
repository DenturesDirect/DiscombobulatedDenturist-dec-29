-- Migration: Add text_notifications column to patients table
-- Run this in Railway Postgres SQL editor if the column doesn't exist

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS text_notifications BOOLEAN DEFAULT false NOT NULL;
