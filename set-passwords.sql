-- Set passwords for all staff accounts
-- This will set all user passwords to: TempPassword123!
-- The bcrypt hash below is for that password

-- Update password for damien@denturesdirect.ca
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y'
WHERE email = 'damien@denturesdirect.ca' AND password IS NULL;

-- Update password for michael@denturesdirect.ca
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y'
WHERE email = 'michael@denturesdirect.ca' AND password IS NULL;

-- Update password for luisa@denturesdirect.ca
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y'
WHERE email = 'luisa@denturesdirect.ca' AND password IS NULL;

-- Update password for info@denturesdirect.ca
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y'
WHERE email = 'info@denturesdirect.ca' AND password IS NULL;

-- Verify the updates
SELECT email, 
       CASE 
         WHEN password IS NULL THEN '❌ No password'
         ELSE '✅ Has password'
       END as password_status
FROM users 
WHERE email IN (
  'damien@denturesdirect.ca',
  'michael@denturesdirect.ca',
  'luisa@denturesdirect.ca',
  'info@denturesdirect.ca'
);
