// Script to set passwords for all staff accounts
// Run this in Railway Shell: node set-passwords.js

import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found!');
  process.exit(1);
}

const password = 'TempPassword123!';
const SALT_ROUNDS = 12;

async function setPasswords() {
  console.log('🔐 Setting passwords for staff accounts...\n');
  
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // Generate password hash
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('✅ Generated password hash');
    
    const emails = [
      'damien@denturesdirect.ca',
      'michael@denturesdirect.ca',
      'luisa@denturesdirect.ca',
      'info@denturesdirect.ca'
    ];
    
    for (const email of emails) {
      const result = await pool.query(
        `UPDATE users 
         SET password = $1 
         WHERE email = $2 AND password IS NULL
         RETURNING email, "firstName", "lastName"`,
        [hashedPassword, email]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(`  ✅ Set password for ${user.email} (${user.firstName} ${user.lastName})`);
      } else {
        // Check if user exists but already has password
        const checkResult = await pool.query(
          'SELECT email, password IS NOT NULL as has_password FROM users WHERE email = $1',
          [email]
        );
        
        if (checkResult.rows.length > 0) {
          if (checkResult.rows[0].has_password) {
            console.log(`  ⚠️  ${email} already has a password (not updated)`);
          } else {
            console.log(`  ❌ ${email} not found or password update failed`);
          }
        } else {
          console.log(`  ❌ ${email} not found in database`);
        }
      }
    }
    
    // Verify all passwords are set
    console.log('\n📊 Verification:');
    const verifyResult = await pool.query(
      `SELECT email, 
              CASE 
                WHEN password IS NULL THEN '❌ No password'
                ELSE '✅ Has password'
              END as status
       FROM users 
       WHERE email IN ($1, $2, $3, $4)
       ORDER BY email`,
      emails
    );
    
    for (const row of verifyResult.rows) {
      console.log(`  ${row.status} - ${row.email}`);
    }
    
    console.log('\n✅ Done!');
    console.log(`\n💡 You can now log in with:`);
    console.log(`   Email: damien@denturesdirect.ca`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  IMPORTANT: Change your password after logging in!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setPasswords();
