// Script to add text_notifications column to patients table
// Run with: node add-text-notifications.js

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('   Set it with: $env:DATABASE_URL="your-database-url"');
  process.exit(1);
}

async function addColumn() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    console.log('📝 Adding text_notifications column...');
    await client.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS text_notifications BOOLEAN DEFAULT false NOT NULL;
    `);
    console.log('✅ Column added successfully');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'patients' AND column_name = 'text_notifications';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verification: Column exists');
      console.log('   Details:', result.rows[0]);
    } else {
      console.log('⚠️  Warning: Column not found after adding');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected');
  }
}

addColumn();
