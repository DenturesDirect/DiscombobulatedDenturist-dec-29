import pg from 'pg';
const { Client } = pg;

const sql = `
  ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS exam_paid TEXT,
  ADD COLUMN IF NOT EXISTS repair_paid TEXT,
  ADD COLUMN IF NOT EXISTS new_denture_paid TEXT;
`;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    await client.query(sql);
    console.log('✓ Successfully added payment columns');
    
    // Verify columns were added
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'patients' 
      AND column_name IN ('exam_paid', 'repair_paid', 'new_denture_paid');
    `);
    
    console.log('\nColumns added:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();