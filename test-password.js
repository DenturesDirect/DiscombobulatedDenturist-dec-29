import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Use the Railway PostgreSQL URL
const DATABASE_URL = 'postgresql://postgres:OsVPLpeawimURGdEWgZNMVmxJzlkpzdj@postgres.railway.internal:5432/railway';

const pool = new Pool({ connectionString: DATABASE_URL });

async function test() {
  try {
    console.log('🔍 Checking password for damien@denturesdirect.ca...\n');
    
    const result = await pool.query(
      "SELECT id, email, password FROM users WHERE email = $1",
      ['damien@denturesdirect.ca']
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    const user = result.rows[0];
    console.log('✅ User found:', user.email);
    console.log('   ID:', user.id);
    
    if (!user.password) {
      console.log('❌ Password is NULL - setting it now...');
      const hashed = await bcrypt.hash('TempPassword123!', 12);
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashed, user.email]);
      console.log('✅ Password set to: TempPassword123!');
    } else {
      console.log('✅ Password exists');
      console.log('   Hash:', user.password.substring(0, 30) + '...');
      
      // Test the password
      const isValid = await bcrypt.compare('TempPassword123!', user.password);
      console.log('   Test password "TempPassword123!":', isValid ? '✅ CORRECT' : '❌ WRONG');
      
      if (!isValid) {
        console.log('\n⚠️  Password hash doesn\'t match. Resetting...');
        const hashed = await bcrypt.hash('TempPassword123!', 12);
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashed, user.email]);
        console.log('✅ Password reset to: TempPassword123!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
  } finally {
    await pool.end();
  }
}

test();
