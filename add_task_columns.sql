-- Migration to add completedBy and completedAt columns to tasks table
-- Run this in your database SQL editor (Railway, Supabase, etc.)

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS completed_by TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
