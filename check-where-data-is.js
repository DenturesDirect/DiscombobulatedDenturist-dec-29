// Script to check where your data actually is
// This will help us figure out which database has your real data

import pg from 'pg';
const { Pool } = pg;

async function checkDatabase(connectionString, name) {
  console.log(`\n🔍 Checking ${name}...`);
  console.log(`   Connection: ${connectionString.replace(/:[^:@]+@/, ':****@')}`); // Hide password
  
  try {
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
    
    // Check if we can connect
    const client = await pool.connect();
    console.log(`   ✅ Connected successfully`);
    
    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(`   📊 Found ${tables.length} tables:`, tables.join(', '));
    
    // Check data counts for key tables
    const keyTables = ['users', 'patients', 'clinical_notes', 'tasks', 'lab_notes', 'admin_notes', 'patient_files'];
    const dataCounts = {};
    
    for (const table of keyTables) {
      if (tables.includes(table)) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = parseInt(countResult.rows[0].count);
          dataCounts[table] = count;
          if (count > 0) {
            console.log(`   📈 ${table}: ${count} records`);
          }
        } catch (err) {
          // Table might exist but have issues
          dataCounts[table] = 'error';
        }
      }
    }
    
    // Check specifically for your account
    if (tables.includes('users')) {
      try {
        const userResult = await client.query(`
          SELECT email, "firstName", "lastName", role, id 
          FROM users 
          WHERE email = 'damien@denturesdirect.ca'
        `);
        if (userResult.rows.length > 0) {
          console.log(`   👤 Your account found:`, userResult.rows[0]);
        } else {
          console.log(`   ⚠️  Your account NOT found in this database`);
        }
      } catch (err) {
        console.log(`   ❌ Error checking for your account:`, err.message);
      }
    }
    
    client.release();
    await pool.end();
    
    return { success: true, tables, dataCounts };
    
  } catch (error) {
    console.log(`   ❌ Connection failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Checking where your data actually is...\n');
  console.log('This will check both Railway PostgreSQL and Supabase to see where your data exists.\n');
  
  // Get connection strings from environment or ask user
  const railwayDbUrl = process.env.RAILWAY_DATABASE_URL || process.argv[2];
  const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL || process.argv[3];
  
  if (!railwayDbUrl && !supabaseDbUrl) {
    console.log('❌ No database URLs provided.');
    console.log('\nUsage:');
    console.log('  node check-where-data-is.js [railway-db-url] [supabase-db-url]');
    console.log('\nOr set environment variables:');
    console.log('  RAILWAY_DATABASE_URL=... SUPABASE_DATABASE_URL=... node check-where-data-is.js');
    console.log('\nTo get the URLs:');
    console.log('  Railway: Railway Dashboard → PostgreSQL service → Variables → DATABASE_URL');
    console.log('  Supabase: Supabase Dashboard → Settings → Database → Connection string (URI)');
    process.exit(1);
  }
  
  const results = {};
  
  if (railwayDbUrl) {
    results.railway = await checkDatabase(railwayDbUrl, 'Railway PostgreSQL');
  } else {
    console.log('\n⚠️  Railway PostgreSQL URL not provided - skipping');
  }
  
  if (supabaseDbUrl) {
    results.supabase = await checkDatabase(supabaseDbUrl, 'Supabase PostgreSQL');
  } else {
    console.log('\n⚠️  Supabase PostgreSQL URL not provided - skipping');
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY:');
  console.log('='.repeat(50));
  
  if (results.railway) {
    console.log('\n🚂 Railway PostgreSQL:');
    if (results.railway.success) {
      const totalRecords = Object.values(results.railway.dataCounts || {})
        .filter(v => typeof v === 'number')
        .reduce((sum, count) => sum + count, 0);
      console.log(`   ✅ Connected`);
      console.log(`   📊 Total records: ${totalRecords}`);
      if (totalRecords === 0) {
        console.log(`   ⚠️  Database is EMPTY - no data found`);
      } else {
        console.log(`   ✅ Has data!`);
      }
    } else {
      console.log(`   ❌ Could not connect`);
    }
  }
  
  if (results.supabase) {
    console.log('\n☁️  Supabase PostgreSQL:');
    if (results.supabase.success) {
      const totalRecords = Object.values(results.supabase.dataCounts || {})
        .filter(v => typeof v === 'number')
        .reduce((sum, count) => sum + count, 0);
      console.log(`   ✅ Connected`);
      console.log(`   📊 Total records: ${totalRecords}`);
      if (totalRecords === 0) {
        console.log(`   ⚠️  Database is EMPTY - no data found`);
      } else {
        console.log(`   ✅ Has data!`);
      }
    } else {
      console.log(`   ❌ Could not connect`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n💡 Next steps:');
  console.log('   - The database with the most records is likely where your data is');
  console.log('   - The database with your account (damien@denturesdirect.ca) is the active one');
  console.log('   - We should point Railway to whichever database has your data\n');
}

main().catch(console.error);
