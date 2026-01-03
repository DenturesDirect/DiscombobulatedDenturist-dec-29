// Script to add fabrication_stage_upper and fabrication_stage_lower columns to lab_prescriptions table
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please set it like this:');
  console.error('  $env:DATABASE_URL="your-database-url-here"');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
});

async function addColumns() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    console.log('📝 Adding columns...');
    
    // Add the new columns
    await client.query(`
      ALTER TABLE lab_prescriptions 
      ADD COLUMN IF NOT EXISTS fabrication_stage_upper TEXT,
      ADD COLUMN IF NOT EXISTS fabrication_stage_lower TEXT;
    `);
    
    console.log('✅ Columns added');

    // Make old columns nullable
    await client.query(`
      ALTER TABLE lab_prescriptions 
      ALTER COLUMN arch DROP NOT NULL,
      ALTER COLUMN fabrication_stage DROP NOT NULL;
    `);
    
    console.log('✅ Made arch and fabrication_stage nullable');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'lab_prescriptions' 
      AND column_name IN ('arch', 'fabrication_stage', 'fabrication_stage_upper', 'fabrication_stage_lower')
      ORDER BY column_name;
    `);

    console.log('\n📊 Verification:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    if (result.rows.length === 4) {
      console.log('\n✅ SUCCESS! All columns are present.');
    } else {
      console.log('\n⚠️  Warning: Expected 4 columns, found', result.rows.length);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addColumns();
