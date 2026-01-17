import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

console.log('🔍 Diagnosing login issue...\n');
console.log('📊 DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password

const pool = new Pool({ connectionString: DATABASE_URL });

async function diagnose() {
  try {
    // Test connection
    console.log('\n1️⃣ Testing database connection...');
    const testResult = await pool.query('SELECT NOW()');
    console.log('   ✅ Connected to database');
    console.log('   Server time:', testResult.rows[0].now);

    // Check user account
    console.log('\n2️⃣ Checking user account...');
    const userResult = await pool.query(
      "SELECT id, email, password, role, \"firstName\", \"lastName\" FROM users WHERE email = $1",
      ['damien@denturesdirect.ca']
    );

    if (userResult.rows.length === 0) {
      console.log('   ❌ User account NOT FOUND');
      console.log('   → Account needs to be created');
      return;
    }

    const user = userResult.rows[0];
    console.log('   ✅ User account found');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Name:', `${user.firstName || ''} ${user.lastName || ''}`.trim());

    // Check password
    console.log('\n3️⃣ Checking password...');
    if (!user.password) {
      console.log('   ❌ Password is NULL');
      console.log('   → Password needs to be set');
      
      // Set password
      console.log('\n4️⃣ Setting password...');
      const hashedPassword = await bcrypt.hash('TempPassword123!', 12);
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, 'damien@denturesdirect.ca']
      );
      console.log('   ✅ Password set to: TempPassword123!');
    } else {
      console.log('   ✅ Password is set');
      
      // Test password
      console.log('\n4️⃣ Testing password verification...');
      const isValid = await bcrypt.compare('TempPassword123!', user.password);
      if (isValid) {
        console.log('   ✅ Password "TempPassword123!" is CORRECT');
      } else {
        console.log('   ❌ Password "TempPassword123!" is INCORRECT');
        console.log('   → Password hash:', user.password.substring(0, 20) + '...');
      }
    }

    // Check allowed emails
    console.log('\n5️⃣ Checking allowed emails...');
    const allowedEmails = [
      'damien@denturesdirect.ca',
      'michael@denturesdirect.ca',
      'luisa@denturesdirect.ca',
      'info@denturesdirect.ca'
    ];
    if (allowedEmails.includes(user.email.toLowerCase())) {
      console.log('   ✅ Email is in allowed list');
    } else {
      console.log('   ❌ Email is NOT in allowed list');
    }

    console.log('\n✅ Diagnosis complete!');
    console.log('\n📝 Summary:');
    console.log('   - Database: Connected');
    console.log('   - Account: Found');
    console.log('   - Password:', user.password ? 'Set' : 'NOT SET');
    console.log('   - Email:', allowedEmails.includes(user.email.toLowerCase()) ? 'Allowed' : 'NOT ALLOWED');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Code:', error.code);
    if (error.code === 'ENETUNREACH' || error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Database connection failed!');
      console.error('   This means DATABASE_URL is pointing to the wrong database.');
      console.error('   Check Railway → Web Service → Variables → DATABASE_URL');
      console.error('   It should point to Railway PostgreSQL, not Supabase.');
    }
  } finally {
    await pool.end();
  }
}

diagnose();
