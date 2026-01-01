// Script to create all database tables
// Run with: node create-tables.js

import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

// Read the SQL file
const sql = fs.readFileSync('./create_tables.sql', 'utf8');

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found!');
  console.error('Make sure you have DATABASE_URL set in Railway Variables');
  process.exit(1);
}

// Create connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function createTables() {
  try {
    console.log('🔗 Connecting to database...');
    
    // Remove comments and split by semicolons
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split by semicolons, but keep CREATE INDEX with its table
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    console.log('');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await pool.query(statement);
          // Extract table name for better logging
          const tableMatch = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i);
          const indexMatch = statement.match(/CREATE INDEX.*?ON\s+(\w+)/i);
          const name = tableMatch ? tableMatch[1] : (indexMatch ? `index on ${indexMatch[1]}` : `statement ${i + 1}`);
          console.log(`✅ ${name} - created`);
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.code === '42P07' || error.code === '42P16') {
            const tableMatch = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i);
            const indexMatch = statement.match(/CREATE INDEX.*?ON\s+(\w+)/i);
            const name = tableMatch ? tableMatch[1] : (indexMatch ? `index on ${indexMatch[1]}` : `statement ${i + 1}`);
            console.log(`ℹ️  ${name} - already exists (skipping)`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error(`   SQL: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    }
    
    console.log('');
    console.log('✅ All tables created successfully!');
    
    // Verify tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('');
    console.log(`📊 Created ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();
